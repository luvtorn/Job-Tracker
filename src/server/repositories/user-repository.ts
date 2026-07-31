import { compare, getRounds, hash } from 'bcryptjs';
import type { AuthActionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const PASSWORD_HASH_ROUNDS = 12;

export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
  emailVerified: true,
  createdAt: true,
} as const;

export const sessionUserSelect = {
  ...publicUserSelect,
  authVersion: true,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function passwordHashNeedsUpgrade(passwordHash: string) {
  return getRounds(passwordHash) < PASSWORD_HASH_ROUNDS;
}

export async function createUserWithRefreshToken(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'SEEKER' | 'RECRUITER';
  refreshTokenHash: string;
  refreshTokenFamilyId: string;
  refreshTokenExpiresAt: Date;
  actionToken?: {
    tokenHash: string;
    type: AuthActionType;
    expiresAt: Date;
  };
}) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        lastLoginAt: new Date(),
      },
      select: sessionUserSelect,
    });
    await transaction.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: data.refreshTokenHash,
        familyId: data.refreshTokenFamilyId,
        expiresAt: data.refreshTokenExpiresAt,
      },
    });
    if (data.actionToken) {
      await transaction.authActionToken.create({
        data: {
          userId: user.id,
          tokenHash: data.actionToken.tokenHash,
          type: data.actionToken.type,
          expiresAt: data.actionToken.expiresAt,
        },
      });
    }
    return user;
  });
}

export function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function createRefreshToken(
  userId: string,
  tokenHash: string,
  familyId: string,
  expiresAt: Date,
) {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, familyId, expiresAt },
  });
}

export function deleteExpiredRefreshTokens(userId: string, now = new Date()) {
  return prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lte: now } },
  });
}

export async function rotateRefreshToken(
  currentHash: string,
  nextHash: string,
  now = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.refreshToken.findUnique({
      where: { tokenHash: currentHash },
      include: { user: true },
    });
    if (!current) return null;

    if (
      current.usedAt
      || current.revokedAt
      || current.expiresAt <= now
      || current.user.deletedAt
    ) {
      await transaction.refreshToken.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: now },
      });
      return null;
    }

    const claimed = await transaction.refreshToken.updateMany({
      where: { id: current.id, usedAt: null, revokedAt: null },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) {
      await transaction.refreshToken.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: now },
      });
      return null;
    }

    await transaction.refreshToken.create({
      data: {
        userId: current.userId,
        tokenHash: nextHash,
        familyId: current.familyId,
        expiresAt: current.expiresAt,
      },
    });
    return { user: current.user, expiresAt: current.expiresAt };
  });
}

export async function revokeRefreshToken(tokenHash: string) {
  const token = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { familyId: true },
  });
  if (!token) return { count: 0 };
  return prisma.refreshToken.updateMany({
    where: { familyId: token.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function updateUserLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export function updatePasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  });
}

export function updateUserProfile(
  userId: string,
  data: { firstName: string; lastName: string },
) {
  return prisma.user.update({ where: { id: userId }, data, select: publicUserSelect });
}

export function updateUserAvatar(
  userId: string,
  avatarUrl: string,
  avatarPublicId: string,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl, avatarPublicId },
    select: publicUserSelect,
  });
}
