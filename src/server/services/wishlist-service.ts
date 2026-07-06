import { wishlistRepository } from "@/server/repositories/wishlist-repository";

export const wishlistService = {
  async getAll(userId: string) {
    return wishlistRepository.getAll(userId);
  },

  async getById(id: string, userId: string) {
    return wishlistRepository.getById(id, userId);
  },

  async create(userId: string, vacancyId: string) {
    return wishlistRepository.create(userId, vacancyId);
  },

  async delete(id: string, userId: string) {
    return wishlistRepository.delete(id, userId);
  },

  async deleteByVacancy(userId: string, vacancyId: string) {
    return wishlistRepository.deleteByVacancy(userId, vacancyId);
  },

  async isInWishlist(userId: string, vacancyId: string) {
    return wishlistRepository.isInWishlist(userId, vacancyId);
  },
};
