# Feature Specification: Plugin Compliance Scan

**Feature Branch**: `feature/plugin-compliance-scan`
**Input**: Generated from PRD - Solution Design (Core MVP Feature), Technical Requirements

## User Scenarios & Testing

### Primary User Story
When Obsidian boots, the plugin automatically scans all installed and enabled community plugins, compares them against the configured whitelist and/or blacklist, and produces a compliance result identifying any non-compliant plugins and the reason for each violation (not on whitelist, or on blacklist).

### Acceptance Scenarios
1. [P1] **Given** a whitelist with ["pluginA", "pluginB"] and enabled plugins ["pluginA", "pluginB", "pluginC"], **When** the compliance scan runs, **Then** "pluginC" is flagged as non-compliant with reason "not on whitelist"
2. [P1] **Given** a blacklist with ["pluginX"] and enabled plugins ["pluginA", "pluginX"], **When** the compliance scan runs, **Then** "pluginX" is flagged as non-compliant with reason "on blacklist"
3. [P1] **Given** both whitelist ["pluginA"] and blacklist ["pluginA"] contain the same plugin, **When** the compliance scan runs, **Then** "pluginA" is flagged as non-compliant with reason "on blacklist" (blacklist takes precedence)
4. [P1] **Given** an empty whitelist and an empty blacklist, **When** the compliance scan runs, **Then** all plugins are considered compliant (no lists configured means no enforcement)
5. [P2] **Given** a whitelist with entries and no blacklist entries, **When** the compliance scan runs, **Then** only whitelist enforcement is applied
6. [P2] **Given** no whitelist entries and a blacklist with entries, **When** the compliance scan runs, **Then** only blacklist enforcement is applied
7. [P3] **Given** no community plugins are installed, **When** the compliance scan runs, **Then** the result is compliant with an empty violations list

### Edge Cases
- When the Obsidian Whitelist plugin itself appears in the plugin list, system MUST exclude it from compliance checking [FR-001]
- When a plugin is installed but disabled, system MUST still check it against the lists (installed = risk) [FR-002]

## Requirements

### Functional Requirements
- **FR-001**: System MUST enumerate all installed community plugins via Obsidian API, excluding the whitelist plugin itself
- **FR-002**: System MUST check both installed and enabled community plugins against the configured lists
- **FR-003**: System MUST apply whitelist enforcement when whitelist has entries: any plugin not on the whitelist is non-compliant
- **FR-004**: System MUST apply blacklist enforcement when blacklist has entries: any plugin on the blacklist is non-compliant
- **FR-005**: System MUST apply both lists simultaneously when both have entries, with blacklist taking precedence (a plugin on both lists is non-compliant)
- **FR-006**: System MUST skip enforcement when both lists are empty (all plugins compliant)
- **FR-007**: System MUST produce a compliance result containing: compliant (boolean), list of violations (plugin ID, plugin name, violation reason)
- **FR-008**: System MUST run the compliance scan on plugin load (boot time)

### UX Requirements
- **UX-001**: Compliance scan MUST complete before any user notification is triggered

### Key Entities
- **ComplianceResult**: Object containing overall compliance status (boolean) and array of violations
- **Violation**: Object containing plugin ID, plugin display name, and reason string (e.g., "not on whitelist", "on blacklist")
- **InstalledPlugin**: Reference to an Obsidian plugin manifest with ID and name

### Technical Context
- **Tech Stack**: Obsidian Plugin API (`app.plugins.manifests`, `app.plugins.enabledPlugins`)
- **Constraints**: Must work on all Obsidian platforms (desktop and mobile); scan runs synchronously during plugin onload
