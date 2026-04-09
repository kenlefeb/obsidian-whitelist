# Requirements Checklist: Plugin Settings

**Source**: spec.md

## Completeness

- [x] CHK001 Is save behavior (FR-003) explicitly defined for each settings control (lists, directory, toggle)? [Completeness, FR-003]
- [x] CHK002 Is the self-addition policy documented -- plugin's own ID is allowed in lists for future version-specific whitelisting? [Completeness, Resolution: CHK002]
- [x] CHK003 Is the maximum number of entries per list bounded or explicitly unbounded? [Completeness, FR-001]

## Clarity

- [x] CHK004 Is "plugin ID" format specified with examples beyond the data-model description? [Clarity, FR-006]
- [x] CHK005 Is the save timing defined -- immediate on each keystroke, on blur, or on explicit action? [Clarity, FR-003]

## Consistency

- [x] CHK006 Does the default notification directory in spec.md edge case match DEFAULT_NOTIFICATION_DIR in data-model.md? [Consistency, FR-004]
- [x] CHK007 Does the "merge with defaults" behavior in edge case match FR-002 load description? [Consistency, FR-001 -> FR-002]

## Coverage

- [x] CHK008 Are all scenario types covered: happy path (add/save), alternate (pre-configured), exception (malformed data), recovery (fallback to defaults)? [Coverage, spec.md: Acceptance Scenarios]
- [x] CHK009 Is cross-list duplicate prevention documented -- adding an ID to one list is rejected if already in the other list? [Coverage, Resolution: CHK009]

## Cross-Artifact

- [x] CHK010 Are all FR-XXX from spec.md covered by at least one TEST task in tasks.md? [Coverage, spec.md -> tasks.md]
- [x] CHK011 Are both edge cases from spec.md (empty directory, malformed data.json) covered by TEST tasks? [Coverage, spec.md -> tasks.md]
- [x] CHK012 Are all acceptance scenarios (P1-P3) mapped to user stories with TDD cycles? [Coverage, spec.md -> tasks.md]
