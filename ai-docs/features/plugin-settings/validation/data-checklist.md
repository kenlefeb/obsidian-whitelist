# Data Checklist: Plugin Settings

**Source**: data-model.md

## Completeness

- [x] CHK032 Is PluginId validation enforced per Obsidian official docs -- non-empty, must not contain the word "obsidian"? [Completeness, Resolution: CHK032]
- [x] CHK033 Is the WhitelistSettings entity complete -- are there fields referenced in other artifacts not present in data-model.md? [Completeness, data-model.md: Entities]

## Clarity

- [x] CHK034 Is the NotificationDirectory validation unambiguous -- does "empty string after trim" include whitespace-only strings? [Clarity, data-model.md: Validation Rules]
- [x] CHK035 Is "trimmed before comparison and storage" for PluginId defined with a specific trim method (leading/trailing whitespace only)? [Clarity, data-model.md: Validation Rules]

## Consistency

- [x] CHK036 Do DEFAULT_NOTIFICATION_DIR value (`.obsidian-whitelist/notifications/`) and ux.md Quantified UX Elements match exactly? [Consistency, data-model.md -> ux.md]
- [x] CHK037 Do all WhitelistSettings field defaults in data-model.md match DEFAULT_SETTINGS in tasks.md INIT-005? [Consistency, data-model.md -> tasks.md]

## Edge Case

- [x] CHK038 Is cross-list duplicate prevention consistent with CHK009 resolution -- rejected at add time? [Edge Case, Resolution: CHK009]
- [x] CHK039 Is case-sensitivity policy documented -- plugin IDs stored as-is without normalization? [Edge Case, Resolution: CHK039]

## Cross-Artifact

- [x] CHK040 Do all constants in data-model.md (DEFAULT_NOTIFICATION_DIR, DEFAULT_SHOW_COMPLIANT, DEFAULT_WHITELIST, DEFAULT_BLACKLIST) appear in at least one TEST or IMPL task? [Coverage, data-model.md -> tasks.md]
- [x] CHK041 Do PluginId validation rules in data-model.md match the TEST tasks for addPluginId (TEST-004 through TEST-007)? [Consistency, data-model.md -> tasks.md]
