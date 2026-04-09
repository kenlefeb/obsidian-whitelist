# Feature Specification: Status Bar Indicator

**Feature Branch**: `feature/status-bar-indicator`
**Input**: Generated from PRD - UX Details (Status Bar Indicator)

## User Scenarios & Testing

### Primary User Story
The plugin displays a persistent status bar indicator showing the current compliance state of the vault. When non-compliant, the indicator is always visible showing the violation count. When compliant, the indicator is optionally visible based on a settings toggle. Clicking the indicator when non-compliant re-opens the compliance modal.

### Acceptance Scenarios
1. [P1] **Given** the compliance scan found 3 non-compliant plugins, **When** the status bar renders, **Then** it displays a warning indicator with text like "Non-compliant (3)"
2. [P1] **Given** the vault is compliant and the show-compliant-indicator setting is enabled, **When** the status bar renders, **Then** it displays a checkmark or "Compliant" text
3. [P2] **Given** the vault is compliant and the show-compliant-indicator setting is disabled, **When** the status bar renders, **Then** no indicator is shown
4. [P2] **Given** the status bar shows non-compliant state, **When** the user clicks the indicator, **Then** the compliance modal re-opens with current violations
5. [P3] **Given** the status bar is visible, **When** the compliance state changes (e.g., after re-scan on next boot), **Then** the indicator updates to reflect the new state

### Edge Cases
- When running on mobile where status bar space is limited, system MUST use concise text (e.g., icon + count only) [FR-002]

## Requirements

### Functional Requirements
- **FR-001**: System MUST display a status bar item when the vault is non-compliant, showing the violation count
- **FR-002**: System MUST always show the non-compliant indicator regardless of settings (verified by checking status bar item visibility is unconditional when violations exist)
- **FR-003**: System MUST show a compliant indicator only when the show-compliant-indicator setting is enabled
- **FR-004**: System MUST hide the status bar item when compliant and the setting is disabled
- **FR-005**: System MUST open the compliance modal when the non-compliant status bar indicator is clicked

### UX Requirements
- **UX-001**: Non-compliant indicator MUST be visually distinct (warning style) from the compliant indicator
- **UX-002**: Indicator text MUST be concise to fit in Obsidian's status bar on all platforms

### Key Entities
- **StatusBarItem**: Obsidian status bar element displaying compliance state
- **ComplianceState**: Current compliance status (compliant/non-compliant) with violation count

### Technical Context
- **Constraints**: Uses Obsidian `addStatusBarItem()` API; must register click handler for non-compliant state; status bar is not available on all mobile views
