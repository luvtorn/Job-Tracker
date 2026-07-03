import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/server/validators/auth-validator";
import { authService } from "@/server/services/auth-service";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = registerSchema.parse(body);

    const user = await authService.register(validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      const fieldPath = firstError.path.join(".");
      let message = firstError.message;

      if (fieldPath === "password") {
        if (message.includes("must be at least 8 characters")) {
          message = "Password must be at least 8 characters";
        } else if (message.includes("uppercase")) {
          message = "Password must contain at least one uppercase letter";
        } else if (message.includes("lowercase")) {
          message = "Password must contain at least one lowercase letter";
        } else if (message.includes("number")) {
          message = "Password must contain at least one number";
        }
      }

      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === "Email already registered") {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
