# Implementation Plan: Plugin Compliance Scan

## Purpose
Translates feature requirements into technical implementation strategy.

## Summary
Implement the core compliance scanning engine as a pure function that takes settings and plugin manifests, returns a ComplianceResult with violations. Integrate into WhitelistPlugin.onload() to run at boot time. Pure function design enables comprehensive unit testing without Obsidian API mocking.

## Technical Context

**Language:** TypeScript (existing)

**Framework:** Obsidian Plugin API (`app.plugins.manifests`, `app.plugins.enabledPlugins`)

**Storage:** None — reads from settings (plugin-settings dependency) and Obsidian API

**API Layer:** None — internal module

**Testing:** Vitest unit tests for pure scan logic; integration with main.ts tested manually

**Deployment:** Same as plugin-settings — copy to vault

**Constraints:** Must work on desktop and mobile; scan runs synchronously during onload

## Implementation Mapping

### Component Architecture
- **src/compliance.ts** (new): `runComplianceScan()` pure function, ComplianceResult and Violation types, ViolationReason enum
  - Takes: `settings: WhitelistSettings`, `manifests: Record<string, {id: string, name: string}>`, `selfId: string`
  - Returns: `ComplianceResult`
  - Pure function — no Obsidian API dependency, fully testable
- **src/main.ts** (modify): Call `runComplianceScan()` in onload after loadSettings, store result on plugin instance for downstream features

### Error Handling Approach
- No error states — scan is synchronous and operates on in-memory data
- If manifests object is empty/undefined → return compliant with empty violations (fail open)
- Plugin self-exclusion handled by filtering on `selfId` parameter

## Feature Code Organization

### Feature Implementation

```
src/
├── main.ts              # WhitelistPlugin (modify: add scan call in onload)
├── settings.ts          # WhitelistSettings (existing, dependency)
└── compliance.ts        # runComplianceScan(), ComplianceResult, Violation, ViolationReason

tests/
└── unit/
    ├── settings.test.ts # Existing
    └── compliance.test.ts # Compliance scan tests
```

**Selected Structure:** A (Standalone Module) — New module alongside existing settings; pure function with types, no separate API or UI layer.

## Testing Approach
- **Unit tests** (`tests/unit/compliance.test.ts`):
  - All 7 acceptance scenarios from spec.md as individual tests
  - Both edge cases (self-exclusion, installed-but-disabled)
  - ViolationReason correctness for each scenario
  - State transitions: idle → scanning → complete_compliant / complete_non_compliant
- Pure function design means zero mocking needed — pass in test data, assert on output

## Implementation Notes
- **Pure function over class**: `runComplianceScan()` as a function rather than a class — simpler, more testable, no state to manage
- **Dependency on plugin-settings**: Import WhitelistSettings type only — no runtime coupling beyond reading settings
- **Boot timing**: Use `this.app.workspace.onLayoutReady()` to ensure plugin manifests are populated before scanning (per research.md risk)
- **Edge case: installed but disabled**: FR-002 says check installed plugins (not just enabled). Use `app.plugins.manifests` which includes all installed plugins regardless of enabled state
