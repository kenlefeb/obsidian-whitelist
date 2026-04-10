# Tasks: Compliance Notification Modal

## Purpose
TDD-structured implementation tasks for the compliance-notification-modal feature. Implements a blocking modal that displays violations and collects user justification.

## Phase 1: Core Infrastructure

- [x] INIT-001 Create `src/compliance-modal.ts` with ComplianceModal class stub extending Modal, and `showComplianceModal(app, violations)` function stub in `src/compliance-modal.ts`
- [x] INIT-002 Create `tests/unit/compliance-modal.test.ts` test file with imports
- [ ] INIT-003 Define REASON_DISPLAY_TEXT, MODAL_TITLE, SUBMIT_BUTTON_LABEL, JUSTIFICATION_PLACEHOLDER constants per data-model.md in `src/compliance-modal.ts`

## Phase 2: User Story 1 - Show Violations on Boot (P1)

### TDD Cycle 1: Modal Display Logic
**Coverage**:
- Requirements: FR-001, FR-002, FR-008
- Data entities: ComplianceModal
- Components: ComplianceModal, ModalHeader, ViolationList, ViolationItem
- Constants: REASON_DISPLAY_TEXT, MODAL_TITLE

#### RED Phase
- [x] TEST-001 [US1] Test that REASON_DISPLAY_TEXT maps "not_on_whitelist" to "Not on approved list" and "on_blacklist" to "On blocked list" in `tests/unit/compliance-modal.test.ts`
- [x] TEST-002 [US1] Test that showComplianceModal returns a Promise in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [x] IMPL-001 [US1] Implement ComplianceModal.onOpen(): render header with MODAL_TITLE and violation count, violation description paragraph, scrollable violation list with ViolationItems showing plugin name and REASON_DISPLAY_TEXT in `src/compliance-modal.ts`

## Phase 3: User Story 2 - Submit Justification (P1)

### TDD Cycle 1: Justification Capture
**Coverage**:
- Requirements: FR-004, FR-005, FR-007
- Components: JustificationInput, SubmitButton
- Constants: SUBMIT_BUTTON_LABEL, JUSTIFICATION_PLACEHOLDER

#### RED Phase
- [x] TEST-003 [US2] Test that justification text is trimmed before return in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [x] IMPL-002 [US2] Add justification textarea with JUSTIFICATION_PLACEHOLDER and submit button with SUBMIT_BUTTON_LABEL to ComplianceModal.onOpen() in `src/compliance-modal.ts`
- [x] IMPL-003 [US2] Implement submit handler: set submitted=true, capture trimmed justification, resolve Promise, call close() in `src/compliance-modal.ts`

## Phase 4: User Story 3 - Empty Justification Allowed (P1)

### TDD Cycle 1: Empty Submission
**Coverage**:
- Requirements: FR-007

#### RED Phase
- [x] TEST-004 [US3] Test that empty string justification is accepted (trimmed to empty) in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [ ] IMPL-004 [US3] Verify submit handler accepts empty justification (may already pass from IMPL-003)

## Phase 5: User Story 4 - Block Dismissal (P2)

### TDD Cycle 1: Close Override
**Coverage**:
- Requirements: FR-006
- States: displaying → displaying (blocked close attempt)

#### RED Phase
- [x] TEST-005 [US4] Test that ComplianceModal has a close override mechanism (submitted flag) in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [ ] IMPL-005 [US4] Override close() in ComplianceModal: only call super.close() when submitted flag is true in `src/compliance-modal.ts`

## Phase 6: User Story 5 - No Modal When Compliant (P2)

### TDD Cycle 1: Skip Modal
**Coverage**:
- Requirements: FR-008

#### RED Phase
- [ ] TEST-006 [US5] Test that showComplianceModal is not called when violations array is empty (guard in caller) in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [ ] IMPL-006 [US5] Verify guard logic — showComplianceModal only called when violations.length > 0 (implemented in main.ts integration)

## Phase 7: User Story 6 - Re-open from Status Bar (P3)

### TDD Cycle 1: Re-open Support
**Coverage**:
- Requirements: FR-005 (re-usable function)

#### RED Phase
- [ ] TEST-007 [US6] Test that showComplianceModal can be called multiple times creating fresh modal instances in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [ ] IMPL-007 [US6] Verify showComplianceModal creates new ComplianceModal instance each call (may already pass)

## Phase 8: Integration

### TDD Cycle 1: Main Plugin Integration
**Coverage**:
- Requirements: FR-001, FR-008
- States: hidden → displaying → submitted → hidden

#### RED Phase
- [ ] TEST-008 [US1] Test that ComplianceModal and showComplianceModal are importable and have correct type signatures in `tests/unit/compliance-modal.test.ts`

#### GREEN Phase
- [ ] IMPL-008 [US1] Integrate into WhitelistPlugin.onload() in `src/main.ts`: after compliance scan, if non-compliant, await showComplianceModal(app, violations), store justification on plugin instance

## Execution Order

1. **Phase 1**: Core Infrastructure
2. **Phase 2**: US1 - Show Violations on Boot (P1)
3. **Phase 3**: US2 - Submit Justification (P1)
4. **Phase 4**: US3 - Empty Justification (P1)
5. **Phase 5**: US4 - Block Dismissal (P2)
6. **Phase 6**: US5 - No Modal When Compliant (P2)
7. **Phase 7**: US6 - Re-open from Status Bar (P3)
8. **Phase 8**: Integration

Within each story: RED → GREEN cycles

## Notes

- Tasks organized by TDD cycles: RED → GREEN
- Stories execute in priority order (P1 → P2 → P3)
- ComplianceModal extends Obsidian's Modal class — onOpen/close are Obsidian lifecycle methods
- showComplianceModal() returns Promise<string> for async justification capture
- Most tests focus on exported constants and logic; Modal UI rendering tested manually
- TEST-/IMPL- numbering is sequential across all user stories
