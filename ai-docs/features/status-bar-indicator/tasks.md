# Tasks: Status Bar Indicator

## Purpose
TDD task list for the status bar indicator feature. Adds a single new module `src/status-bar.ts` plus integration hooks in `src/main.ts` and a new test file `tests/status-bar.test.ts`.

## Phase 1: Core Infrastructure

- [x] INIT-001 Create `src/status-bar.ts` with empty exports per plan.md Feature Code Organization
- [x] INIT-002 Define `IndicatorMode` enum and `StatusBarIndicatorState` type in `src/status-bar.ts` per data-model.md Entities/Enums
- [x] INIT-003 Define constants in `src/status-bar.ts` per data-model.md Constants table: `INDICATOR_ICON_NON_COMPLIANT`, `INDICATOR_ICON_COMPLIANT`, `INDICATOR_LABEL_COMPLIANT`, `INDICATOR_LABEL_NON_COMPLIANT_FORMAT`, `INDICATOR_ARIA_NON_COMPLIANT_FORMAT`, `INDICATOR_ARIA_COMPLIANT`, `INDICATOR_CSS_CLASS_NON_COMPLIANT`, `INDICATOR_CSS_CLASS_COMPLIANT`, `MOBILE_TOUCH_TARGET_MIN_PX`, `MIN_CONTRAST_RATIO`
- [x] INIT-004 Scaffold `computeIndicatorMode(result, settings): IndicatorMode` and `renderStatusBarIndicator(plugin): void` stubs in `src/status-bar.ts` (no behavior yet)
- [x] INIT-005 Add optional `statusBarItem: HTMLElement | null = null` field to `WhitelistPlugin` in `src/main.ts` per plan.md Implementation Notes
- [x] INIT-006 Create `tests/status-bar.test.ts` skeleton with Obsidian mock pattern from `tests/compliance-modal.test.ts`

## Phase 2: User Story 1 - Non-Compliant Indicator with Violation Count (P1)

> Spec scenario 1: Status bar shows warning indicator with `Non-compliant (N)` when violations are present.

### TDD Cycle 1: Indicator Mode Computation
**Coverage**:
- Requirements: FR-001, FR-002
- Data entities: `StatusBarIndicatorState`, `ComplianceResult` [Dependency], `WhitelistSettings` [Dependency]
- Enums: `IndicatorMode`
- States: transition `(none) → non_compliant`

#### RED Phase
- [x] TEST-001 [US1] Test `computeIndicatorMode` returns `non_compliant` when `complianceResult.compliant === false` regardless of `showCompliantIndicator` value in `tests/status-bar.test.ts`
- [x] TEST-002 [US1] Test `computeIndicatorMode` returns `compliant_hidden` when `complianceResult === null` (pre-scan edge case) in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-001 [US1] Implement `computeIndicatorMode` in `src/status-bar.ts` to derive mode from `(result, settings)` per data-model.md state transitions

### TDD Cycle 2: Non-Compliant Render
**Coverage**:
- Requirements: FR-001, FR-002, UX-001, UX-002
- Components (ui.md): `StatusBarItemRoot`, `ComplianceIcon` (warning variant), `ComplianceLabel` (non-compliant variant)
- Constants: `INDICATOR_ICON_NON_COMPLIANT`, `INDICATOR_LABEL_NON_COMPLIANT_FORMAT`, `INDICATOR_CSS_CLASS_NON_COMPLIANT`
- Visual state: `non_compliant`

#### RED Phase
- [x] TEST-003 [US1] Test `renderStatusBarIndicator` produces a status bar element whose text equals `Non-compliant (3)` when violations count is 3, in `tests/status-bar.test.ts`
- [x] TEST-004 [US1] Test the rendered element has `INDICATOR_CSS_CLASS_NON_COMPLIANT` class and the warning icon (verify `setIcon` mock called with `INDICATOR_ICON_NON_COMPLIANT`) in `tests/status-bar.test.ts`
- [x] TEST-005 [US1] Test `renderStatusBarIndicator` invokes `addStatusBarItem` exactly once per render in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-002 [US1] Implement non-compliant render branch in `renderStatusBarIndicator` in `src/status-bar.ts`: call `plugin.addStatusBarItem()`, append icon via `setIcon`, append label using `INDICATOR_LABEL_NON_COMPLIANT_FORMAT`, apply CSS class
- [x] IMPL-003 [US1] Wire `renderStatusBarIndicator(this)` into `WhitelistPlugin.runBootComplianceFlow` in `src/main.ts` after `complianceResult` is assigned

