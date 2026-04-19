---
name: test-driven-development
description: Drives development with tests. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# Test-Driven Development

## Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done. A codebase with good tests is an AI agent's superpower; a codebase without tests is a liability.

## When to Use

- Implementing any new logic or behavior
- Fixing any bug (the Prove-It Pattern)
- Modifying existing functionality
- Adding edge case handling
- Any change that could break existing behavior

**When NOT to use:** Pure configuration changes, documentation updates, or static content changes.

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation
      │                  │                    │
      ▼                  ▼                    ▼
   Test FAILS        Test PASSES         Tests still PASS
```

### Step 1: RED — Write a Failing Test

Write the test first. It must fail.

```typescript
describe('TaskService', () => {
  it('creates a task with title and default status', async () => {
    const task = await taskService.createTask({ title: 'Buy groceries' });
    expect(task.title).toBe('Buy groceries');
    expect(task.status).toBe('pending');
  });
});
```

### Step 2: GREEN — Make It Pass

Write the minimum code to make the test pass.

```typescript
export async function createTask(input: { title: string }): Promise<Task> {
  return { id: '1', title: input.title, status: 'pending' };
}
```

### Step 3: REFACTOR — Clean Up

Improve the code without changing behavior. Run tests after every step.

## The Prove-It Pattern (Bug Fixes)

1. Write a test that demonstrates the bug.
2. Confirm the test fails.
3. Implement the fix.
4. Prove the test passes.
5. Run full suite to check for regressions.

## The Test Pyramid

- **Unit Tests (~80%)**: Pure logic, fast.
- **Integration Tests (~15%)**: Component interactions, API boundaries.
- **E2E Tests (~5%)**: Full user flows, real browser.

**The Beyonce Rule:** If you liked it, you should have put a test on it.

## Writing Good Tests

- **Test State, Not Interactions**: Assert on outcomes, not internal method calls.
- **DAMP Over DRY**: Tests should be Descriptive And Meaningful Phrases, even if code is repeated.
- **Prefer Real Imps Over Mocks**: Mock only when slow, non-deterministic, or side-effect heavy.
- **Arrange-Act-Assert**: Clear structure for every test.
- **One Assertion Per Concept**.
- **Name Tests Descriptively**.

## Test Anti-Patterns to Avoid

- Testing implementation details.
- Flaky tests (timing/order dependent).
- Snapshot abuse.
- No test isolation.
- Mocking everything.

## Verification

After completing any implementation:

- [ ] Every new behavior has a test.
- [ ] All tests pass.
- [ ] Bug fixes include a reproduction test.
- [ ] Test names describe the behavior.
- [ ] No tests were skipped.
