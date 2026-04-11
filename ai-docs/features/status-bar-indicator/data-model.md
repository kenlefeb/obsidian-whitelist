# Data Model - Status Bar Indicator

## Entities

### StatusBarIndicatorState
In-memory projection used by the renderer. Not persisted.

| Field | Type | Required | Source | Notes |
|-------|------|----------|--------|-------|
| mode | IndicatorMode | yes | derived | Computed from `ComplianceResult` + settings |
| violationCount | number | yes | `complianceResult.violations.length` | ≥ 0 |
| visible | boolean | yes | derived | False only when mode is `compliant_hidden` |

### ComplianceResult [Dependency]
Defined in `ai-docs/features/plugin-compliance-scan/data-model.md`. Required fields used here:
- `compliant: boolean`
- `violations: Violation[]`

### WhitelistSettings [Dependency]
Defined in `ai-docs/features/plugin-settings/data-model.md`. Required field used here:
- `showCompliantIndicator: boolean`

## Enums

### IndicatorMode
- `non_compliant` — vault has violations; warning indicator visible (always)
- `compliant_visible` — zero violations and `showCompliantIndicator === true`; checkmark visible
- `compliant_hidden` — zero violations and `showCompliantIndicator === false`; no element rendered

## States & Transitions

| From | Trigger | To |
|------|---------|----|
| (none) | Boot scan completes; `compliant === false` | `non_compliant` |
| (none) | Boot scan completes; `compliant === true` && `showCompliantIndicator` | `compliant_visible` |
| (none) | Boot scan completes; `compliant === true` && `!showCompliantIndicator` | `compliant_hidden` |
| `compliant_visible` | Settings save toggles `showCompliantIndicator` to false | `compliant_hidden` |
| `compliant_hidden` | Settings save toggles `showCompliantIndicator` to true | `compliant_visible` |
| `non_compliant` | Settings save (any) | `non_compliant` (re-render preserves visibility per FR-002) |

## Constants

| Name | Value | Source |
|------|-------|--------|
| INDICATOR_ICON_NON_COMPLIANT | `"alert-triangle"` | UX-001 (warning visual) |
| INDICATOR_ICON_COMPLIANT | `"check-circle"` | ux.md ComplianceIcon |
| INDICATOR_LABEL_COMPLIANT | `"Compliant"` | PRD UX Details / ux.md |
| INDICATOR_LABEL_NON_COMPLIANT_FORMAT | `` `Non-compliant (${count})` `` | FR-001, ux.md Quantified UX Elements |
| INDICATOR_ARIA_NON_COMPLIANT_FORMAT | `` `Non-compliant: ${count} plugin violations. Click to view.` `` | ux.md Accessibility Standards |
| INDICATOR_ARIA_COMPLIANT | `"Compliant"` | ux.md Accessibility Standards |
| INDICATOR_CSS_CLASS_NON_COMPLIANT | `"obsidian-whitelist-status-noncompliant"` | UX-001 visual distinction |
| INDICATOR_CSS_CLASS_COMPLIANT | `"obsidian-whitelist-status-compliant"` | UX-001 visual distinction |
| MOBILE_TOUCH_TARGET_MIN_PX | `44` | ux.md Touch Targets (≥ 44 CSS px) |
| MIN_CONTRAST_RATIO | `4.5` | ux.md Visual standards (≥ 4.5:1) |

## Validation Rules

- `violationCount` MUST equal `complianceResult.violations.length` at render time (no caching).
- `mode` MUST be derived strictly from `(complianceResult.compliant, settings.showCompliantIndicator)`; never set manually.
- Click handler MUST be attached only when `mode === "non_compliant"` (FR-005); compliant state MUST NOT be clickable (UX-001 separation).
- Re-render MUST destroy the previous HTMLElement before creating a new one to avoid orphan DOM nodes when transitioning into `compliant_hidden`.
