# Testing Conventions

## Stack
- Jest + ts-jest, config in `jest.config.js`
- Run: `npm test` (runs `jest --coverage`)

## Rules
- 100% coverage enforced (branches, functions, lines, statements) — build fails otherwise
- Tests live in `test/` mirroring `lib/` (e.g. `lib/foo-stack.ts` → `test/foo-stack.test.ts`)
- Use CDK `Template` assertions — snapshot tests are not used
- Use a `synthStack()` helper to synth with test defaults and return a `Template`
- Test resource properties, not implementation details
- Test default prop values and custom overrides separately
- Test outputs exist
- Verify user-data rendering (placeholders replaced, key packages present)
