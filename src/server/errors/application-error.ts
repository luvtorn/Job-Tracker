import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: unknown,
    public readonly headers?: HeadersInit,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export const badRequest = (message: string, errors?: unknown) =>
  new ApplicationError(message, 400, errors);
export const unauthorized = (message = "Unauthorized") =>
  new ApplicationError(message, 401);
export const forbidden = (message = "Forbidden") =>
  new ApplicationError(message, 403);
export const notFound = (message = "Not found") =>
  new ApplicationError(message, 404);
export const conflict = (message: string) => new ApplicationError(message, 409);
export const tooManyRequests = (retryAfterSeconds: number) =>
  new ApplicationError('Too many requests', 429, undefined, { 'Retry-After': String(retryAfterSeconds) });

const logUnexpectedError = (context: string, error: unknown) => {
  const name = error instanceof Error ? error.name : 'UnknownError';
  console.error(`${context} [${name}]`);
};

export function handleApiError(error: unknown, context: string) {
  if (error instanceof ApplicationError) {
    return NextResponse.json(
      { success: false, message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
      { status: error.status, headers: error.headers },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Invalid request", errors: error.flatten() },
      { status: 400 },
    );
  }
  logUnexpectedError(context, error);
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}
