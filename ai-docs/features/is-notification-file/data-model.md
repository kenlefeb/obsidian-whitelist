# Data Model - IS Notification File

## Entities

### ComplianceEvent
JSON object written to a notification file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | string | yes | ISO 8601 timestamp of event (FR-002) |
| vaultName | string | yes | Obsidian vault name from `app.vault.getName()` (FR-002) |
| violations | Violation[] | yes | [Dependency] from plugin-compliance-scan/data-model.md (FR-002) |
| justification | string | yes | User-provided justification, may be empty string (FR-002) |

### NotificationFile
Individual JSON file on disk.

| Field | Type | Description |
|-------|------|-------------|
| path | string | Full vault-relative path including directory and filename |
| content | string | JSON.stringify(ComplianceEvent) with 2-space indentation |

## Enums
None — uses ViolationReason from plugin-compliance-scan.

## States & Transitions

```
idle → writing (trigger: user submits compliance modal with violations)
writing → written (trigger: file write succeeds)
writing → failed (trigger: file write throws)
written → idle
failed → idle
```

## Constants

| Name | Value | Source |
|------|-------|--------|
| FILENAME_PREFIX | `compliance-` | ux.md Quantified UX Elements |
| FILENAME_EXTENSION | `.json` | FR-001 (JSON format) |
| JSON_INDENT | 2 | Readability for IS inspection |
| ERROR_NOTICE_PREFIX | `Failed to write compliance notification: ` | ux.md Error Presentation |

## Validation Rules

### ComplianceEvent
- timestamp must be valid ISO 8601 — produced via `new Date().toISOString()`
- vaultName is whatever the Obsidian vault name is (no validation)
- violations array is passed through from compliance scan (no validation)
- justification may be empty string (no validation)

### Directory Creation
- If `settings.notificationDirectory` does not exist, create it recursively via `adapter.mkdir()` (FR-004)
- Directory path is vault-relative

### Filename Generation
- Format: `${FILENAME_PREFIX}${timestamp}${FILENAME_EXTENSION}`
- Timestamp sanitized for filesystem safety: replace `:` and `.` with `-`
- Each write produces a unique filename (FR-003) due to millisecond precision in timestamp
