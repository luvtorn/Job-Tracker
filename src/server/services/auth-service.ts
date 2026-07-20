import jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  createUser,
  getUserByEmail,
  createRefreshToken,
  deleteExpiredRefreshTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  updateUserLastLogin,
} from "@/server/repositories/user-repository";
import { LoginInput, RegisterInput } from "@/server/validators/auth-validator";
import { env } from "@/server/config/env";
import { conflict, unauthorized } from "@/server/errors/application-error";
import {
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  rotateRefreshSession,
} from "@/server/services/refresh-token-service";

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await getUserByEmail(input.email);
    if (existingUser) {
      throw conflict("Email already registered");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    });

    return user;
  }

  async login(input: LoginInput) {
    const user = await getUserByEmail(input.email);

    if (!user) {
      throw unauthorized("Invalid credentials");
    }

    const isPasswordValid = await verifyPassword(
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

    const refreshTokenExpiry = Date.now() + REFRESH_TOKEN_TTL_MS;
    const refreshTokenString = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshTokenString);

    await deleteExpiredRefreshTokens(user.id);
    await createRefreshToken(
      user.id,
      refreshTokenHash,
      new Date(refreshTokenExpiry),
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: {
        accessToken: this.generateAccessToken(user.id, user.email, user.role),
        refreshToken: refreshTokenString,
        refreshTokenExpiresAt: new Date(refreshTokenExpiry),
      },
    };
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
