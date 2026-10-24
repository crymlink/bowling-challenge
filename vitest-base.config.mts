import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Undo every `vi.spyOn` after each test, so no spec has to remember to.
    restoreMocks: true,
  },
});
