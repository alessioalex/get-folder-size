import { exec as execCallback } from "node:child_process";
import { join as joinPaths, dirname as pathDirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import tap from "tap";

const exec = promisify(execCallback);

/**
 * @file
 * This test checks that basic CLI functionality works.
 * Most of the args parsing is handled by a node module, so we don't
 * need to test a million edge cases, they should be handled correctly.
 */

/**
 * TODO: replace with `import.meta.dirname` when it becomes stable:
 * https://nodejs.org/api/esm.html#importmeta
 */
const dirname = pathDirname(fileURLToPath(import.meta.url));

/**
 * Skip the test on Windows. It has some weird args parsing that we don't want to deal with.
 * If the tests pass on all other platforms, we can expect it to work correctly on Windows as well.
 */
const skip = process.platform === "win32";

const cwd = joinPaths(dirname, "..");
const sizeOfFixtureFolder = "0.01 MB";

if (!skip) {
	for (const folderArg of ["--folder ", "--folder=", "-f ", ""]) {
		const args = `${folderArg}"test/fixture"`;

		tap.test(`get folder size with args: ${args}`, async () => {
			const result = await exec(`bin/get-folder-size.js ${args}`, {
				cwd,
			});

			tap.ok(
				result.stdout.startsWith(sizeOfFixtureFolder),
				"should return the size of the folder",
			);
		});

		for (const ignoreArg of ["--ignore ", "--ignore=", "-i "]) {
			for (const flipArgs of [false, true]) {
				const arg1 = `${folderArg}"test/fixture"`;
				const arg2 = `${ignoreArg}".*txt"`;
				const args = flipArgs ? `${arg2} ${arg1}` : `${arg1} ${arg2}`;

				tap.test(`get folder size with args: ${args}`, async () => {
					const result = await exec(
						`bin/get-folder-size.js ${args}`,
						{
							cwd,
						},
					);

					tap.ok(
						result.stdout.startsWith("0.00 MB"),
						"should return zero as size",
					);
				});
			}
		}
	}

	tap.test("get folder size with missing args", async () => {
		tap.rejects(async () => {
			await exec("bin/get-folder-size.js", { cwd });
		}, "should reject since no folder path is provided");
	});
}
