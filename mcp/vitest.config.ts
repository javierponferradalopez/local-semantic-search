import {defineConfig, type TestUserConfig} from 'vitest/config';

const VITEST_DEFAULT_MODE = 'test';

type Mode = 'unit' | 'integration';

const MODES: Record<Mode, TestUserConfig> = {
  unit: {include: ['test/unit/**/*.test.ts']},
  integration: {include: ['test/integration/**/*.test.ts']}
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
