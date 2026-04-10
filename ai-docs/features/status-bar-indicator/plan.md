# Implementation Plan: Status Bar Indicator

## Purpose
Render a persistent Obsidian status bar item that reflects vault compliance state and re-opens the compliance modal on click when violations exist.

## Summary
Add a single new module `src/status-bar.ts` exposing `renderStatusBarIndicator(plugin)`. `WhitelistPlugin` calls it after the boot compliance scan and again after settings save. State is a pure projection of `complianceResult` + `settings.showCompliantIndicator` (see research.md). No new persistence, no new dependencies.

## Technical Context

**Language:** TypeScript (strict)

**Framework:** Obsidian Plugin API (`addStatusBarItem`, `setIcon`)

**Storage:** None (read-only projection of in-memory `WhitelistPlugin.complianceResult` and existing `WhitelistSettings`)

**API Layer:** N/A — no external calls; intra-plugin module function call

**Testing:** Vitest unit tests with Obsidian API mocked the same way as existing `compliance-modal.test.ts` and `notification-file.test.ts`

**Deployment:** Bundled by existing esbuild config (no changes needed)

**Constraints:**
- Must use `addStatusBarItem()` only — no DOM injection
- Mobile views without a status bar must degrade silently (FR-002, UX-002)
- Click handler attached only in non-compliant state (FR-005)
- No mid-session re-scan (PRD non-goal); re-render is event-driven on settings save only

## Implementation Mapping

### Component Architecture

| Source artifact | Code module | Notes |
|-----------------|-------------|-------|
| `StatusBarItemRoot` (ui.md) | `src/status-bar.ts` → `renderStatusBarIndicator()` | Owns element lifecycle: destroy + recreate per render |
| `ComplianceIcon` (ui.md) | `src/status-bar.ts` → internal `appendIcon()` | Uses Obsidian `setIcon` with `INDICATOR_ICON_*` constants |
| `ComplianceLabel` (ui.md) | `src/status-bar.ts` → internal `appendLabel()` | Uses `INDICATOR_LABEL_*` constants from data-model.md |
| `IndicatorMode` (data-model.md) | `src/status-bar.ts` → `computeIndicatorMode(result, settings)` | Pure helper, easy to unit-test |
| Boot integration | `src/main.ts` → `runBootComplianceFlow()` | Add `renderStatusBarIndicator(this)` after `complianceResult` is set, before/after modal flow |
| Settings re-render | `src/main.ts` → `saveSettings()` | Call `renderStatusBarIndicator(this)` after `saveData` resolves |
| Plugin lifecycle | `WhitelistPlugin` instance state | Track current status bar element on `this.statusBarItem` so the next render can detach it |

### Data Models
- No new persistent entities. `IndicatorMode` and `StatusBarIndicatorState` (data-model.md) live as inline TypeScript types in `src/status-bar.ts`.
- Reuses `ComplianceResult` from `src/compliance.ts` and `WhitelistSettings` from `src/settings.ts`.

### API Operations
- `renderStatusBarIndicator(plugin: WhitelistPlugin): void` — idempotent renderer
- `computeIndicatorMode(result: ComplianceResult | null, settings: WhitelistSettings): IndicatorMode`
- Click handler (closure inside renderer): `async () => { if (modalOpen) return; ... await showComplianceModal(...); await writeComplianceNotification(...); }`

### State Management
- Single source of truth: `plugin.complianceResult` + `plugin.settings`
- Each render computes mode fresh; previous element is removed via `el.detach()` before new element is created
- `modalOpen` guard is local to the click handler closure to prevent re-entry

### Error Handling Approach
- `addStatusBarItem` failure (mobile): silent — UX-002 explicitly allows degradation
- Click → modal flow errors: rely on existing `writeComplianceNotification` try/catch (already produces `Notice` on failure per existing AICODE-NOTE in `main.ts`)
- No new error types introduced

## Feature Code Organization

```
src/
├── main.ts                  # MODIFIED: call renderStatusBarIndicator from boot + saveSettings
├── status-bar.ts            # NEW: renderStatusBarIndicator + computeIndicatorMode + constants

tests/
└── status-bar.test.ts       # NEW: unit tests for renderer + mode helper
```

**Selected Structure:** Structure A (Standalone Module) — feature is a single ~80–120 line module that hooks into the existing plugin entry; no UI/backend split, no new service layer.

## Testing Approach

- **Test Structure:** Single file `tests/status-bar.test.ts` colocated with existing feature tests; uses the same Obsidian mock pattern (`vi.mock("obsidian", ...)`) as `compliance-modal.test.ts`.
- **Unit coverage (`computeIndicatorMode`)**: pure function, exhaustive over the three modes including edge case of `complianceResult === null` before scan completes (must yield `compliant_hidden` no-op).
- **Unit coverage (`renderStatusBarIndicator`)**: assert that
  1. [US1] Non-compliant result renders an element with the warning icon and `Non-compliant (N)` label, count matches violations length
  2. [US1] Element receives the non-compliant CSS class and `aria-label` from `INDICATOR_ARIA_NON_COMPLIANT_FORMAT`
  3. [US1] Element is `role="button"` and `tabIndex=0` (clickable, focusable)
  4. [US2] Compliant result with `showCompliantIndicator=true` renders check icon + `Compliant` label, no click handler
  5. [US3] Compliant result with `showCompliantIndicator=false` renders no element (or detaches existing one)
  6. [US4] Click handler on non-compliant element invokes `showComplianceModal` with current violations, then `writeComplianceNotification`
  7. [US4] Re-entrant click while modal is open is a no-op
  8. [US5] Calling renderer twice removes the previous element before attaching the new one (no orphan)
- **Integration touchpoint**: spy on `WhitelistPlugin.runBootComplianceFlow` to confirm `renderStatusBarIndicator` is invoked after `complianceResult` is set (covers both compliant and non-compliant boot paths).

## Implementation Notes

- **Reuse over duplication**: Click path explicitly reuses `showComplianceModal` + `writeComplianceNotification` to keep a single justification flow. Do not introduce a "re-open modal" variant.
- **Element lifecycle**: Track the element on `plugin.statusBarItem` (new optional field). On re-render, call `previous.detach()` first. Avoids the orphan DOM bug noted in research.md risks.
- **AICODE markers**: Add `AICODE-NOTE: status-bar-indicator IMPL-XXX implements [FR-XXX]` at each non-trivial branch and the click handler.
- **Edge case coverage**: All five spec.md acceptance scenarios are covered by the testing approach above. The mobile-status-bar-absent edge case is covered by the silent-degradation behavior of `addStatusBarItem` and is asserted indirectly via the "renders no element when API returns nothing" test path.
- **Scalability**: O(1) per render. Violation count is read once from already-computed scan result. No new performance concerns.
- **Existing module reuse**: `src/main.ts` (boot hook + settings save), `src/compliance-modal.ts` (`showComplianceModal`), `src/notification-file.ts` (`writeComplianceNotification`), `src/settings.ts` (`WhitelistSettings`, `showCompliantIndicator`), `src/compliance.ts` (`ComplianceResult`).
