import { describe, expect, it } from 'vitest';

import {
  shouldRedirectToUpload,
  UPLOAD_REDIRECT_CACHE_SECONDS,
  UPLOAD_REDIRECT_EXPIRY_SECONDS,
} from './upload-redirect';

describe('shouldRedirectToUpload', () => {
  const withEnv = (values: Record<string, string>) => (name: string) => values[name];

  const enabled = withEnv({
    NEXT_PRIVATE_UPLOAD_REDIRECT: 'true',
    NEXT_PUBLIC_UPLOAD_TRANSPORT: 's3',
  });

  it('is off by default', () => {
    expect(shouldRedirectToUpload(withEnv({ NEXT_PUBLIC_UPLOAD_TRANSPORT: 's3' }), 'S3_PATH')).toBe(false);
  });

  it('redirects files stored in S3 when enabled', () => {
    expect(shouldRedirectToUpload(enabled, 'S3_PATH')).toBe(true);
  });

  it('keeps proxying files stored in the database', () => {
    expect(shouldRedirectToUpload(enabled, 'BYTES')).toBe(false);
    expect(shouldRedirectToUpload(enabled, 'BYTES_64')).toBe(false);
  });

  it('only applies to the s3 transport', () => {
    const azure = withEnv({
      NEXT_PRIVATE_UPLOAD_REDIRECT: 'true',
      NEXT_PUBLIC_UPLOAD_TRANSPORT: 'azure-blob',
    });

    expect(shouldRedirectToUpload(azure, 'S3_PATH')).toBe(false);
  });

  it('only accepts "true"', () => {
    const other = withEnv({
      NEXT_PRIVATE_UPLOAD_REDIRECT: '1',
      NEXT_PUBLIC_UPLOAD_TRANSPORT: 's3',
    });

    expect(shouldRedirectToUpload(other, 'S3_PATH')).toBe(false);
  });
});

describe('upload redirect timing', () => {
  it('lets the browser cache a redirect only while its URL is still valid', () => {
    expect(UPLOAD_REDIRECT_CACHE_SECONDS).toBeGreaterThan(0);
    expect(UPLOAD_REDIRECT_CACHE_SECONDS).toBeLessThan(UPLOAD_REDIRECT_EXPIRY_SECONDS);
  });
});
