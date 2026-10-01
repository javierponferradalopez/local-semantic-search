import {defineConfig, type TestUserConfig} from 'vitest/config';

const VITEST_DEFAULT_MODE = 'test';

const SHARED_INFRASTRUCTURE: TestUserConfig = {
  globalSetup: 'test/lib/vitest/globalSetup.ts',
  setupFiles: ['test/lib/vitest/setupWithInfrastructure.ts'],
  fileParallelism: false,
  testTimeout: 30_000
};

type Mode = 'unit' | 'integration' | 'e2e' | 'eval';

const MODES: Record<Mode, TestUserConfig> = {
  unit: {include: ['test/unit/**/*.test.ts']},
  integration: {...SHARED_INFRASTRUCTURE, include: ['test/integration/**/*.test.ts']},
  e2e: {...SHARED_INFRASTRUCTURE, include: ['test/e2e/**/*.test.ts']},
  eval: {
    ...SHARED_INFRASTRUCTURE,
    include: ['test/eval/**/*.eval.ts'],
    reporters: ['verbose'],
    testTimeout: 600_000,
    // The Ingest of the whole corpus runs in a hook.
    hookTimeout: 1_800_000
  }
};

const isMode = (name: string): name is Mode => name in MODES;

const modeConfiguration = (mode: string): TestUserConfig => {
  const name = mode === VITEST_DEFAULT_MODE ? 'unit' : mode;

  if (!isMode(name)) {
    throw new Error(
      `The mode ${mode} is not a test mode. The test modes are ${Object.keys(MODES).join(', ')}.`
    );
  }

  return MODES[name];
};

export default defineConfig(({mode}) => ({
  test: {globals: true, passWithNoTests: true, ...modeConfiguration(mode)}
}));
