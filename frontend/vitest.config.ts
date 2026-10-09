import {mergeConfig, type UserConfig} from 'vite';
import {defineConfig, type TestUserConfig} from 'vitest/config';
import viteConfig from './vite.config.ts';

const VITEST_DEFAULT_MODE = 'test';

type Mode = 'unit';

const MODES: Record<Mode, TestUserConfig> = {
  unit: {include: ['test/unit/**/*.test.{ts,tsx}']}
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

export default defineConfig(
  ({mode}): UserConfig =>
    mergeConfig(viteConfig, {
      test: {
        globals: true,
        environment: 'jsdom',
        passWithNoTests: true,
        ...modeConfiguration(mode)
      }
    })
);
