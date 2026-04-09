# Data Model - Plugin Compliance Scan

## Entities

### ComplianceResult
Output of the compliance scan.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| compliant | boolean | yes | True if no violations found (FR-007) |
| violations | Violation[] | yes | List of non-compliant plugins, empty if compliant (FR-007) |

### Violation
Individual plugin violation record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pluginId | string | yes | Plugin folder name / manifest ID (FR-007) |
| pluginName | string | yes | Human-readable display name from manifest (FR-007) |
| reason | ViolationReason | yes | Why the plugin is non-compliant (FR-007) |

### InstalledPlugin
Reference to an Obsidian plugin manifest (read-only, from Obsidian API).

| Field | Type | Description |
|-------|------|-------------|
| id | string | Plugin manifest ID |
| name | string | Plugin display name |

## Enums

### ViolationReason
- `not_on_whitelist` — plugin is not in the approved whitelist (FR-003)
- `on_blacklist` — plugin is on the blocked blacklist (FR-004)

## States & Transitions

```
idle → scanning (trigger: plugin onload)
scanning → complete_compliant (trigger: scan finishes with 0 violations)
scanning → complete_non_compliant (trigger: scan finishes with 1+ violations)
```

No timeout or error states — scan is synchronous and local.

## Constants

| Name | Value | Source |
|------|-------|--------|
| SELF_PLUGIN_ID | `this.manifest.id` | FR-001, dynamically resolved at runtime |

## Validation Rules

### Scan Preconditions
- Both lists empty → skip enforcement, return compliant (FR-006)
- Plugin's own ID excluded from scan (FR-001)

### List Application
- Whitelist enforced only when whitelist has entries (FR-003)
- Blacklist enforced only when blacklist has entries (FR-004)
- Both active simultaneously: blacklist takes precedence — plugin on both lists is non-compliant with reason `on_blacklist` (FR-005)
