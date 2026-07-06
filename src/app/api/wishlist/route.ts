import { NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { wishlistService } from "@/server/services/wishlist-service";
import { z } from "zod";

export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const wishlist = await wishlistService.getAll(user.id);

    return NextResponse.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

const createWishlistSchema = z.object({
  vacancyId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vacancyId } = createWishlistSchema.parse(body);

    const isInWishlist = await wishlistService.isInWishlist(user.id, vacancyId);
    if (isInWishlist) {
      return NextResponse.json(
        { success: false, message: "Already in wishlist" },
        { status: 409 }
      );
    }

    const wishlistItem = await wishlistService.create(user.id, vacancyId);

    return NextResponse.json(
      {
        success: true,
        data: wishlistItem,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create wishlist item:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
