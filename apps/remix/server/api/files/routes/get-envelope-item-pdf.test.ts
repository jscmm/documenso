import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getOptionalSession: vi.fn(),
  verifyEmbeddingPresignToken: vi.fn(),
  checkEnvelopeFileAccess: vi.fn(),
  findFirst: vi.fn(),
  getFileServerSide: vi.fn(),
  getPresignGetUrl: vi.fn(),
}));

vi.mock('@documenso/auth/server/lib/utils/get-session', () => ({
  getOptionalSession: mocks.getOptionalSession,
}));

vi.mock('@documenso/lib/server-only/embedding-presign/verify-embedding-presign-token', () => ({
  verifyEmbeddingPresignToken: mocks.verifyEmbeddingPresignToken,
}));

vi.mock('@documenso/prisma', () => ({
  prisma: {
    envelopeItem: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock('@documenso/lib/universal/upload/get-file.server', () => ({
  getFileServerSide: mocks.getFileServerSide,
}));

vi.mock('@documenso/lib/universal/upload/server-actions', () => ({
  getPresignGetUrl: mocks.getPresignGetUrl,
}));

vi.mock('../files.helpers', () => ({
  checkEnvelopeFileAccess: mocks.checkEnvelopeFileAccess,
}));

const { default: sessionRoute } = await import('./get-envelope-item-pdf');
const { default: tokenRoute } = await import('./get-envelope-item-pdf-by-token');

const SESSION_URL = '/envelope/envelope_1/envelopeItem/item_1/dataId/data_1/current/item.pdf';
const TOKEN_URL = '/token/recipient_token/envelope/envelope_1/envelopeItem/item_1/dataId/data_1/current/item.pdf';

const FILE_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const PRESIGNED_URL = 'https://storage.example.test/stored/current.pdf?X-Amz-Signature=abc';

const buildEnvelopeItem = (type: 'S3_PATH' | 'BYTES_64' = 'S3_PATH') => ({
  id: 'item_1',
  envelopeId: 'envelope_1',
  documentDataId: 'data_1',
  documentData: {
    id: 'data_1',
    type,
    data: 'stored/current.pdf',
    initialData: 'stored/initial.pdf',
  },
  envelope: {
    id: 'envelope_1',
    type: 'DOCUMENT',
    teamId: 1,
    templateType: 'PRIVATE',
  },
});

const setRedirectFlag = (value: string | undefined) => {
  if (value === undefined) {
    delete process.env.NEXT_PRIVATE_UPLOAD_REDIRECT;
    return;
  }

  process.env.NEXT_PRIVATE_UPLOAD_REDIRECT = value;
};

beforeEach(() => {
  vi.resetAllMocks();

  process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 's3';
  setRedirectFlag('true');

  mocks.getOptionalSession.mockResolvedValue({ user: { id: 7 } });
  mocks.checkEnvelopeFileAccess.mockResolvedValue(true);
  mocks.findFirst.mockResolvedValue(buildEnvelopeItem());
  mocks.getFileServerSide.mockResolvedValue(FILE_BYTES);
  mocks.getPresignGetUrl.mockResolvedValue({ key: 'stored/current.pdf', url: PRESIGNED_URL });
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;
  setRedirectFlag(undefined);
});

describe('GET envelope item PDF (session)', () => {
  it('redirects to a short-lived presigned URL for the stored key when the flag is on', async () => {
    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(PRESIGNED_URL);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=240');

    expect(mocks.getPresignGetUrl).toHaveBeenCalledTimes(1);
    expect(mocks.getPresignGetUrl).toHaveBeenCalledWith('stored/current.pdf', {
      expiresIn: 300,
      responseContentType: 'application/pdf',
      responseCacheControl: 'private, max-age=300',
    });
    expect(mocks.getFileServerSide).not.toHaveBeenCalled();
  });

  it('presigns the initial key for the initial version', async () => {
    const response = await sessionRoute.request(SESSION_URL.replace('/current/', '/initial/'));

    expect(response.status).toBe(302);
    expect(mocks.getPresignGetUrl).toHaveBeenCalledWith('stored/initial.pdf', expect.any(Object));
  });

  it('serves the bytes when the flag is off', async () => {
    setRedirectFlag(undefined);

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=31536000, immutable');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(FILE_BYTES);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });

  it('serves the bytes for files stored in the database', async () => {
    mocks.findFirst.mockResolvedValue(buildEnvelopeItem('BYTES_64'));

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(FILE_BYTES);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });

  it('falls back to serving the bytes when presigning fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getPresignGetUrl.mockRejectedValue(new Error('presign failed'));

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(FILE_BYTES);
  });

  it('returns 404 without a session', async () => {
    mocks.getOptionalSession.mockResolvedValue({ user: null });

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(404);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });

  it('returns 404 for an embed session', async () => {
    mocks.getOptionalSession.mockResolvedValue({ session: { isEmbed: true }, user: { id: 7 } });

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(404);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has no access to the envelope', async () => {
    mocks.checkEnvelopeFileAccess.mockResolvedValue(false);

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(404);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
    expect(mocks.getFileServerSide).not.toHaveBeenCalled();
  });

  it('returns 404 when the item does not match the envelope and data ids', async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await sessionRoute.request(SESSION_URL);

    expect(response.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item_1', envelopeId: 'envelope_1', documentDataId: 'data_1' },
      }),
    );
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });

  it('returns 404 for an invalid embedding presign token', async () => {
    mocks.verifyEmbeddingPresignToken.mockRejectedValue(new Error('invalid'));

    const response = await sessionRoute.request(`${SESSION_URL}?presignToken=bad`);

    expect(response.status).toBe(404);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });
});

describe('GET envelope item PDF (recipient token)', () => {
  it('checks the recipient token before redirecting', async () => {
    const response = await tokenRoute.request(TOKEN_URL);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(PRESIGNED_URL);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'item_1',
          documentDataId: 'data_1',
          envelope: {
            id: 'envelope_1',
            recipients: { some: { token: 'recipient_token' } },
          },
        },
      }),
    );
  });

  it('returns 404 when the token does not match a recipient', async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await tokenRoute.request(TOKEN_URL);

    expect(response.status).toBe(404);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
    expect(mocks.getFileServerSide).not.toHaveBeenCalled();
  });

  it('serves the bytes when the flag is off', async () => {
    setRedirectFlag(undefined);

    const response = await tokenRoute.request(TOKEN_URL);

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(FILE_BYTES);
    expect(mocks.getPresignGetUrl).not.toHaveBeenCalled();
  });
});
