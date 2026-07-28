import { createHash, randomBytes } from "node:crypto";
import { AuthActionType, AuthProvider, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  createUserWithRefreshToken,
  getUserByEmail,
  createRefreshToken,
  deleteExpiredRefreshTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  updateUserLastLogin,
  getUserById,
} from "@/server/repositories/user-repository";
import {
  CompleteOAuthRegistrationInput,
  LoginInput,
  RegisterInput,
} from "@/server/validators/auth-validator";
import { env } from "@/server/config/env";
import { conflict, notFound, unauthorized } from "@/server/errors/application-error";
import {
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  rotateRefreshSession,
} from "@/server/services/refresh-token-service";
import {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createOAuthUserWithSession,
  disconnectAuthAccount,
  linkAuthAccount,
  listAuthAccounts,
  replaceAuthActionToken,
  resolveOAuthUserWithSession,
} from "@/server/repositories/auth-repository";
import type { OAuthIdentity } from "@/server/services/oauth-service";
import { authEmailService } from "@/server/services/auth-email-service";
import type { AppLocale } from "@/i18n/config";

const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export class AuthService {
  async register(input: RegisterInput, locale: AppLocale) {
    const email = input.email.toLowerCase();
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw conflict("Email already registered");
    }

    const passwordHash = await hashPassword(input.password);
    const session = this.createSessionCredentials();
    const verification = this.createActionToken(VERIFY_EMAIL_TTL_MS);

    const user = await createUserWithRefreshToken({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      refreshTokenHash: hashRefreshToken(session.refreshToken),
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      actionToken: {
        tokenHash: verification.tokenHash,
        type: AuthActionType.VERIFY_EMAIL,
        expiresAt: verification.expiresAt,
      },
    });

    const emailSent = await this.deliver(() =>
      authEmailService.sendVerification(user.email, verification.token, locale));
    return { ...this.createAuthResult(user, session), emailSent };
  }

  async login(input: LoginInput) {
    const user = await getUserByEmail(input.email.toLowerCase());

    if (!user) {
      throw unauthorized("Invalid credentials");
    }

    const isPasswordValid = user.passwordHash && await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw unauthorized("Invalid credentials");
    }

    if (user.deletedAt) {
      throw unauthorized("Account has been deleted");
    }

    await updateUserLastLogin(user.id);

    const session = this.createSessionCredentials();

    await deleteExpiredRefreshTokens(user.id);
    await createRefreshToken(
      user.id,
      hashRefreshToken(session.refreshToken),
      session.refreshTokenExpiresAt,
    );

    return this.createAuthResult(user, session);
  }

  async refresh(refreshToken: string) {
    const session = await rotateRefreshSession(
      refreshToken,
      rotateRefreshToken,
    );
    if (!session) throw unauthorized("Invalid session");
    const { user, expiresAt, refreshToken: nextToken } = session;
    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken: this.generateAccessToken(user.id, user.email, user.role),
        refreshToken: nextToken,
        refreshTokenExpiresAt: expiresAt,
      },
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) await revokeRefreshToken(hashRefreshToken(refreshToken));
  }

  async verifyEmail(token: string) {
    const user = await consumeEmailVerificationToken(this.hashActionToken(token));
    if (!user) throw unauthorized("Invalid or expired verification link");
    return this.toPublicUser(user);
  }

  async resendVerification(userId: string, locale: AppLocale) {
    const user = await getUserById(userId);
    if (!user || user.deletedAt) throw unauthorized();
    if (user.emailVerified) return { emailSent: true };

    const verification = this.createActionToken(VERIFY_EMAIL_TTL_MS);
    await replaceAuthActionToken({
      userId,
      type: AuthActionType.VERIFY_EMAIL,
      tokenHash: verification.tokenHash,
      expiresAt: verification.expiresAt,
    });
    const emailSent = await this.deliver(() =>
      authEmailService.sendVerification(user.email, verification.token, locale));
    return { emailSent };
  }

  async requestPasswordReset(email: string, locale: AppLocale) {
    const user = await getUserByEmail(email.toLowerCase());
    if (!user || user.deletedAt) return;

    const reset = this.createActionToken(PASSWORD_RESET_TTL_MS);
    await replaceAuthActionToken({
      userId: user.id,
      type: AuthActionType.PASSWORD_RESET,
      tokenHash: reset.tokenHash,
      expiresAt: reset.expiresAt,
    });
    await this.deliver(() => authEmailService.sendPasswordReset(user.email, reset.token, locale));
  }

  async resetPassword(token: string, password: string) {
    const passwordHash = await hashPassword(password);
    const user = await consumePasswordResetToken(this.hashActionToken(token), passwordHash);
    if (!user) throw unauthorized("Invalid or expired reset link");
    return this.toPublicUser(user);
  }

  async signInWithOAuth(identity: OAuthIdentity) {
    const session = this.createSessionCredentials();
    const user = await resolveOAuthUserWithSession(identity, {
      refreshTokenHash: hashRefreshToken(session.refreshToken),
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
    });
    return user ? this.createAuthResult(user, session) : null;
  }

  async completeOAuthRegistration(
    identity: OAuthIdentity,
    input: CompleteOAuthRegistrationInput,
  ) {
    const session = this.createSessionCredentials();
    try {
      const user = await createOAuthUserWithSession(identity, input, {
        refreshTokenHash: hashRefreshToken(session.refreshToken),
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      });
      return this.createAuthResult(user, session);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflict("Account already exists");
      }
      throw error;
    }
  }

  async connectOAuthAccount(userId: string, identity: OAuthIdentity) {
    const account = await linkAuthAccount(userId, identity);
    if (!account) throw conflict("This account is already connected");
  }

  listConnectedAccounts(userId: string) {
    return listAuthAccounts(userId);
  }

  async disconnectOAuthAccount(userId: string, provider: AuthProvider) {
    const result = await disconnectAuthAccount(userId, provider);
    if (result === "LAST_METHOD") throw conflict("Cannot disconnect the last sign-in method");
    if (result === "NOT_FOUND") throw notFound("Connected account not found");
  }

  private createActionToken(ttlMs: number) {
    const token = randomBytes(32).toString("base64url");
    return {
      token,
      tokenHash: this.hashActionToken(token),
      expiresAt: new Date(Date.now() + ttlMs),
    };
  }

  private hashActionToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async deliver(delivery: () => Promise<boolean>) {
    try {
      return await delivery();
    } catch {
      console.error("Authentication email delivery failed");
      return false;
    }
  }

  private createSessionCredentials() {
    return {
      refreshToken: generateRefreshToken(),
      refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    };
  }

  private createAuthResult(
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: "SEEKER" | "RECRUITER" | "ADMIN";
      avatarUrl: string | null;
      emailVerified: boolean;
      createdAt: Date;
    },
    session: { refreshToken: string; refreshTokenExpiresAt: Date },
  ) {
    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken: this.generateAccessToken(user.id, user.email, user.role),
        ...session,
      },
    };
  }

  private toPublicUser(user: {
    id: string; email: string; firstName: string | null; lastName: string | null;
    role: "SEEKER" | "RECRUITER" | "ADMIN"; avatarUrl: string | null;
    emailVerified: boolean; createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  private generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ): string {
    return jwt.sign(
      {
        userId,
        email,
        role,
      },
      env.jwtSecret,
      {
        expiresIn: "1h",
      },
    );
  }
}

export const authService = new AuthService();
