import type { ApiRequestMetadata } from './extract-request-metadata';

/**
 * `NEXT_PRIVATE_SKIP_AUTO_PLACE_FIELDS="true"` skips the placeholder scan ("auto-place
 * fields") on PDFs uploaded with an API token, for integrations that place every field
 * themselves (`envelope.field.createMany`). The scan reads the text of every page, which
 * dominates envelope creation for large PDFs. Uploads from the web app keep the scan.
 */
export const shouldSkipPlaceholderScan = (
  get: (name: string) => string | undefined,
  apiRequestMetadata: Pick<ApiRequestMetadata, 'auth'>,
): boolean => get('NEXT_PRIVATE_SKIP_AUTO_PLACE_FIELDS') === 'true' && apiRequestMetadata.auth === 'api';
