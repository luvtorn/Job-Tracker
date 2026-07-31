import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clearOAuthFlowCookie, getOAuthFlowCookie, setOAuthRegistrationCookie } from '@/server/auth/oauth-cookies';
import { setAuthCookies } from '@/server/auth/auth-cookies';
import { handleApiError, unauthorized } from '@/server/errors/application-error';
import { verifyAuth } from '@/server/middleware/auth';
import { authService } from '@/server/services/auth-service';
import { oauthProviderSchema, oauthService } from '@/server/services/oauth-service';

const resourceIdSchema = z.object({ provider: oauthProviderSchema });
const querySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(32),
});

const redirectWithError = (response: NextResponse) => {
  clearOAuthFlowCookie(response);
  return response;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = resourceIdSchema.parse(await context.params);
    const { code, state } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const flowToken = getOAuthFlowCookie(request);
    if (!flowToken) throw unauthorized('OAuth session expired');
    const flow = oauthService.readFlow(flowToken);
    if (flow.provider !== provider || flow.state !== state) {
      throw unauthorized('Invalid OAuth state');
    }

    const identity = await oauthService.exchange(provider, code, flow.verifier);
    if (flow.mode === 'connect') {
      const user = await verifyAuth();
      if (!user) throw unauthorized();
      await authService.connectOAuthAccount(user.id, identity);
      const response = NextResponse.redirect(new URL('/settings?accountConnected=1', request.url));
      clearOAuthFlowCookie(response);
      return response;
    }

    const authResult = await authService.signInWithOAuth(identity);
    if (authResult) {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      clearOAuthFlowCookie(response);
      setAuthCookies(response, authResult.tokens);
      return response;
    }

    const response = NextResponse.redirect(new URL('/auth/complete-registration', request.url));
    clearOAuthFlowCookie(response);
    setOAuthRegistrationCookie(response, oauthService.createRegistrationIntent(identity));
    return response;
  } catch (error) {
    handleApiError(error, 'OAuth callback failed');
    return redirectWithError(
      NextResponse.redirect(new URL('/auth/login?oauthError=1', request.url)),
    );
  }
}
