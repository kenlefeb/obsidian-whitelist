# Data Model - Plugin Settings

## Entities

### WhitelistSettings
Core configuration object persisted in plugin `data.json`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| whitelist | string[] | yes | [] | Approved plugin IDs (FR-001) |
| blacklist | string[] | yes | [] | Blocked plugin IDs (FR-001) |
| notificationDirectory | string | yes | DEFAULT_NOTIFICATION_DIR | Vault-relative path for compliance event files (FR-001) |
| showCompliantIndicator | boolean | yes | false | Whether to show status bar when compliant (FR-001) |

### PluginId
Type alias: `string` — matches the community plugin's folder name in `.obsidian/plugins/`.
- Format: lowercase alphanumeric with hyphens (e.g., `obsidian-git`, `dataview`)
- Must be non-empty after trim

## Enums
None — EnforcementMode removed per research.md decision. Enforcement driven by list presence.

## Constants

| Name | Value | Source |
|------|-------|--------|
| DEFAULT_NOTIFICATION_DIR | `.obsidian-whitelist/notifications/` | ux.md Quantified UX Elements |
| DEFAULT_SHOW_COMPLIANT | false | FR-001 default |
| DEFAULT_WHITELIST | [] (empty array) | FR-001 default |
| DEFAULT_BLACKLIST | [] (empty array) | FR-001 default |

## Validation Rules

### PluginId Validation
- Must be non-empty string after trimming whitespace (FR-006)
- Must not already exist in the target list (duplicate check) (FR-006)
- Trimmed before comparison and storage

### NotificationDirectory Validation
- If empty string after trim → replaced with DEFAULT_NOTIFICATION_DIR on load (FR-004)
- Value stored as-is (vault-relative path)
