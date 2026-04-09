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
// AICODE-NOTE: IMPL-001 implements [FR-001, FR-003, FR-007] - whitelist check logic
// AICODE-NOTE: IMPL-002 implements [FR-004] - blacklist check logic
// AICODE-NOTE: IMPL-003 implements [FR-005] - blacklist precedence, skip whitelist check for blacklisted plugins
// AICODE-NOTE: IMPL-004 implements [FR-006] - early return when both lists empty
export function runComplianceScan(
	settings: WhitelistSettings,
	manifests: Record<string, { id: string; name: string }>,
	selfId: string,
): ComplianceResult {
	// Early return when no enforcement configured (FR-006)
	if (settings.whitelist.length === 0 && settings.blacklist.length === 0) {
		return { compliant: true, violations: [] };
	}

	const violations: Violation[] = [];
	const pluginIds = Object.keys(manifests).filter((id) => id !== selfId);

	// Track blacklisted plugins to avoid double-flagging (FR-005)
	const blacklisted = new Set<string>();

	// Blacklist enforcement: flag plugins on blacklist (FR-004)
	// Runs first -- blacklist takes precedence (FR-005)
	if (settings.blacklist.length > 0) {
		for (const id of pluginIds) {
			if (settings.blacklist.includes(id)) {
				blacklisted.add(id);
				violations.push({
					pluginId: id,
					pluginName: manifests[id].name,
					reason: "on_blacklist",
				});
			}
		}
	}

	// Whitelist enforcement: flag plugins not on whitelist (FR-003)
	// Skip plugins already flagged by blacklist (FR-005)
	if (settings.whitelist.length > 0) {
		for (const id of pluginIds) {
			if (!blacklisted.has(id) && !settings.whitelist.includes(id)) {
				violations.push({
					pluginId: id,
					pluginName: manifests[id].name,
					reason: "not_on_whitelist",
				});
			}
		}
	}

	return {
		compliant: violations.length === 0,
		violations,
	};
}
