# Tasks: IS Notification File

## Purpose
TDD-structured implementation tasks for the is-notification-file feature. Writes compliance events as JSON files to a vault-relative directory.

## Phase 1: Core Infrastructure

- [x] INIT-001 Create `src/notification-file.ts` with ComplianceEvent interface, constants (FILENAME_PREFIX, FILENAME_EXTENSION, JSON_INDENT, ERROR_NOTICE_PREFIX), and function stubs per data-model.md
- [x] INIT-002 Create `tests/unit/notification-file.test.ts` test file with imports
- [x] INIT-003 Extend `tests/mocks/obsidian.ts` to add Vault with `adapter.write`, `adapter.exists`, `adapter.mkdir`, `getName`, and Notice constructor mocks

## Phase 2: User Story 1 - Write Notification on Submit (P1)

### TDD Cycle 1: ComplianceEvent Building
**Coverage**:
- Requirements: FR-001, FR-002
- Data entities: ComplianceEvent

#### RED Phase
- [x] TEST-001 [US1] Test that `buildComplianceEvent(vaultName, violations, justification)` returns object with timestamp (valid ISO), vaultName, violations array, and justification string in `tests/unit/notification-file.test.ts`
- [x] TEST-002 [US1] Test that `buildComplianceEvent` includes empty string justification as-is in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [x] IMPL-001 [US1] Implement `buildComplianceEvent(vaultName, violations, justification)` pure function in `src/notification-file.ts`

### TDD Cycle 2: Write Notification File
**Coverage**:
- Requirements: FR-001, FR-006
- Constants: FILENAME_PREFIX, FILENAME_EXTENSION, JSON_INDENT

#### RED Phase
- [x] \1 [US1] Test that `writeComplianceNotification` calls `adapter.write` with JSON content in `tests/unit/notification-file.test.ts`
- [x] \1 [US1] Test that written JSON content has 2-space indentation (JSON_INDENT) in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [x] \1 [US1] Implement `writeComplianceNotification(app, directory, violations, justification)` to build event and write to vault via adapter in `src/notification-file.ts`

## Phase 3: User Story 2 - All Fields Populated (P1)

### TDD Cycle 1: Complete Event Data
**Coverage**:
- Requirements: FR-002

#### RED Phase
- [x] \1 [US2] Test that written file contains timestamp, vaultName, violations (with pluginId, pluginName, reason), and justification fields in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [x] \1 [US2] Verify writeComplianceNotification assembles complete event (may already pass from IMPL-002)

## Phase 4: User Story 3 - Create Directory If Missing (P2)

### TDD Cycle 1: Directory Creation
**Coverage**:
- Requirements: FR-004

#### RED Phase
- [x] \1 [US3] Test that `writeComplianceNotification` calls `adapter.mkdir` when `adapter.exists` returns false in `tests/unit/notification-file.test.ts`
- [x] \1 [US3] Test that `writeComplianceNotification` does NOT call `adapter.mkdir` when `adapter.exists` returns true in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [x] \1 [US3] Implement directory existence check and mkdir logic in `writeComplianceNotification` in `src/notification-file.ts`

## Phase 5: User Story 4 - Unique Filenames (P2)

### TDD Cycle 1: Timestamp-based Filenames
**Coverage**:
- Requirements: FR-003
- Constants: FILENAME_PREFIX, FILENAME_EXTENSION

#### RED Phase
- [x] \1 [US4] Test that `buildNotificationFilename(date)` returns `compliance-<sanitized-timestamp>.json` with colons and dots replaced by hyphens in `tests/unit/notification-file.test.ts`
- [x] \1 [US4] Test that two consecutive `buildNotificationFilename` calls with different dates produce different filenames in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [x] \1 [US4] Implement `buildNotificationFilename(date)` pure function in `src/notification-file.ts`
- [x] \1 [US4] Use `buildNotificationFilename` in `writeComplianceNotification` for file path construction

## Phase 6: User Story 5 - Empty Justification (P3)

### TDD Cycle 1: Empty Justification Handling
**Coverage**:
- Requirements: FR-002

#### RED Phase
- [x] \1 [US5] Test that `writeComplianceNotification` with empty justification writes valid JSON with empty string field in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [x] \1 [US5] Verify writeComplianceNotification handles empty justification (may already pass)

## Phase 7: Edge Cases

### TDD Cycle 1: Write Failure Handling
**Coverage**:
- Requirements: FR-005, UX-001
- Constants: ERROR_NOTICE_PREFIX

#### RED Phase
- [ ] TEST-011 [US1] Test that `writeComplianceNotification` catches adapter.write errors without throwing in `tests/unit/notification-file.test.ts`
- [ ] TEST-012 [US1] Test that `writeComplianceNotification` displays Notice with ERROR_NOTICE_PREFIX when write fails in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [ ] IMPL-008 [US1] Wrap write operation in try/catch, show Notice with error message, log to console in `src/notification-file.ts`

### TDD Cycle 2: Multiple Events
**Coverage**:
- Requirements: FR-003

#### RED Phase
- [ ] TEST-013 [US1] Test that two sequential `writeComplianceNotification` calls produce separate files in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [ ] IMPL-009 [US1] Verify separate files per event (may already pass from IMPL-005/006)

## Phase 8: Integration

### TDD Cycle 1: Main Plugin Integration
**Coverage**:
- Requirements: FR-001, FR-006

#### RED Phase
- [ ] TEST-014 [US1] Test that `writeComplianceNotification` export has correct type signature in `tests/unit/notification-file.test.ts`

#### GREEN Phase
- [ ] IMPL-010 [US1] Integrate into `WhitelistPlugin.runBootComplianceFlow()` in `src/main.ts`: after showComplianceModal resolves, call `writeComplianceNotification(this.app, this.settings.notificationDirectory, violations, justification)`

## Execution Order

1. **Phase 1**: Core Infrastructure
2. **Phase 2**: US1 - Write Notification on Submit (P1)
3. **Phase 3**: US2 - All Fields Populated (P1)
4. **Phase 4**: US3 - Create Directory If Missing (P2)
5. **Phase 5**: US4 - Unique Filenames (P2)
6. **Phase 6**: US5 - Empty Justification (P3)
7. **Phase 7**: Edge Cases
8. **Phase 8**: Integration

Within each story: RED → GREEN cycles

## Notes

- `buildComplianceEvent` and `buildNotificationFilename` are pure functions — no mocking needed
- `writeComplianceNotification` uses mocked Obsidian Vault adapter
- Write failures must not crash plugin — error Notice + console log + graceful continuation
- TEST-/IMPL- numbering is sequential across all user stories
