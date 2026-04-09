# Feature Specification: Compliance Notification Modal

**Feature Branch**: `feature/compliance-notification-modal`
**Input**: Generated from PRD - UX Details (Compliance Notification), Solution Design (Core User Flow steps 4-5)

## User Scenarios & Testing

### Primary User Story
When non-compliant plugins are detected at boot, a blocking modal is displayed to the user listing each violation. The user must acknowledge the notification by submitting a justification message (which may be empty) before they can use Obsidian. The justification is captured for inclusion in the IS compliance notification.

### Acceptance Scenarios
1. [P1] **Given** the compliance scan found non-compliant plugins, **When** the plugin finishes scanning, **Then** a blocking modal is displayed listing each non-compliant plugin by name and violation reason
2. [P1] **Given** the compliance modal is displayed, **When** the user enters a justification message and clicks submit, **Then** the modal closes and the justification is returned for notification processing
3. [P1] **Given** the compliance modal is displayed, **When** the user clicks submit without entering a message, **Then** the modal closes with an empty justification (empty submission is allowed)
4. [P2] **Given** the compliance modal is displayed, **When** the user presses Escape or clicks outside the modal, **Then** the modal remains open (cannot be dismissed without submitting)
5. [P2] **Given** the compliance scan found no violations, **When** the plugin finishes scanning, **Then** no modal is displayed
6. [P3] **Given** the user clicks the non-compliant status bar indicator, **When** the status bar click handler fires, **Then** the compliance modal re-opens with current violations

### Edge Cases
- When there are many non-compliant plugins (10+), system MUST display a scrollable list within the modal [FR-003]
- When the modal is re-opened from the status bar, system MUST show current violations (not stale data from boot) [FR-005]

## Requirements

### Functional Requirements
- **FR-001**: System MUST display a blocking modal when compliance scan returns violations
- **FR-002**: System MUST list each non-compliant plugin by display name and violation reason in the modal
- **FR-003**: System MUST provide a scrollable list when violations exceed the visible area
- **FR-004**: System MUST include a text area for the user to enter a justification message
- **FR-005**: System MUST provide a submit button that closes the modal and returns the justification text
- **FR-006**: System MUST prevent modal dismissal via Escape key or clicking outside the modal (verified by overriding the modal close behavior)
- **FR-007**: System MUST accept empty justification submissions (user can submit without typing)
- **FR-008**: System MUST NOT display the modal when the compliance scan returns no violations

### UX Requirements
- **UX-001**: Modal language MUST be professional and non-punitive, focused on compliance awareness
- **UX-002**: Each violation MUST clearly identify the plugin name and whether it is a whitelist or blacklist violation
- **UX-003**: Submit button MUST be clearly labeled (e.g., "Acknowledge" or "Submit")

### Key Entities
- **ComplianceModal**: Obsidian Modal subclass displaying violations and collecting justification
- **Violation**: Plugin ID, display name, and reason (received from compliance scan)
- **Justification**: User-entered text string (may be empty)

### Technical Context
- **Constraints**: Uses Obsidian Modal API; must work on desktop and mobile; blocking behavior requires overriding default close mechanisms
