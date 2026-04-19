---
name: source-driven-development
description: Grounds every implementation decision in official documentation. Use when you want authoritative, source-cited code free from outdated patterns. Use when building with any framework or library where correctness matters.
---

# Source-Driven Development

## Overview
Ground your decisions in primary documentation, not patterns from internal memory. Technologies evolve; official docs are the only current source of truth.

## Workflow
1. **Locate**: Find official docs for the tool/library (e.g., Tauri v2, React 18).
2. **Read**: View the source content using internal tools.
3. **Cite**: Refer to specific doc sections when proposing changes.
4. **Implement**: Follow the current official pattern.

## Why it matters
- Prevents using deprecated APIs.
- Ensures use of security best practices.
- Reduces guesswork for breaking changes (like migrating Tauri v1 to v2).
