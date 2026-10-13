type Env = typeof import('../../../../src/api/env/env')['env'];

const importTheEnv = async (): Promise<Env> =>
  (await import('../../../../src/api/env/env')).env;

describe('env', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/test');
    vi.stubEnv('PORT', '0');
    vi.stubEnv('FILES_DIRECTORY', 'data');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', '');
    vi.stubEnv('LANGFUSE_SECRET_KEY', '');
    vi.stubEnv('LANGFUSE_BASE_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('.langfuse', () => {
    it('should be null when no Langfuse variable is set', async () => {
      expect((await importTheEnv()).langfuse).toBeNull();
    });

    it('should give the three Langfuse variables when all are set', async () => {
      vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk-lf-1');
      vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk-lf-1');
      vi.stubEnv('LANGFUSE_BASE_URL', 'https://cloud.langfuse.com');

      expect((await importTheEnv()).langfuse).toStrictEqual({
        publicKey: 'pk-lf-1',
        secretKey: 'sk-lf-1',
        baseUrl: 'https://cloud.langfuse.com'
      });
    });

    it('should fail with the names of the missing ones when only some are set', async () => {
      vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk-lf-1');

      await expect(importTheEnv()).rejects.toThrow(
        'Set all the Langfuse environment variables or none of them. Not set: LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL'
      );
    });
  });
});
