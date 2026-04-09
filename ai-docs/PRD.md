# Obsidian Whitelist - Product Requirements Document

## Core Proposition

- **Product Name:** Obsidian Whitelist
- **Target User:** Enterprise Information Security (IS) teams managing Obsidian deployments
  - Responsible for controlling software and plugin usage across the organization
  - Need visibility into what community plugins employees are using
- **Problem:** Obsidian's open community plugin ecosystem provides no mechanism for enterprise control or monitoring
  - Any user can install any community plugin without oversight
  - No way to enforce approved plugin lists across the organization
  - Creates security, compliance, and data exfiltration risks
  - Obsidian cannot technically prevent plugin installation at the platform level
- **Core Solution Proposition:** An Obsidian plugin that monitors installed community plugins against configured whitelists/blacklists, alerts IS of non-compliant installations, and notifies users when they are out of compliance
  - Follows the enterprise "detect and alert" security pattern
  - Whitelist mode: only approved plugins are compliant
  - Blacklist mode: specific plugins are flagged as non-compliant
  - User notification creates social compliance pressure even without technical enforcement

## Solution Design

- **Core User Flow:**
  1. IS admin installs plugin and configuration into user's vault (filesystem push or Obsidian UI)
  2. On Obsidian boot, plugin scans installed/enabled community plugins
  3. Plugin compares discovered plugins against whitelist and/or blacklist in settings
  4. Non-compliant plugins found: user sees notification listing violations
  5. User can enter a justification message explaining the non-compliant plugin
  6. Compliance event (with optional justification) saved to configurable directory

- **Core MVP Feature — Plugin Compliance Monitor:**
  - Plugin scan: enumerate all installed/enabled community plugins via Obsidian API
  - Whitelist check: any enabled plugin not on the whitelist is non-compliant
  - Blacklist check: any enabled plugin on the blacklist is non-compliant
  - Both lists can be active simultaneously (must be on whitelist AND not on blacklist)
  - Scanning occurs at boot time

- **Supporting Features (MVP):**
  - User notification: modal showing non-compliant plugins with justification text input
  - IS notification file: write compliance event (timestamp, vault, user, violations, justification) to configurable directory
  - Settings UI: configure whitelist entries, blacklist entries, notification output directory

- **Non-Goals (MVP):**
  - Remote configuration fetch (post-MVP: plugin phones home for updated lists on boot)
  - Email or webhook notifications (post-MVP: file-based alerting for now)
  - Mid-session plugin change detection (boot-time only)
  - Automatic plugin disabling or removal

## Technical Requirements

- **Tech Stack:**
  - Language: TypeScript
  - Build: esbuild (existing project configuration)
  - Platform: Obsidian Plugin API
  - External dependencies: none for MVP

- **Platform Support:**
  - All platforms supported by Obsidian: desktop (Windows, macOS, Linux) and mobile (iOS, Android)
  - All file operations must use Obsidian's Vault API (not Node.js `fs`) to ensure mobile compatibility

- **Technical Constraints:**
  - Plugin enumeration via Obsidian API (`app.plugins.manifests`, `app.plugins.enabledPlugins`)
  - Settings stored in standard Obsidian plugin `data.json`
  - Notification directory must be vault-relative (mobile can only write within the vault)
  - Notification file format: JSON
  - No performance targets for MVP — functionality first

- **Distribution & Packaging:**
  - Build produces a distributable zip containing: `main.js`, `manifest.json`, `styles.css` (if any), and a template `data.json` with default settings
  - IS admin edits `data.json` with their whitelist/blacklist before deploying to user vaults
  - Deployable by extracting zip into `.obsidian/plugins/obsidian-whitelist/` — no GitHub clone or community gallery required
  - Compatible with internal file shares, MDM tools, or any enterprise deployment mechanism
  - `npm run package` script to build and produce the distributable zip

## UX Details

- **Compliance Notification (Blocking Modal):**
  - Displayed on boot when non-compliant plugins are detected
  - Lists each non-compliant plugin by name
  - Text area for user to enter justification message
  - Submit button to acknowledge — no close button, escape key disabled
  - User must submit (even with empty message) before Obsidian is usable
  - On submit: justification saved with compliance event to notification file

- **Status Bar Indicator:**
  - Non-compliant state: always visible — shows warning with violation count (e.g., "Non-compliant (3)")
  - Compliant state: optionally visible — toggle in settings — shows checkmark or "Compliant"
  - Clicking status bar when non-compliant re-opens the compliance modal

- **Settings UI:**
  - Standard Obsidian `PluginSettingTab` pattern
  - Whitelist entries: list of approved plugin IDs
  - Blacklist entries: list of blocked plugin IDs
  - Notification directory: vault-relative path for compliance event files
  - Toggle: show status bar indicator when compliant
  - Data persistence: TypeScript settings interface with `this.loadData()` / `this.saveData()`

- **Interface Tone:**
  - Professional, non-punitive language
  - Focus on compliance awareness, not blame
  - Clear identification of which plugins are non-compliant and why (whitelist vs blacklist violation)
