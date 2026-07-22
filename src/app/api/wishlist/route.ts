import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { wishlistService } from '@/server/services/wishlist-service';
import { createWishlistSchema } from '@/server/validators/wishlist-validator';

export async function GET() {
  try {
    const user = await requireSeeker();
    return NextResponse.json({ success: true, data: await wishlistService.getAll(user.id) });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch wishlist');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeeker();
    const { vacancyId } = createWishlistSchema.parse(await request.json());
    const item = await wishlistService.create(user.id, vacancyId);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to create wishlist item');
  }
}
