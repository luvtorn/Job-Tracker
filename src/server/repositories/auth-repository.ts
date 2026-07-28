import { AuthActionType, AuthProvider, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { publicUserSelect } from '@/server/repositories/user-repository';

type SessionRecord = {
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
};

type OAuthIdentityRecord = {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export async function replaceAuthActionToken(data: {
  userId: string;
  type: AuthActionType;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.$transaction(async (transaction) => {
    await transaction.authActionToken.deleteMany({
      where: { userId: data.userId, type: data.type },
    });
    return transaction.authActionToken.create({ data });
  });
}

export async function consumeEmailVerificationToken(tokenHash: string, now = new Date()) {
  return prisma.$transaction(async (transaction) => {
    const token = await transaction.authActionToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.type !== AuthActionType.VERIFY_EMAIL || token.expiresAt <= now) {
      if (token) await transaction.authActionToken.deleteMany({ where: { id: token.id } });
      return null;
    }
    const claimed = await transaction.authActionToken.deleteMany({ where: { id: token.id } });
    if (claimed.count !== 1) return null;

    const user = await transaction.user.update({
      where: { id: token.userId },
      data: { emailVerified: true },
      select: publicUserSelect,
    });
    await transaction.authActionToken.deleteMany({
      where: { userId: token.userId, type: AuthActionType.VERIFY_EMAIL },
    });
    return user;
  });
}

export async function consumePasswordResetToken(
  tokenHash: string,
  passwordHash: string,
  now = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    const token = await transaction.authActionToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.type !== AuthActionType.PASSWORD_RESET || token.expiresAt <= now) {
      if (token) await transaction.authActionToken.deleteMany({ where: { id: token.id } });
      return null;
    }
    const claimed = await transaction.authActionToken.deleteMany({ where: { id: token.id } });
    if (claimed.count !== 1) return null;

    const user = await transaction.user.update({
      where: { id: token.userId },
      data: { passwordHash, emailVerified: true },
      select: publicUserSelect,
    });
    await Promise.all([
      transaction.authActionToken.deleteMany({ where: { userId: token.userId } }),
      transaction.refreshToken.deleteMany({ where: { userId: token.userId } }),
    ]);
    return user;
  });
}

export async function resolveOAuthUserWithSession(
  identity: OAuthIdentityRecord,
  session: SessionRecord,
) {
  return prisma.$transaction(async (transaction) => {
    const account = await transaction.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: identity.provider,
          providerAccountId: identity.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (account?.user.deletedAt) return null;

    let userId = account?.userId;
    if (!userId) {
      const existingUser = await transaction.user.findUnique({
        where: { email: identity.email },
      });
      if (!existingUser || existingUser.deletedAt) return null;
      userId = existingUser.id;
      await transaction.authAccount.create({
        data: {
          userId,
          provider: identity.provider,
          providerAccountId: identity.providerAccountId,
        },
      });
    }

    const user = await transaction.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
        avatarUrl: account?.user.avatarUrl ?? identity.avatarUrl ?? undefined,
      },
      select: publicUserSelect,
    });
    await transaction.refreshToken.create({
      data: {
        userId,
        tokenHash: session.refreshTokenHash,
        expiresAt: session.refreshTokenExpiresAt,
      },
    });
    return user;
  });
}

export async function createOAuthUserWithSession(
  identity: OAuthIdentityRecord,
  input: { firstName: string; lastName: string; role: 'SEEKER' | 'RECRUITER' },
  session: SessionRecord,
) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        email: identity.email,
        emailVerified: true,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        avatarUrl: identity.avatarUrl,
        lastLoginAt: new Date(),
      },
      select: publicUserSelect,
    });
    await transaction.authAccount.create({
      data: {
        userId: user.id,
        provider: identity.provider,
        providerAccountId: identity.providerAccountId,
      },
    });
    await transaction.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: session.refreshTokenHash,
        expiresAt: session.refreshTokenExpiresAt,
      },
    });
    return user;
  });
}

export async function linkAuthAccount(
  userId: string,
  identity: Pick<OAuthIdentityRecord, 'provider' | 'providerAccountId'>,
) {
  try {
    return await prisma.authAccount.create({
      data: { userId, ...identity },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

export function listAuthAccounts(userId: string) {
  return prisma.authAccount.findMany({
    where: { userId },
    select: { provider: true, createdAt: true },
    orderBy: { provider: 'asc' },
  });
}

export async function disconnectAuthAccount(userId: string, provider: AuthProvider) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        authAccounts: { select: { provider: true } },
      },
    });
    if (!user) return 'NOT_FOUND' as const;
    if (!user.passwordHash && user.authAccounts.length <= 1) return 'LAST_METHOD' as const;

    const deleted = await transaction.authAccount.deleteMany({
      where: { userId, provider },
    });
    return deleted.count === 1 ? 'DISCONNECTED' as const : 'NOT_FOUND' as const;
  });
}