## Phase 3: User Story 2 - Compliant Indicator When Setting Enabled (P1)

> Spec scenario 2: When compliant and `showCompliantIndicator === true`, render checkmark `Compliant`.

### TDD Cycle 3: Compliant Visible Render
**Coverage**:
- Requirements: FR-003, UX-001
- Components (ui.md): `StatusBarItemRoot`, `ComplianceIcon` (check variant), `ComplianceLabel` (compliant variant)
- Constants: `INDICATOR_ICON_COMPLIANT`, `INDICATOR_LABEL_COMPLIANT`, `INDICATOR_CSS_CLASS_COMPLIANT`
- States: transition `(none) → compliant_visible`
- Visual state: `compliant_visible`

#### RED Phase
- [x] TEST-006 [US2] Test `computeIndicatorMode` returns `compliant_visible` when `complianceResult.compliant === true` and `settings.showCompliantIndicator === true` in `tests/status-bar.test.ts`
- [x] TEST-007 [US2] Test `renderStatusBarIndicator` produces an element with text `Compliant`, the check icon, and `INDICATOR_CSS_CLASS_COMPLIANT` class in `tests/status-bar.test.ts`
- [x] TEST-008 [US2] Test compliant element has NO click handler attached (assert `addEventListener` not called with `"click"`) in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-004 [US2] Implement compliant_visible render branch in `renderStatusBarIndicator` in `src/status-bar.ts`

## Phase 4: User Story 3 - Hidden When Compliant + Setting Disabled (P2)

> Spec scenario 3: Compliant + `showCompliantIndicator === false` → no indicator rendered.

### TDD Cycle 4: Compliant Hidden Render
**Coverage**:
- Requirements: FR-004
- States: transition `(none) → compliant_hidden`, `compliant_visible → compliant_hidden`, `compliant_hidden → compliant_visible`
- Visual state: `compliant_hidden`

#### RED Phase
- [x] TEST-009 [US3] Test `computeIndicatorMode` returns `compliant_hidden` when `complianceResult.compliant === true` and `settings.showCompliantIndicator === false` in `tests/status-bar.test.ts`
- [x] TEST-010 [US3] Test `renderStatusBarIndicator` does NOT call `addStatusBarItem` and clears `plugin.statusBarItem` to `null` when in `compliant_hidden` mode in `tests/status-bar.test.ts`
- [x] TEST-011 [US3] Test re-rendering after toggling `showCompliantIndicator` from `true` to `false` detaches the previous element (assert `detach()` called on previous HTMLElement) in `tests/status-bar.test.ts`
- [x] TEST-012 [US3] Test re-rendering after toggling `showCompliantIndicator` from `false` to `true` creates a new compliant element in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-005 [US3] Implement compliant_hidden render branch + previous-element detachment logic in `src/status-bar.ts`
- [x] IMPL-006 [US3] Wire `renderStatusBarIndicator(this)` into `WhitelistPlugin.saveSettings` in `src/main.ts` after `saveData` resolves

## Phase 5: User Story 4 - Click Re-Opens Compliance Modal (P2)

> Spec scenario 4: Clicking the non-compliant indicator re-opens the compliance modal with current violations.

### TDD Cycle 5: Click Handler & Modal Reopen
**Coverage**:
- Requirements: FR-005
- Components (ui.md): `StatusBarItemRoot` (clickable variant)
- Reused modules: `showComplianceModal` from `src/compliance-modal.ts`, `writeComplianceNotification` from `src/notification-file.ts`

#### RED Phase
- [x] TEST-013 [US4] Test non-compliant element has `role="button"`, `tabIndex=0`, and a click event listener attached in `tests/status-bar.test.ts`
- [x] TEST-014 [US4] Test clicking the non-compliant element invokes `showComplianceModal` with `plugin.complianceResult.violations` in `tests/status-bar.test.ts`
- [x] TEST-015 [US4] Test clicking the non-compliant element invokes `writeComplianceNotification` with the resolved justification in `tests/status-bar.test.ts`
- [x] TEST-016 [US4] Test re-entrant click while a modal is already open is a no-op (second `showComplianceModal` invocation must not occur) in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-007 [US4] Attach click handler in non-compliant render branch in `src/status-bar.ts`; handler uses local `modalOpen` guard, calls `showComplianceModal`, then `writeComplianceNotification`

## Phase 6: User Story 5 - Indicator Updates On State Change (P3)

> Spec scenario 5: When compliance state changes (e.g., next boot or settings save), the indicator reflects the new state.

