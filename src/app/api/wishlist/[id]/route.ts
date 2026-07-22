import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { wishlistService } from '@/server/services/wishlist-service';
import { wishlistIdSchema } from '@/server/validators/wishlist-validator';

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const user = await requireSeeker();
    const id = wishlistIdSchema.parse((await params).id);
    await wishlistService.delete(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to delete wishlist item');
  }
}
