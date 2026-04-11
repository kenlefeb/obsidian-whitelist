#!/usr/bin/env node
// AICODE-NOTE: distribution-packaging INIT-003/008 scaffold -- thin runner for
// the packaging pipeline. Orchestration lives in scripts/lib/package-builder.mjs
// per plan.md "Structure A". This file only:
//   1. Installs a SIGINT handler that runs cleanupStaging before re-raising.
//   2. Invokes runPackage({ projectRoot }).
//   3. Prints the success message (UX-001) or failure message (ux.md) to
//      stdout / stderr.
//   4. Sets process.exitCode (EXIT_CODE_SUCCESS / EXIT_CODE_FAILURE).
//
// Phase 1 leaves the actual runPackage body as a stub -- this script WILL
// fail at runtime until IMPL-005/006/013 wire the real pipeline in Phase 2+.
// `npm run package` is not expected to produce a zip yet; only `npm run build`
// must keep working.

import process from "node:process";
import {
	runPackage,
	cleanupStaging,
	EXIT_CODE_SUCCESS,
	EXIT_CODE_FAILURE,
	SUCCESS_MESSAGE_FORMAT,
	FS_FAILURE_MESSAGE_FORMAT,
} from "./lib/package-builder.mjs";

// AICODE-NOTE: INIT-008 -- SIGINT handler placeholder. During Phase 1 there is
// no live staging dir because runPackage is a stub. IMPL-012/013 will track
// the active staging dir in a module-level variable and pass it here. For now
// we simply exit cleanly with EXIT_CODE_FAILURE so Ctrl-C does the right thing.
let activeStagingDir = null;

/**
 * Updates the module-level reference to the current staging directory.
 * IMPL-005/012 will call this so the SIGINT handler can clean up.
 * @param {string | null} dir
 */
export function setActiveStagingDir(dir) {
	activeStagingDir = dir;
}

process.on("SIGINT", () => {
	const dir = activeStagingDir;
	activeStagingDir = null;
	const finish = () => {
		// Re-raise SIGINT by exiting with the conventional 128 + signal code.
		// IMPL-013 may refine this; for now we just fail-fast.
		process.exit(EXIT_CODE_FAILURE);
	};
	if (dir) {
		cleanupStaging(dir).then(finish, finish);
	} else {
		finish();
	}
});

/**
 * Formats a template string with `${name}` placeholders against a value map.
 * Kept local to this runner so the helper module stays pure.
 * @param {string} template
 * @param {Record<string, string | number>} values
 * @returns {string}
 */
function format(template, values) {
	return template.replace(/\$\{(\w+)\}/g, (_match, key) =>
		Object.prototype.hasOwnProperty.call(values, key)
			? String(values[key])
			: `\${${key}}`,
	);
}

async function main() {
	const projectRoot = process.cwd();
	try {
		const result = await runPackage({ projectRoot });
		const message = format(SUCCESS_MESSAGE_FORMAT, {
			filename: result.filename,
			sizeBytes: result.sizeBytes,
			absolutePath: result.absolutePath,
		});
		process.stdout.write(`${message}\n`);
		process.exitCode = EXIT_CODE_SUCCESS;
	} catch (error) {
		// AICODE-TODO: IMPL-013 -- distinguish TS_FAILURE_MESSAGE from
		// FS_FAILURE_MESSAGE_FORMAT based on error shape. Phase 1 emits a
		// generic filesystem-style message.
		const errorCode =
			error && typeof error === "object" && "code" in error
				? String(/** @type {{ code: unknown }} */ (error).code)
				: "UNKNOWN";
		const errorPath =
			error && typeof error === "object" && "path" in error
				? String(/** @type {{ path: unknown }} */ (error).path)
				: projectRoot;
		const message = format(FS_FAILURE_MESSAGE_FORMAT, {
			path: errorPath,
			errorCode,
		});
		process.stderr.write(`${message}\n`);
		if (error instanceof Error && error.stack) {
			process.stderr.write(`${error.stack}\n`);
		}
		process.exitCode = EXIT_CODE_FAILURE;
	}
}

void main();
