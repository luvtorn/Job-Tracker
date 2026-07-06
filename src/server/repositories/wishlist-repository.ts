import { prisma } from "@/lib/prisma";

export const wishlistRepository = {
  async getAll(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        vacancy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, userId: string) {
    return prisma.wishlist.findFirst({
      where: { id, userId },
      include: { vacancy: true },
    });
  },

  async create(userId: string, vacancyId: string) {
    return prisma.wishlist.create({
      data: {
        userId,
        vacancyId,
      },
      include: { vacancy: true },
    });
  },

  async delete(id: string, userId: string) {
    return prisma.wishlist.deleteMany({
      where: { id, userId },
    });
  },

  async deleteByVacancy(userId: string, vacancyId: string) {
    return prisma.wishlist.deleteMany({
      where: { userId, vacancyId },
    });
  },

  async isInWishlist(userId: string, vacancyId: string) {
    const item = await prisma.wishlist.findUnique({
      where: { userId_vacancyId: { userId, vacancyId } },
    });
    return !!item;
  },
};
