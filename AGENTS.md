# JobTracker AI Development Guide

## Project Overview

JobTracker is a production-ready SaaS application for tracking job applications.

The goal is not simply to build a CRUD application, but to demonstrate real-world Fullstack engineering skills using modern architecture and best practices.

Every feature must be implemented as if it were intended for production.

---

# Before adding code:

1. Skip anything not required by the task.
2. Reuse existing project code before creating new code.
3. Prefer the standard library, platform APIs, and existing dependencies.
4. Make the smallest clear change that works.
5. Do not add abstractions, dependencies, refactors, or features unless required.
6. Inspect and edit only relevant files.
7. Stop after the requested result is verified.

# Tech Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

## Backend

- Next.js Route Handlers
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- Refresh Tokens
- HttpOnly Cookies
- bcrypt

# Architecture

Always follow Clean Architecture.

```
app
↓

route handlers

↓

services

↓

repositories

↓

database
```

Business logic MUST NEVER exist inside Route Handlers.

Database queries MUST NEVER exist inside React components.

---

# General Rules

- Always write strict TypeScript.
- Never use `any`.
- Prefer `type` over `interface` unless extension is required.
- Enable strict mode.
- Keep functions small and focused.
- Follow SOLID principles.
- Follow DRY.
- Follow KISS.
- Avoid premature optimization.
- Never duplicate business logic.
- Prefer composition over inheritance.

---

# Folder Structure

```
src/

app/
components/
features/
hooks/
lib/
server/
types/
utils/
```

Server folder:

```
server/

controllers/
services/
repositories/
validators/
middleware/
```

---

# React Rules

- Prefer Server Components.
- Use Client Components only when necessary.
- Avoid unnecessary useEffect.
- Prefer async Server Components.
- Keep components under 200 lines.
- One responsibility per component.
- Reusable UI belongs in components/ui.
- Feature-specific UI belongs in features/.

---

# State Management

Use:

- TanStack Query → server state
- React Context → authentication
- useState → local UI state

Never use Redux.

---

# API Rules

REST conventions only.

```
GET

POST

PATCH

DELETE
```

Correct examples:

```
GET /api/applications

GET /api/applications/:id

POST /api/applications

PATCH /api/applications/:id

DELETE /api/applications/:id
```

Return proper HTTP status codes.

---

# Validation

Validate every request using Zod.

Never trust client input.

Validation occurs before service execution.

---

# Authentication

Implement custom authentication.

Requirements:

- JWT Access Token
- Refresh Token
- HttpOnly Cookies
- bcrypt password hashing

Never store passwords.

Never store plain refresh tokens.

Always hash refresh tokens.

---

# Database

Use Prisma.

Every relation must be explicitly defined.

Use migrations only.

Never edit database manually.

---

# Error Handling

Never expose internal errors.

Use centralized error handling.

Return consistent API responses.

Example:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

# Security

Always:

- Hash passwords
- Validate input
- Sanitize data
- Protect private routes
- Use HttpOnly Cookies
- Enable Secure cookies in production
- Prevent SQL Injection
- Prevent XSS
- Prevent CSRF
- Use rate limiting

Never expose secrets.

---

# Environment Variables

Never hardcode:

- JWT_SECRET
- DATABASE_URL
- CLOUDINARY_SECRET
- API Keys

Everything must come from .env

---

# Code Style

Prefer:

Early return.

Small functions.

Readable code.

Meaningful variable names.

No magic numbers.

No nested if statements when avoidable.

---

# Naming

Variables:

camelCase

Functions:

camelCase

Components:

PascalCase

Files:

kebab-case

Types:

PascalCase

Constants:

UPPER_CASE

---

# Imports

Order:

1. React
2. External libraries
3. Internal aliases
4. Relative imports

Remove unused imports.

---

# Comments

Avoid comments.

Write self-documenting code.

Comment only complex business logic.

---

# UI

Use shadcn/ui.

Maintain consistent spacing.

Accessible components.

Keyboard navigation.

Loading skeletons.

Empty states.

Error states.

---

# Performance

Lazy load heavy components.

Optimize images.

Use Server Components whenever possible.

Memoize only when necessary.

Avoid unnecessary re-renders.

---

# Git

Use Conventional Commits.

Examples:

feat:

fix:

refactor:

docs:

style:

test:

chore:

---

# Testing

Business logic should be testable.

Keep logic separated from UI.

---

# AI Assistant Rules

When generating code:

- Produce production-ready code.
- Never generate placeholder implementations.
- Never skip validation.
- Never ignore error handling.
- Never use any.
- Never duplicate logic.
- Always use reusable abstractions.
- Follow existing architecture.
- Keep code readable and maintainable.
- Explain architectural decisions only when requested.

Assume this project is intended for deployment and long-term maintenance.
