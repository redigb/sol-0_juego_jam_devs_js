---
name: incremental-implementation
description: Delivers changes incrementally. Use when implementing any feature or change that touches more than one file. Use when you're about to write a large amount of code at once, or when a task feels too big to land in one step.
---

# Incremental Implementation

## Overview

Build in thin vertical slices — implement one piece, test it, verify it, then expand. Each increment should leave the system in a working, testable state. Avoid implementing an entire feature in one pass.

## The Increment Cycle
1. Implement (smallest complete piece).
2. Test.
3. Verify (build and manual check).
4. Commit (atomic).
5. Next slice.

## Rule 0: Simplicity First
Before writing code, ask: "What is the simplest thing that could work?"
After writing code: "Can this be done in fewer lines?"

## Rule 0.5: Scope Discipline
Touch only what the task requires. Do NOT clean up adjacent code or modernize unrelated syntax.

## Slicing Strategies
- **Vertical Slices**: Complete path through the stack (DB → API → UI).
- **Contract-First**: Define API contract first, then implement pieces.
- **Risk-First**: Tackle hardest/uncertain part first.

## Red Flags
- More than 100 lines of code without running tests.
- Multiple unrelated changes in one increment.
- Skipping verification steps to move faster.
- Large uncommitted changes accumulating.