### TDD Cycle 6: Re-Render & Element Lifecycle
**Coverage**:
- Requirements: FR-001, FR-003, FR-004 (re-render path)
- States: transition `non_compliant → non_compliant` (re-render preserves visibility), `compliant_visible → compliant_hidden`, `compliant_hidden → compliant_visible`

#### RED Phase
- [x] TEST-017 [US5] Test calling `renderStatusBarIndicator` twice in non-compliant state detaches the first element before attaching the second (no orphan DOM nodes) in `tests/status-bar.test.ts`
- [x] TEST-018 [US5] Test rendering after `complianceResult` transitions from non-compliant to compliant produces the correct compliant or hidden element per `showCompliantIndicator` value in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-008 [US5] Ensure `renderStatusBarIndicator` always detaches `plugin.statusBarItem` before computing the new mode in `src/status-bar.ts`

## Phase 7: Accessibility & Mobile Coverage

### TDD Cycle 7: ARIA + Keyboard + Mobile Touch Target
**Coverage**:
- Accessibility (ux.md): screen reader ARIA labels, keyboard navigation (Tab, Enter, Space), visual contrast contract, mobile touch target
- Constants: `INDICATOR_ARIA_NON_COMPLIANT_FORMAT`, `INDICATOR_ARIA_COMPLIANT`, `MOBILE_TOUCH_TARGET_MIN_PX`, `MIN_CONTRAST_RATIO`

#### RED Phase
- [x] TEST-019 [US4] Test non-compliant element `aria-label` equals `Non-compliant: 3 plugin violations. Click to view.` for a 3-violation result, in `tests/status-bar.test.ts`
- [x] TEST-020 [US2] Test compliant_visible element has `role="status"` and `aria-label` equal to `INDICATOR_ARIA_COMPLIANT`, in `tests/status-bar.test.ts`
- [x] TEST-021 [US4] Test pressing Enter on the focused non-compliant element triggers the same handler as click (dispatch keyboard event in jsdom) in `tests/status-bar.test.ts`
- [x] TEST-022 [US4] Test pressing Space on the focused non-compliant element triggers the click handler in `tests/status-bar.test.ts`
- [x] TEST-023 [US1] Test the rendered non-compliant element exposes the documented contrast contract: it is assigned `INDICATOR_CSS_CLASS_NON_COMPLIANT` (style sheet enforces `MIN_CONTRAST_RATIO` ≥ 4.5 against status bar background — referenced in CSS) in `tests/status-bar.test.ts`
- [x] TEST-024 [US1] Test mobile touch target: rendered element's computed minimum size honors `MOBILE_TOUCH_TARGET_MIN_PX` (assert inline style or class that enforces ≥ 44 px) in `tests/status-bar.test.ts`

#### GREEN Phase
- [x] IMPL-009 [US4] Add ARIA attributes (`role`, `aria-label`, `tabIndex`) and Enter/Space keydown handlers to the non-compliant element branch in `src/status-bar.ts`
- [x] IMPL-010 [US2] Add `role="status"` and `aria-label` to the compliant element branch in `src/status-bar.ts`
- [x] IMPL-011 [US1] Add `styles.css` rules for `INDICATOR_CSS_CLASS_NON_COMPLIANT` and `INDICATOR_CSS_CLASS_COMPLIANT` enforcing `--text-warning` color and `MOBILE_TOUCH_TARGET_MIN_PX` minimum padding/height; document `MIN_CONTRAST_RATIO` contract in a CSS comment

## Execution Order

1. **Phase 1**: Core Infrastructure (blocks all stories)
2. **Phase 2** (US1, P1): Non-compliant indicator
3. **Phase 3** (US2, P1): Compliant indicator
4. **Phase 4** (US3, P2): Hidden mode
5. **Phase 5** (US4, P2): Click → modal reopen
6. **Phase 6** (US5, P3): Re-render lifecycle
7. **Phase 7**: Accessibility + mobile coverage (depends on US1/US2/US4 render branches)

Within each story: RED → GREEN cycles.

## Notes

- All tests live in `tests/status-bar.test.ts`; mock Obsidian per existing pattern in `tests/compliance-modal.test.ts`.
- Reuse `showComplianceModal` and `writeComplianceNotification` — do not duplicate the justification flow.
- Indicator state is a pure projection: tests should assert against `computeIndicatorMode` independently of DOM rendering.
- Element lifecycle: every render path must detach the previous element first to avoid orphan DOM nodes.
- All five spec.md acceptance scenarios are covered by Phases 2–6; Phase 7 covers ux.md accessibility and mobile constraints.
- TEST-/IMPL- numbering is sequential across all user story phases.
