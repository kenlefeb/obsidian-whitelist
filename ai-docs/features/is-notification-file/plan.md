# Implementation Plan: IS Notification File

## Purpose
Translates feature requirements into technical implementation strategy.

## Summary
Implement a module that writes compliance events as JSON files to a vault-relative directory after the user submits the compliance modal. Separates a pure `buildComplianceEvent()` function from the I/O wrapper `writeComplianceNotification()` for maximum testability. Handles directory creation and write failures gracefully without crashing the plugin.

## Technical Context

**Language:** TypeScript (existing)

**Framework:** Obsidian Plugin API (Vault adapter: `write`, `exists`, `mkdir`; Notice API)

**Storage:** Vault filesystem via `app.vault.adapter` — vault-relative paths only

**API Layer:** None — internal module

**Testing:** Vitest unit tests for `buildComplianceEvent()` (pure) and `writeComplianceNotification()` (with mocked adapter)

**Constraints:** All file operations through Obsidian Vault API (not Node.js fs); vault-relative paths for mobile compatibility; must not crash on write failures

## Implementation Mapping

### Component Architecture
- **src/notification-file.ts** (new):
  - `buildComplianceEvent(vaultName, violations, justification)` — pure function returning ComplianceEvent object
  - `buildNotificationFilename(date)` — pure function generating `compliance-<timestamp>.json`
  - `writeComplianceNotification(app, directory, violations, justification)` — async I/O wrapper handling directory creation, file write, and error notification
  - Constants: FILENAME_PREFIX, FILENAME_EXTENSION, JSON_INDENT, ERROR_NOTICE_PREFIX
- **src/main.ts** (modify): After `showComplianceModal()` resolves, call `writeComplianceNotification()` with directory from settings

### Error Handling Approach
- All file I/O wrapped in try/catch
- On failure: display Obsidian Notice with ERROR_NOTICE_PREFIX + error message, log full error to console
- Plugin continues running — write failure is not fatal

## Feature Code Organization

### Feature Implementation

```
src/
├── main.ts              # WhitelistPlugin (modify: call writeComplianceNotification after modal submit)
├── settings.ts          # Existing (reads notificationDirectory)
├── compliance.ts        # Existing (Violation type)
├── compliance-modal.ts  # Existing (justification flow)
└── notification-file.ts # buildComplianceEvent, buildNotificationFilename, writeComplianceNotification, constants

tests/
└── unit/
    ├── settings.test.ts        # Existing
    ├── compliance.test.ts      # Existing
    ├── compliance-modal.test.ts # Existing
    └── notification-file.test.ts # Event building, filename generation, write logic, error handling
```

**Selected Structure:** A (Standalone Module) — New file alongside existing features.

## Testing Approach
- **Unit tests** (`tests/unit/notification-file.test.ts`):
  - `buildComplianceEvent()`: all fields populated correctly with empty and non-empty justification
  - `buildNotificationFilename()`: ISO timestamp sanitization (colons and dots replaced)
  - `writeComplianceNotification()`: creates directory when missing, skips mkdir when exists, writes JSON content
  - Error path: adapter throws → Notice shown, error logged, function returns without throwing
  - Separate files per event: two consecutive calls produce different filenames (different timestamps)
- Uses mocked Obsidian Vault adapter with `write`, `exists`, `mkdir` spies

## Implementation Notes
- **Pure function separation**: `buildComplianceEvent()` and `buildNotificationFilename()` are pure — testable without any mocking. `writeComplianceNotification()` is the only function that touches the adapter.
- **Adapter mock requirements**: Tests need mocked `app.vault.adapter` with `write`, `exists`, `mkdir` methods; mocked `app.vault.getName()`; mocked `Notice` constructor — extend existing `tests/mocks/obsidian.ts`
- **Timestamp sanitization**: ISO format `2026-04-09T18:35:25.123Z` contains `:` and `.` which are filesystem-unsafe on Windows. Replace with `-` → `2026-04-09T18-35-25-123Z`
- **Mobile behavior**: `vault.adapter.mkdir()` recursively creates parent directories on both desktop and mobile adapters
- **Empty justification**: The modal already trims and may return empty string — write as-is, no special handling needed
