# Tasks: Plugin Compliance Scan

## Purpose
TDD-structured implementation tasks for the plugin-compliance-scan feature. Implements a pure compliance scanning function that checks installed plugins against whitelist/blacklist settings.

## Phase 1: Core Infrastructure

- [x] INIT-001 Create `src/compliance.ts` with ComplianceResult, Violation interfaces and ViolationReason enum per data-model.md
- [x] INIT-002 Create `tests/unit/compliance.test.ts` test file with imports
- [x] INIT-003 Export `runComplianceScan(settings, manifests, selfId)` function stub returning compliant result in `src/compliance.ts`

## Phase 2: User Story 1 - Whitelist Enforcement (P1)

### TDD Cycle 1: Whitelist Violation Detection
**Coverage**:
- Requirements: FR-001, FR-003, FR-007
- Data entities: ComplianceResult, Violation, ViolationReason
- States: scanning → complete_non_compliant

#### RED Phase
- [x] TEST-001 [US1] Test that plugins not on whitelist are flagged with reason "not_on_whitelist" when whitelist has entries in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-001 [US1] Implement whitelist check logic in `runComplianceScan()`: iterate manifests, exclude selfId, flag plugins not in settings.whitelist in `src/compliance.ts`

## Phase 3: User Story 2 - Blacklist Enforcement (P1)

### TDD Cycle 1: Blacklist Violation Detection
**Coverage**:
- Requirements: FR-001, FR-004, FR-007
- Data entities: ComplianceResult, Violation, ViolationReason
- States: scanning → complete_non_compliant

#### RED Phase
- [x] TEST-002 [US2] Test that plugins on blacklist are flagged with reason "on_blacklist" when blacklist has entries in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-002 [US2] Implement blacklist check logic in `runComplianceScan()`: flag plugins found in settings.blacklist in `src/compliance.ts`

## Phase 4: User Story 3 - Blacklist Precedence (P1)

### TDD Cycle 1: Both Lists Active
**Coverage**:
- Requirements: FR-005
- Data entities: ComplianceResult, Violation
- Constants: ViolationReason.on_blacklist

#### RED Phase
- [x] TEST-003 [US3] Test that a plugin on both whitelist and blacklist is flagged with reason "on_blacklist" (blacklist precedence) in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-003 [US3] Ensure blacklist check runs before/overrides whitelist in `runComplianceScan()` in `src/compliance.ts`

## Phase 5: User Story 4 - No Enforcement When Lists Empty (P1)

### TDD Cycle 1: Empty Lists
**Coverage**:
- Requirements: FR-006, FR-007
- States: scanning → complete_compliant

#### RED Phase
- [ ] TEST-004 [US4] Test that empty whitelist and empty blacklist returns compliant with no violations in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-004 [US4] Add early return in `runComplianceScan()` when both lists empty in `src/compliance.ts`

## Phase 6: User Story 5 - Whitelist-Only Enforcement (P2)

### TDD Cycle 1: Only Whitelist Active
**Coverage**:
- Requirements: FR-003, FR-006

#### RED Phase
- [ ] TEST-005 [US5] Test that only whitelist enforcement applies when whitelist has entries and blacklist is empty in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-005 [US5] Ensure blacklist check is skipped when blacklist is empty in `src/compliance.ts`

## Phase 7: User Story 6 - Blacklist-Only Enforcement (P2)

### TDD Cycle 1: Only Blacklist Active
**Coverage**:
- Requirements: FR-004, FR-006

#### RED Phase
- [ ] TEST-006 [US6] Test that only blacklist enforcement applies when blacklist has entries and whitelist is empty in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-006 [US6] Ensure whitelist check is skipped when whitelist is empty in `src/compliance.ts`

## Phase 8: User Story 7 - No Plugins Installed (P3)

### TDD Cycle 1: Empty Plugin List
**Coverage**:
- Requirements: FR-007
- States: scanning → complete_compliant

#### RED Phase
- [ ] TEST-007 [US7] Test that empty manifests object returns compliant with no violations in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-007 [US7] Verify `runComplianceScan()` handles empty manifests (may already pass)

## Phase 9: Edge Cases

### TDD Cycle 1: Self-Exclusion
**Coverage**:
- Requirements: FR-001
- Constants: SELF_PLUGIN_ID

#### RED Phase
- [ ] TEST-008 [US1] Test that the whitelist plugin itself is excluded from compliance checking in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-008 [US1] Verify selfId filtering in `runComplianceScan()` (may already pass from IMPL-001)

### TDD Cycle 2: Installed But Disabled
**Coverage**:
- Requirements: FR-002

#### RED Phase
- [ ] TEST-009 [US1] Test that installed-but-disabled plugins are still checked against lists in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-009 [US1] Verify scan uses manifests (all installed) not just enabled plugins (may already pass)

### TDD Cycle 3: Integration with Main Plugin
**Coverage**:
- Requirements: FR-008
- States: idle → scanning → complete

#### RED Phase
- [ ] TEST-010 [US1] Test that `runComplianceScan` is callable with WhitelistSettings and returns valid ComplianceResult type in `tests/unit/compliance.test.ts`

#### GREEN Phase
- [ ] IMPL-010 [US1] Integrate `runComplianceScan()` into `WhitelistPlugin.onload()` in `src/main.ts`: call after loadSettings inside `onLayoutReady`, store result on plugin instance for downstream features

## Execution Order

1. **Phase 1**: Core Infrastructure (blocks all stories)
2. **Phase 2**: US1 - Whitelist Enforcement (P1)
3. **Phase 3**: US2 - Blacklist Enforcement (P1)
4. **Phase 4**: US3 - Blacklist Precedence (P1)
5. **Phase 5**: US4 - No Enforcement When Lists Empty (P1)
6. **Phase 6**: US5 - Whitelist-Only Enforcement (P2)
7. **Phase 7**: US6 - Blacklist-Only Enforcement (P2)
8. **Phase 8**: US7 - No Plugins Installed (P3)
9. **Phase 9**: Edge Cases

Within each story: RED → GREEN cycles

## Notes

- Tasks organized by TDD cycles: RED → GREEN
- Stories execute in priority order (P1 → P2 → P3 → edge cases)
- `runComplianceScan()` is a pure function — all tests pass data in, assert on output, no mocking needed
- Depends on plugin-settings: WhitelistSettings type imported from `src/settings.ts`
- TEST-/IMPL- numbering is sequential across all user stories
