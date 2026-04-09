# Feature Specification: Distribution Packaging

**Feature Branch**: `feature/distribution-packaging`
**Input**: Generated from PRD - Technical Requirements (Distribution & Packaging)

## User Scenarios & Testing

### Primary User Story
An IS administrator builds the plugin from source and receives a distributable zip file containing all files needed to deploy the plugin into any Obsidian vault. The zip includes a template `data.json` with default settings that the IS admin can customize (whitelist, blacklist, notification directory) before pushing to user vaults.

### Acceptance Scenarios
1. [P1] **Given** the source code is available, **When** the IS admin runs `npm run package`, **Then** a zip file is produced containing `main.js`, `manifest.json`, and `data.json`
2. [P1] **Given** the zip is produced, **When** the IS admin extracts it into `.obsidian/plugins/obsidian-whitelist/`, **Then** the plugin loads correctly on Obsidian boot
3. [P2] **Given** the zip contains a template `data.json`, **When** the IS admin edits the whitelist and blacklist entries before deployment, **Then** the plugin loads with those pre-configured settings
4. [P2] **Given** the project has a `styles.css` file, **When** `npm run package` runs, **Then** `styles.css` is included in the zip
5. [P3] **Given** the project has no `styles.css` file, **When** `npm run package` runs, **Then** the zip is produced without `styles.css` and the plugin still functions

### Edge Cases
- When the build fails (TypeScript errors), system MUST not produce a zip and MUST report the error [FR-003]
- When `data.json` template has been customized in the project, system MUST include the customized version [FR-004]

## Requirements

### Functional Requirements
- **FR-001**: System MUST provide an `npm run package` script that builds the project and produces a distributable zip file
- **FR-002**: Zip file MUST contain: `main.js`, `manifest.json`, and a template `data.json` with default settings
- **FR-003**: Build step MUST run TypeScript compilation and fail the package process if errors are found (verified by running `tsc -noEmit` before packaging)
- **FR-004**: Template `data.json` MUST contain the default settings structure with empty whitelist, empty blacklist, default notification directory, and show-compliant-indicator set to false
- **FR-005**: Zip file MUST include `styles.css` if it exists in the build output
- **FR-006**: Zip file MUST be named with the plugin ID (e.g., `obsidian-whitelist.zip`)

### UX Requirements
- **UX-001**: Package script output MUST clearly indicate success or failure with the output file path

### Key Entities
- **Distribution Package**: Zip file containing all files needed for vault deployment
- **Template Settings**: Default `data.json` with empty lists and sensible defaults

### Technical Context
- **Tech Stack**: esbuild for bundling, standard zip tooling via npm script
- **Constraints**: Must produce files compatible with Obsidian's plugin loading mechanism; no external runtime dependencies
