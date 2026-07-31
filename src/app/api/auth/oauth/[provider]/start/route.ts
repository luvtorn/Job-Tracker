import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setOAuthFlowCookie } from '@/server/auth/oauth-cookies';
import { handleApiError } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { oauthProviderSchema, oauthService } from '@/server/services/oauth-service';
import { enforceAuthRateLimit } from '@/server/security/request-security';

const resourceIdSchema = z.object({ provider: oauthProviderSchema });
const querySchema = z.object({
  mode: z.enum(['login', 'connect']).default('login'),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    await enforceAuthRateLimit(request, 'oauth-start');
    const { provider } = resourceIdSchema.parse(await context.params);
    const { mode } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    if (mode === 'connect') await requireAuthenticatedUser();
    const authorization = oauthService.createAuthorization(provider, mode);
    const response = NextResponse.redirect(authorization.authorizationUrl);
    setOAuthFlowCookie(response, authorization.flowToken);
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to start OAuth flow');
  }
}
