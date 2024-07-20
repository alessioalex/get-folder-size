import { exec as execCallback } from "node:child_process";
import { join as joinPaths, dirname as pathDirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import tap from "tap";

const exec = promisify(execCallback);

/**
 * @file
 * This test checks that basic CLI functionality works.
 */

/**
 * TODO: replace with `import.meta.dirname` when it becomes stable:
 * https://nodejs.org/api/esm.html#importmeta
 */
const dirname = pathDirname(fileURLToPath(import.meta.url));

/**
 * Skip the test on operating systems with non-standard path separators (Windows).
 */
const skip = sep === "/";

const cwd = joinPaths(dirname, "..");
const sizeOfFixtureFolder = "0.01 MB";

for (const folderArg of ["--folder=", "-f=", ""]) {
	const args = `${folderArg}test/fixture`;

	tap.test(`get folder size with args: ${args}`, async () => {
		const result = await exec(`bin/get-folder-size.js ${args}`, {
			cwd,
		});

		tap.ok(
			result.stdout.startsWith(sizeOfFixtureFolder),
			"should return the size of the folder",
			{ skip },
		);
	});

	for (const ignoreArg of ["--ignore=", "-i="]) {
		for (const flipArgs of [false, true]) {
			const arg1 = `${folderArg}test/fixture`;
			const arg2 = `${ignoreArg}.*txt`;
			const args = flipArgs ? `${arg2} ${arg1}` : `${arg1} ${arg2}`;

			tap.test(`get folder size with args: ${args}`, async () => {
				const result = await exec(`bin/get-folder-size.js ${args}`, {
					cwd,
				});

				tap.ok(
					result.stdout.startsWith("0.00 MB"),
					"should return zero as size",
					{ skip },
				);
			});
		}
	}
}

tap.test("get folder size with missing args", async () => {
	tap.rejects(
		async () => {
			await exec("bin/get-folder-size.js", { cwd });
		},
		"should reject since no folder path is provided",
		{ skip },
	);
});
