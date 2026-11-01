/**
 * When an identity provider refuses the token exchange of an OAuth sign-in, the user is sent
 * back to the sign-in page with `?error=OAUTH_PROVIDER_REFUSED`. A message the provider wrote
 * for its users travels separately, in this short-lived cookie set by the callback, so that a
 * crafted link cannot put text of its own on the sign-in page.
 */
export const OAUTH_PROVIDER_ERROR_COOKIE = 'oauth_provider_error';

export const OAUTH_PROVIDER_ERROR_COOKIE_MAX_AGE = 60;

export const OAUTH_PROVIDER_MESSAGE_MAX_LENGTH = 300;

/**
 * Pre-token, pre-authentication and similar triggers of an identity provider (e.g. Cognito)
 * refuse a sign-in with "<Trigger> failed with error <message>.", where the message comes
 * from the trigger and is meant for the user.
 */
const TRIGGER_REFUSAL_RE = /^Pre[A-Za-z]* failed with error\s+([\s\S]+)$/;

/**
 * Plain text, one line, at most `OAUTH_PROVIDER_MESSAGE_MAX_LENGTH` characters; null when
 * nothing is left.
 */
export const sanitizeProviderMessage = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  let message = value
    .replace(/[\p{Cc}<>]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (message.length > OAUTH_PROVIDER_MESSAGE_MAX_LENGTH) {
    message = `${message.slice(0, OAUTH_PROVIDER_MESSAGE_MAX_LENGTH - 1).trimEnd()}…`;
  }

  return message || null;
};

/**
 * The message a provider's trigger wrote for the user, from an OAuth error response's `error`
 * or `error_description`, or null when the refusal carries none.
 */
export const providerRefusalMessage = (code: string | null, description: string | null): string | null => {
  for (const candidate of [description, code]) {
    const match = candidate?.trim().match(TRIGGER_REFUSAL_RE);

    if (!match) {
      continue;
    }

    // The provider ends its wrapper with a full stop: drop it when the message has its own.
    const message = match[1].trim().replace(/([.!?])\.$/, '$1');

    return sanitizeProviderMessage(message);
  }

  return null;
};
