# Resolutions: Plugin Settings

## Summary

| Metric | Count |
|--------|-------|
| Total resolved | 4 |
| Gaps filled | 2 |
| Conflicts resolved | 0 |
| Ambiguities clarified | 2 |
| Assumptions confirmed | 0 |
| New tasks created | 4 |
| Existing tasks updated | 2 |
| Deferred to future | 0 |

## Decisions

### CHK009: Cross-List Duplicate Prevention

- **Source**: requirements-checklist.md
- **Type**: Gap
- **Original**: Is behavior defined when the same plugin ID is added to both whitelist and blacklist via settings?
- **Options**: a) Prevent at add time / b) Allow, blacklist precedence at scan / c) Defer
- **Decision**: (a) Prevent — validate that an ID being added to one list is not already in the other
- **Rationale**: Clearer UX; prevents confusing configuration state
- **Task Impact**: NEW: TEST-016, IMPL-012 [US2]

### CHK032: Plugin ID Format Enforcement

- **Source**: data-checklist.md
- **Type**: Gap
- **Original**: Is the PluginId format description enforced by a validation rule, or is it descriptive only?
- **Options**: a) Enforce per Obsidian official docs / b) Descriptive only / c) Defer
- **Decision**: (a) Enforce per Obsidian manifest rules — ID must not contain the word "obsidian"
- **Rationale**: Matches official Obsidian community plugin requirements; user provided reference to docs.obsidian.md/Reference/Manifest
- **Task Impact**: NEW: TEST-017, IMPL-013 [US2]

### CHK039: Plugin ID Case Sensitivity

- **Source**: data-checklist.md
- **Type**: Ambiguity
- **Original**: Is behavior defined for plugin IDs with uppercase characters — are they normalized to lowercase or stored as-is?
- **Options**: a) Store as-is / b) Normalize to lowercase / c) Defer
- **Decision**: (a) Store as-is — Obsidian plugin IDs are case-sensitive strings
- **Rationale**: No normalization prevents data loss; matches how Obsidian stores plugin folder names
- **Task Impact**: UPDATE: TEST-006 (add: "preserves original casing per CHK039")

### CHK002: Self-Addition Policy

- **Source**: requirements-checklist.md
- **Type**: Ambiguity
- **Original**: Is the self-exclusion rule documented — should the whitelist plugin's own ID be addable to lists?
- **Options**: a) Prevent self-addition / b) Allow self-addition / c) Defer
- **Decision**: (b) Allow — plugin's own ID can be added to lists
- **Rationale**: Future feature will support version-specific whitelisting, requiring the ability to whitelist specific versions of obsidian-whitelist itself. Self-exclusion at scan time (plugin-compliance-scan FR-001) handles the current need.
- **Task Impact**: UPDATE: IMPL-003 (add: "no self-exclusion — plugin's own ID allowed per CHK002")

---

## Tasks Cross-Reference

### New Tasks
| CHK | Tasks | Story | Description |
|-----|-------|-------|-------------|
| CHK009 | TEST-016, IMPL-012 | US2 | Cross-list duplicate prevention |
| CHK032 | TEST-017, IMPL-013 | US2 | Plugin ID format enforcement per Obsidian docs |

### Updated Tasks
| CHK | Task | Change |
|-----|------|--------|
| CHK039 | TEST-006 | Added: "preserves original casing per CHK039" |
| CHK002 | IMPL-003 | Added: "no self-exclusion — plugin's own ID allowed per CHK002" |

### Deferred
| CHK | Reason |
|-----|--------|
| (none) | |
