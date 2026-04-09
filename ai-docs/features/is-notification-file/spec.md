# Feature Specification: IS Notification File

**Feature Branch**: `feature/is-notification-file`
**Input**: Generated from PRD - Solution Design (Supporting Features), Technical Requirements

## User Scenarios & Testing

### Primary User Story
When a compliance violation is detected and the user submits the acknowledgment modal, a JSON notification file is written to the configured vault-relative directory. This file contains all details IS needs to assess the violation: timestamp, vault name, violations list, and the user's justification message. Each compliance event produces a separate file for easy collection and processing.

### Acceptance Scenarios
1. [P1] **Given** non-compliant plugins are detected and the user submits the modal, **When** the notification is triggered, **Then** a JSON file is written to the configured notification directory
2. [P1] **Given** a notification is being written, **When** the file is created, **Then** it contains timestamp, vault name, list of violations (plugin ID, name, reason), and justification message
3. [P2] **Given** the configured notification directory does not exist, **When** a notification file needs to be written, **Then** the directory is created automatically before writing
4. [P2] **Given** a notification is written, **When** examining the file name, **Then** it follows a pattern that prevents collisions (e.g., ISO timestamp-based)
5. [P3] **Given** the user submitted an empty justification, **When** the notification file is written, **Then** the justification field is present but contains an empty string

### Edge Cases
- When the file write fails (permissions, disk full), system MUST show a notice to the user and log the error rather than crash [FR-005]
- When multiple compliance events occur (e.g., re-opened modal), system MUST create separate notification files for each event [FR-003]

## Requirements

### Functional Requirements
- **FR-001**: System MUST write a JSON notification file to the configured vault-relative directory after the user submits the compliance modal
- **FR-002**: Notification file MUST contain: timestamp (ISO 8601), vault name, violations array (each with pluginId, pluginName, reason), and justification string
- **FR-003**: Each compliance event MUST produce a separate file with a unique, timestamp-based filename
- **FR-004**: System MUST create the notification directory if it does not exist before writing
- **FR-005**: System MUST handle file write failures gracefully by displaying a notice and not crashing (verified by catching write errors and showing Obsidian Notice)
- **FR-006**: System MUST use Obsidian's Vault API for all file operations to ensure mobile compatibility

### UX Requirements
- **UX-001**: File write failures MUST be communicated to the user via an Obsidian Notice

### Key Entities
- **ComplianceEvent**: JSON object with timestamp, vaultName, violations array, and justification string
- **Violation**: Object with pluginId, pluginName, and reason fields
- **Notification File**: Individual JSON file in the notification directory, named with ISO timestamp

### Technical Context
- **Constraints**: All file operations via Obsidian Vault API (not Node.js `fs`); directory must be vault-relative for mobile compatibility; JSON format for downstream tool consumption
