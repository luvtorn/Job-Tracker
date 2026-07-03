import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  createUser,
  getUserByEmail,
  createRefreshToken,
  updateUserLastLogin,
} from '@/server/repositories/user-repository';
import { LoginInput, RegisterInput } from '@/server/validators/auth-validator';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await getUserByEmail(input.email);
    if (existingUser) {
      throw new Error('Email already registered');
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
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new Error('Account has been deleted');
    }

    await updateUserLastLogin(user.id);

    const { accessTokenExpiry, refreshTokenExpiry } = generateTokens(user.id);

    const refreshTokenString = randomBytes(32).toString('hex');
    const refreshTokenHash = await hashPassword(refreshTokenString);

    await createRefreshToken(user.id, refreshTokenHash, new Date(refreshTokenExpiry));

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
        accessTokenExpiry,
        refreshTokenExpiry,
      },
    };
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      {
        userId,
        email,
        role,
      },
      JWT_SECRET,
      {
        expiresIn: '15m',
      }
    );
  }
}

export const authService = new AuthService();
