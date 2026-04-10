# Data Model - Compliance Notification Modal

## Entities

### ComplianceModal
Obsidian Modal subclass displaying violations and collecting justification.

| Field | Type | Description |
|-------|------|-------------|
| violations | Violation[] | [Dependency] from plugin-compliance-scan/data-model.md |
| justification | string | User-entered text, may be empty (FR-007) |
| submitted | boolean | Whether user has submitted (controls close blocking) |

## Enums
None — uses ViolationReason from plugin-compliance-scan.

## States & Transitions

```
hidden → displaying (trigger: compliance scan finds violations)
displaying → submitted (trigger: user clicks submit button)
submitted → hidden (trigger: modal closes after submit)
```

No re-display state in this feature — re-opening from status bar triggers a new modal instance.

## Constants

| Name | Value | Source |
|------|-------|--------|
| REASON_DISPLAY_TEXT | {"not_on_whitelist": "Not on approved list", "on_blacklist": "On blocked list"} | FR-002, UX-002 |
| MODAL_TITLE | "Plugin Compliance Notice" | UX-001 |
| SUBMIT_BUTTON_LABEL | "Acknowledge" | UX-003 |
| JUSTIFICATION_PLACEHOLDER | "Optional: explain why these plugins are installed" | FR-004 |

## Validation Rules

### Justification
- No validation — empty string is accepted (FR-007)
- Trimmed before return (leading/trailing whitespace removed)
