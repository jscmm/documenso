import { authClient } from '@documenso/auth/client';
import { AuthenticationErrorCode } from '@documenso/auth/server/lib/errors/error-codes';
import { extractCookieFromHeaders } from '@documenso/auth/server/lib/utils/cookies';
import { getOptionalSession } from '@documenso/auth/server/lib/utils/get-session';
import {
  getCookieDomain,
  IS_GOOGLE_SSO_ENABLED,
  IS_MICROSOFT_SSO_ENABLED,
  IS_OIDC_AUTO_REDIRECT_DISABLED,
  IS_OIDC_SSO_ENABLED,
  isSigninEnabledForProvider,
  isSignupEnabledForProvider,
  OIDC_PROVIDER_LABEL,
} from '@documenso/lib/constants/auth';
import { OAUTH_PROVIDER_ERROR_COOKIE, sanitizeProviderMessage } from '@documenso/lib/universal/oauth-provider-error';
import { isOidcSigninRequested } from '@documenso/lib/universal/oidc-provisioning';
import { isValidReturnTo, normalizeReturnTo } from '@documenso/lib/utils/is-valid-return-to';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { data, Link, redirect, useSearchParams } from 'react-router';

import { SignInForm } from '~/components/forms/signin';
import { SIGNUP_ERROR_MESSAGES } from '~/components/forms/signup';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/signin';

export function meta() {
  return appMetaTags(msg`Sign In`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const { session } = await getOptionalSession(request);

  // Embed sessions are rejected by the authenticated tree, so treat them as signed out here.
  const isAuthenticated = session !== null && !session.isEmbed;

  // SSR env variables.
  const isEmailPasswordSigninEnabled = isSigninEnabledForProvider('email');
  const isGoogleSSOEnabled = IS_GOOGLE_SSO_ENABLED && isSigninEnabledForProvider('google');
  const isMicrosoftSSOEnabled = IS_MICROSOFT_SSO_ENABLED && isSigninEnabledForProvider('microsoft');
  const isOIDCSSOEnabled = IS_OIDC_SSO_ENABLED && isSigninEnabledForProvider('oidc');

  // Automatically redirect to OIDC when it is the only enabled signin transport,
  // unless the redirect has been explicitly disabled via env.
  const isOIDCOnlyTransport =
    isOIDCSSOEnabled && !isEmailPasswordSigninEnabled && !isGoogleSSOEnabled && !isMicrosoftSSOEnabled;

  // `/signin?provider=oidc` asks for OIDC explicitly, whatever else is enabled.
  const isOIDCRequested = isOIDCSSOEnabled && isOidcSigninRequested(new URL(request.url).searchParams);

  const errorParam = new URL(request.url).searchParams.get('error');

  // Never redirect straight back to the provider after a failed sign-in: show the error instead.
  const shouldAutoRedirectToOIDC =
    !errorParam && (isOIDCRequested || (isOIDCOnlyTransport && !IS_OIDC_AUTO_REDIRECT_DISABLED));

  // The message an identity provider wrote for the user when it refused the sign-in, set by
  // the OAuth callback; read once.
  const providerErrorCookie = extractCookieFromHeaders(OAUTH_PROVIDER_ERROR_COOKIE, request.headers);

  let providerErrorMessage: string | null = null;

  if (providerErrorCookie !== null && errorParam === AuthenticationErrorCode.OAuthProviderRefused) {
    try {
      providerErrorMessage = sanitizeProviderMessage(decodeURIComponent(providerErrorCookie));
    } catch {
      providerErrorMessage = null;
    }
  }

  const oidcProviderLabel = OIDC_PROVIDER_LABEL;

  const isSignupEnabled =
    isSignupEnabledForProvider('email') ||
    (IS_GOOGLE_SSO_ENABLED && isSignupEnabledForProvider('google')) ||
    (IS_MICROSOFT_SSO_ENABLED && isSignupEnabledForProvider('microsoft')) ||
    (IS_OIDC_SSO_ENABLED && isSignupEnabledForProvider('oidc'));

  let returnTo = new URL(request.url).searchParams.get('returnTo') ?? undefined;

  returnTo = isValidReturnTo(returnTo) ? normalizeReturnTo(returnTo) : undefined;

  if (isAuthenticated) {
    throw redirect(returnTo || '/');
  }

  const loaderData = {
    isEmailPasswordSigninEnabled,
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    isSignupEnabled,
    oidcProviderLabel,
    providerErrorMessage,
    returnTo,
    shouldAutoRedirectToOIDC,
  };

  if (providerErrorCookie === null) {
    return loaderData;
  }

  return data(loaderData, {
    headers: {
      'Set-Cookie': `${OAUTH_PROVIDER_ERROR_COOKIE}=; Path=/; Domain=${getCookieDomain()}; Max-Age=0; HttpOnly; SameSite=Lax`,
    },
  });
}

export default function SignIn({ loaderData }: Route.ComponentProps) {
  const {
    isEmailPasswordSigninEnabled,
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    isSignupEnabled,
    oidcProviderLabel,
    providerErrorMessage,
    returnTo,
    shouldAutoRedirectToOIDC,
  } = loaderData;

  const { _ } = useLingui();

  const [searchParams] = useSearchParams();

  const errorParam = searchParams.get('error');
  const signupError = errorParam ? SIGNUP_ERROR_MESSAGES[errorParam] : undefined;
  const isProviderRefusal = errorParam === AuthenticationErrorCode.OAuthProviderRefused;

  useEffect(() => {
    if (!shouldAutoRedirectToOIDC) {
      return;
    }

    void authClient.oidc.signIn({ redirectPath: returnTo ?? '/' });
  }, [shouldAutoRedirectToOIDC, returnTo]);

  if (shouldAutoRedirectToOIDC) {
    return (
      <div className="w-screen max-w-lg px-4">
        <div className="flex flex-col items-center justify-center gap-y-4 py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            <Trans>Redirecting to {oidcProviderLabel || 'OIDC'}...</Trans>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen max-w-lg px-4">
      <div className="z-10 rounded-xl border border-border bg-neutral-100 p-6 dark:bg-background">
        {signupError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{_(signupError)}</AlertDescription>
          </Alert>
        )}

        {isProviderRefusal && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {providerErrorMessage || (
                <Trans>Your identity provider refused the sign-in. Please try again later.</Trans>
              )}
            </AlertDescription>
          </Alert>
        )}

        <h1 className="font-semibold text-2xl">
          <Trans>Sign in to your account</Trans>
        </h1>

        <p className="mt-2 text-muted-foreground text-sm">
          <Trans>Welcome back, we are lucky to have you.</Trans>
        </p>
        <hr className="-mx-6 my-4" />

        <SignInForm
          isEmailPasswordSigninEnabled={isEmailPasswordSigninEnabled}
          isGoogleSSOEnabled={isGoogleSSOEnabled}
          isMicrosoftSSOEnabled={isMicrosoftSSOEnabled}
          isOIDCSSOEnabled={isOIDCSSOEnabled}
          oidcProviderLabel={oidcProviderLabel}
          returnTo={returnTo}
        />

        {isSignupEnabled && (
          <p className="mt-6 text-center text-muted-foreground text-sm">
            <Trans>
              Don't have an account?{' '}
              <Link
                to={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup'}
                className="text-documenso-700 duration-200 hover:opacity-70"
              >
                Sign up
              </Link>
            </Trans>
          </p>
        )}
      </div>
    </div>
  );
}
