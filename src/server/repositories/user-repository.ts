import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashStr: string,
): Promise<boolean> {
  return compare(password, hashStr);
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "SEEKER" | "RECRUITER";
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

export async function deleteExpiredRefreshTokens(userId: string, now = new Date()) {
  return prisma.refreshToken.deleteMany({ where: { userId, expiresAt: { lte: now } } });
}

export async function rotateRefreshToken(currentHash: string, nextHash: string, now = new Date()) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.refreshToken.findUnique({
      where: { tokenHash: currentHash },
      include: { user: true },
    });
    if (!current || current.expiresAt <= now || current.user.deletedAt) {
      if (current) await transaction.refreshToken.delete({ where: { id: current.id } });
      return null;
    }
    const deleted = await transaction.refreshToken.deleteMany({ where: { id: current.id } });
    if (deleted.count !== 1) return null;
    await transaction.refreshToken.create({
      data: { userId: current.userId, tokenHash: nextHash, expiresAt: current.expiresAt },
    });
    return { user: current.user, expiresAt: current.expiresAt };
  });
}

export async function revokeRefreshToken(tokenHash: string) {
  return prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function updateUserLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
  emailVerified: true,
  createdAt: true,
} as const;

export function updateUserProfile(userId: string, data: { firstName: string; lastName: string }) {
  return prisma.user.update({ where: { id: userId }, data, select: publicUserSelect });
}

export function updateUserAvatar(userId: string, avatarUrl: string, avatarPublicId: string) {
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl, avatarPublicId }, select: publicUserSelect });
}
