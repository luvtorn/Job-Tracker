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
export const serviceUnavailable = (message = "Service unavailable") =>
  new ApplicationError(message, 503);
export const tooManyRequests = (
  retryAfterSeconds: number,
  limit?: number,
  remaining = 0,
) =>
  new ApplicationError('Too many requests', 429, undefined, {
    'Retry-After': String(retryAfterSeconds),
    ...(limit === undefined ? {} : {
      'RateLimit-Limit': String(limit),
      'RateLimit-Remaining': String(remaining),
      'RateLimit-Reset': String(retryAfterSeconds),
    }),
  });

const logUnexpectedError = (context: string, error: unknown) => {
  const name = error instanceof Error ? error.name : 'UnknownError';
  console.error(`${context} [${name}]`);
};

export function handleApiError(error: unknown, context: string) {
  if (error instanceof ApplicationError) {
    return NextResponse.json(
      { success: false, message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
      {
        status: error.status,
        headers: {
          'Cache-Control': 'no-store',
          ...error.headers,
        },
      },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Invalid request", errors: error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  logUnexpectedError(context, error);
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  );
}
