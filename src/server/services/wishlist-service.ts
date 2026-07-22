import { wishlistRepository, isWishlistUniqueConstraintError } from "@/server/repositories/wishlist-repository";
import { vacancyRepository } from '@/server/repositories/vacancy-repository';
import { conflict, notFound } from '@/server/errors/application-error';

export const wishlistService = {
  async getAll(userId: string) {
    return wishlistRepository.getAll(userId);
  },

  async getById(id: string, userId: string) {
    return wishlistRepository.getById(id, userId);
  },

  async create(userId: string, vacancyId: string) {
    if (!await vacancyRepository.findPublishedById(vacancyId)) throw notFound('Vacancy not found');
    if (await wishlistRepository.isInWishlist(userId, vacancyId)) throw conflict('Already in wishlist');
    try {
      return await wishlistRepository.create(userId, vacancyId);
    } catch (error) {
      if (isWishlistUniqueConstraintError(error)) throw conflict('Already in wishlist');
      throw error;
    }
  },

  async delete(id: string, userId: string) {
    const result = await wishlistRepository.delete(id, userId);
    if (result.count === 0) throw notFound('Wishlist item not found');
    return result;
  },

  async deleteByVacancy(userId: string, vacancyId: string) {
    return wishlistRepository.deleteByVacancy(userId, vacancyId);
  },

  async isInWishlist(userId: string, vacancyId: string) {
    return wishlistRepository.isInWishlist(userId, vacancyId);
  },
};
