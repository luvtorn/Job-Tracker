import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AuthActionType, AuthProvider, Prisma } from "@prisma/client";
import {
  hashPassword,
  verifyPassword,
  passwordHashNeedsUpgrade,
  createUserWithRefreshToken,
  getUserByEmail,
  createRefreshToken,
  deleteExpiredRefreshTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  updateUserLastLogin,
  getUserById,
  updatePasswordHash,
  changePasswordAndReplaceSessions,
  listActiveRefreshSessions,
  revokeRefreshSession,
} from "@/server/repositories/user-repository";
import {
  CompleteOAuthRegistrationInput,
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
} from "@/server/validators/auth-validator";
import { badRequest, conflict, notFound, unauthorized } from "@/server/errors/application-error";
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
import { signAccessToken } from "@/server/services/access-token-service";
import type { SessionMetadata } from '@/server/security/session-metadata';
import { describeSessionDevice } from '@/server/services/session-device';

const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const DUMMY_PASSWORD_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOqM4G8TqRZcGuk1unTzXcVj7r5yK2Nte';

export class AuthService {
  async register(input: RegisterInput, locale: AppLocale, metadata: SessionMetadata) {
    const email = input.email.toLowerCase();
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw conflict("Email already registered");
    }

    const passwordHash = await hashPassword(input.password);
    const session = this.createSessionCredentials(metadata);
    const verification = this.createActionToken(VERIFY_EMAIL_TTL_MS);

    const user = await createUserWithRefreshToken({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      refreshTokenHash: hashRefreshToken(session.refreshToken),
      refreshTokenFamilyId: session.refreshTokenFamilyId,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      refreshTokenUserAgent: session.refreshTokenUserAgent,
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

  async login(input: LoginInput, metadata: SessionMetadata) {
    const user = await getUserByEmail(input.email.toLowerCase());

    if (!user) {
      await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
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
    if (user.passwordHash && passwordHashNeedsUpgrade(user.passwordHash)) {
      await updatePasswordHash(user.id, await hashPassword(input.password));
    }

    const session = this.createSessionCredentials(metadata);

    await deleteExpiredRefreshTokens(user.id);
    await createRefreshToken(
      user.id,
      hashRefreshToken(session.refreshToken),
      session.refreshTokenFamilyId,
      session.refreshTokenExpiresAt,
      session.refreshTokenUserAgent,
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
        accessToken: this.generateAccessToken(user.id, user.role, user.authVersion),
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

  async signInWithOAuth(identity: OAuthIdentity, metadata: SessionMetadata) {
    const session = this.createSessionCredentials(metadata);
    const user = await resolveOAuthUserWithSession(identity, {
      refreshTokenHash: hashRefreshToken(session.refreshToken),
      refreshTokenFamilyId: session.refreshTokenFamilyId,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      refreshTokenUserAgent: session.refreshTokenUserAgent,
    });
    return user ? this.createAuthResult(user, session) : null;
  }

  async completeOAuthRegistration(
    identity: OAuthIdentity,
    input: CompleteOAuthRegistrationInput,
    metadata: SessionMetadata,
  ) {
    const session = this.createSessionCredentials(metadata);
    try {
      const user = await createOAuthUserWithSession(identity, input, {
        refreshTokenHash: hashRefreshToken(session.refreshToken),
        refreshTokenFamilyId: session.refreshTokenFamilyId,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
        refreshTokenUserAgent: session.refreshTokenUserAgent,
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

  async listSessions(userId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken ? hashRefreshToken(currentRefreshToken) : null;
    const sessions = await listActiveRefreshSessions(userId);
    return sessions.map((session) => ({
      id: session.familyId,
      ...describeSessionDevice(session.userAgent),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.tokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, familyId: string, currentRefreshToken?: string) {
    const revoked = await revokeRefreshSession(userId, familyId);
    if (!revoked) throw notFound('Session not found');
    return {
      isCurrent: currentRefreshToken
        ? revoked.tokenHash === hashRefreshToken(currentRefreshToken)
        : false,
    };
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    currentRefreshToken: string,
    metadata: SessionMetadata,
  ) {
    const existingUser = await getUserById(userId);
    if (!existingUser || existingUser.deletedAt) throw unauthorized();
    if (!existingUser.passwordHash) {
      throw conflict('Password sign-in is not enabled for this account');
    }
    if (!await verifyPassword(input.currentPassword, existingUser.passwordHash)) {
      throw badRequest('Current password is incorrect');
    }
    if (await verifyPassword(input.newPassword, existingUser.passwordHash)) {
      throw badRequest('New password must be different');
    }

    const passwordHash = await hashPassword(input.newPassword);
    const session = this.createSessionCredentials(metadata);
    const user = await changePasswordAndReplaceSessions({
      userId,
      currentTokenHash: hashRefreshToken(currentRefreshToken),
      passwordHash,
      nextTokenHash: hashRefreshToken(session.refreshToken),
      nextFamilyId: session.refreshTokenFamilyId,
      nextExpiresAt: session.refreshTokenExpiresAt,
      userAgent: session.refreshTokenUserAgent,
    });
    if (!user) throw unauthorized('Invalid session');
    return this.createAuthResult(user, session);
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

  private createSessionCredentials(metadata: SessionMetadata) {
    return {
      refreshToken: generateRefreshToken(),
      refreshTokenFamilyId: randomUUID(),
      refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      refreshTokenUserAgent: metadata.userAgent,
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
      authVersion: number;
      createdAt: Date;
    },
    session: {
      refreshToken: string;
      refreshTokenFamilyId: string;
      refreshTokenExpiresAt: Date;
      refreshTokenUserAgent: string | null;
    },
  ) {
    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken: this.generateAccessToken(user.id, user.role, user.authVersion),
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
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
    role: "SEEKER" | "RECRUITER" | "ADMIN",
    authVersion: number,
  ) {
    return signAccessToken({ userId, role, authVersion });
  }
}

export const authService = new AuthService();
