# Feature Specification: Plugin Settings

**Feature Branch**: `feature/plugin-settings`
**Input**: Generated from PRD - Solution Design (Supporting Features), UX Details (Settings UI)

## User Scenarios & Testing

### Primary User Story
An IS administrator configures the Obsidian Whitelist plugin by defining which community plugins are approved (whitelist), which are blocked (blacklist), where compliance notifications are saved, and whether a status bar indicator shows when the vault is compliant. Settings are stored using Obsidian's standard plugin data persistence.

### Acceptance Scenarios
1. [P1] **Given** the plugin is installed with no prior configuration, **When** the plugin loads for the first time, **Then** default settings are applied (empty whitelist, empty blacklist, default notification directory, status bar compliant indicator off)
2. [P1] **Given** the IS admin opens the plugin settings tab, **When** they add plugin IDs to the whitelist, **Then** the whitelist is persisted via `this.saveData()` and available on next boot
3. [P1] **Given** the IS admin opens the plugin settings tab, **When** they add plugin IDs to the blacklist, **Then** the blacklist is persisted via `this.saveData()` and available on next boot
4. [P2] **Given** the IS admin opens the plugin settings tab, **When** they change the notification directory path, **Then** the new path is saved and used for future compliance event files
5. [P2] **Given** the IS admin opens the plugin settings tab, **When** they toggle the "show compliant status bar" setting, **Then** the preference is saved and the status bar updates accordingly
6. [P3] **Given** the plugin is deployed via filesystem push with a pre-configured `data.json`, **When** the plugin loads, **Then** the settings from `data.json` are loaded without requiring manual configuration

### Edge Cases
- When the notification directory path is empty, system MUST fall back to a sensible default (e.g., `.obsidian-whitelist/notifications/`) [FR-004]
- When `data.json` contains malformed or missing fields, system MUST merge with defaults rather than crash [FR-001]

## Requirements

### Functional Requirements
- **FR-001**: System MUST define a TypeScript settings interface with fields for whitelist (string array), blacklist (string array), notification directory (string), and show-compliant-indicator (boolean)
- **FR-002**: System MUST load settings on plugin startup via `this.loadData()` and merge with defaults for any missing fields
- **FR-003**: System MUST persist settings via `this.saveData()` when any setting is changed
- **FR-004**: System MUST provide a default notification directory path if none is configured (verified by checking the resolved path is non-empty on every boot)
- **FR-005**: System MUST expose a `PluginSettingTab` with UI controls for all configurable fields
- **FR-006**: Users MUST be able to add and remove individual plugin IDs from whitelist and blacklist

### UX Requirements
- **UX-001**: Settings tab MUST follow standard Obsidian `PluginSettingTab` layout conventions
- **UX-002**: Whitelist and blacklist entries MUST be editable as lists of plugin IDs
- **UX-003**: Settings changes MUST take effect without requiring Obsidian restart

### Key Entities
- **WhitelistSettings**: Core configuration object containing whitelist, blacklist, notificationDirectory, and showCompliantIndicator fields
- **Plugin ID**: String identifier matching the community plugin's folder name in `.obsidian/plugins/`

### Technical Context
- **Constraints**: All file operations via Obsidian Vault API for mobile compatibility; settings stored in standard `data.json` within plugin directory
