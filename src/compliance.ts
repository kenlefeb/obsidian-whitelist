// AICODE-NOTE: INIT-001 creates ComplianceResult, Violation, ViolationReason per data-model.md
// AICODE-NOTE: INIT-003 exports runComplianceScan() stub returning compliant result
// Pure function design -- no Obsidian API dependency, fully testable (see plan.md)

import type { WhitelistSettings } from "./settings.js";

/**
 * Why a plugin is non-compliant.
 * - "not_on_whitelist": plugin is not in the approved whitelist (FR-003)
 * - "on_blacklist": plugin is on the blocked blacklist (FR-004)
 */
export type ViolationReason = "not_on_whitelist" | "on_blacklist";

/**
 * Individual plugin violation record.
 */
export interface Violation {
	pluginId: string;
	pluginName: string;
	reason: ViolationReason;
}

/**
 * Output of the compliance scan.
 * compliant is true when no violations found (FR-007).
 */
export interface ComplianceResult {
	compliant: boolean;
	violations: Violation[];
}

/**
 * Scans installed plugin manifests against whitelist/blacklist settings.
 *
 * @param settings - Current whitelist/blacklist configuration
 * @param manifests - All installed plugin manifests keyed by plugin ID
 * @param selfId - This plugin's own ID (excluded from scanning per FR-001)
 * @returns ComplianceResult with violations list
 */
export function runComplianceScan(
	settings: WhitelistSettings,
	manifests: Record<string, { id: string; name: string }>,
	selfId: string,
): ComplianceResult {
	// AICODE-TODO: IMPL-001 through IMPL-004 will add whitelist/blacklist logic
	return { compliant: true, violations: [] };
}
