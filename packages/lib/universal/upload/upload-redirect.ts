import type { DocumentDataType } from '@prisma/client';

/**
 * How long a redirect URL to object storage stays valid.
 *
 * pdf.js re-requests the app URL for every range it loads, so each request gets a
 * fresh URL. The expiry only has to cover one request plus the time the browser may
 * keep the redirect cached (`UPLOAD_REDIRECT_CACHE_SECONDS`).
 */
export const UPLOAD_REDIRECT_EXPIRY_SECONDS = 300;

/**
 * How long the browser may reuse a redirect before asking the app again. Kept a
 * minute below the URL expiry so a cached redirect never points at an expired URL.
 */
export const UPLOAD_REDIRECT_CACHE_SECONDS = UPLOAD_REDIRECT_EXPIRY_SECONDS - 60;

/**
 * `NEXT_PRIVATE_UPLOAD_REDIRECT="true"` makes the envelope item PDF route answer with a
 * redirect to a short-lived presigned URL instead of proxying the file through the app.
 * The browser then loads the PDF straight from S3 and pdf.js can use range requests.
 *
 * Only applies to files stored in S3. Files stored in the database stay proxied.
 */
export const shouldRedirectToUpload = (
  get: (name: string) => string | undefined,
  documentDataType: DocumentDataType,
): boolean =>
  get('NEXT_PRIVATE_UPLOAD_REDIRECT') === 'true' &&
  get('NEXT_PUBLIC_UPLOAD_TRANSPORT') === 's3' &&
  documentDataType === 'S3_PATH';
