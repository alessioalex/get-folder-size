import tap from "tap";
import { Volume } from "memfs";
import getFolderSize from "../index.js";

/**
 * @file
 * This test validates the internal logic of the package. It uses memfs to simulate the filesystem.
 */

//NOTE: Folder sizes are always 0 in memfs. This is not true in native filesystems.

/**
 * Calls all the different function methods, makes sure their results are identical and non-failing, then outputs the result.
 * By using this method, all the different calling methods are automatically tested.
 */
async function callAll(itemPath, options) {
	const size = await getFolderSize.strict(itemPath, options);

	tap.equal(
		await getFolderSize.loose(itemPath, options),
		size,
		"loose method should return same size as strict",
	);

	tap.strictSame(
		await getFolderSize(itemPath, options),
		{
			errors: null,
			size: size,
		},
		"default method should return no errors and same size as strict",
	);

	return size;
}

const B = "#"; //one byte

const basicFS = Volume.fromJSON(
	{
		"./8bytes.txt": B.repeat(8),
		"./500bytes.txt": B.repeat(500),
		"./6000bytes.txt": B.repeat(6000),
	},
	"/fixture",
).promisesApi;

tap.test("basic folder", async () => {
	tap.test("get file sizes", async () => {
		tap.equal(
			await callAll("/fixture/8bytes.txt", { fs: basicFS }),
			8,
			"should return the correct file size",
		);
		tap.equal(
			await callAll("/fixture/500bytes.txt", { fs: basicFS }),
			500,
			"should return the correct file size",
		);
		tap.equal(
			await callAll("/fixture/6000bytes.txt", { fs: basicFS }),
			6000,
			"should return the correct file size",
		);
	});

	tap.test("get folder size", async () => {
		tap.equal(
			await callAll("/fixture", { fs: basicFS }),
			6508,
			"should return the correct folder size",
		);
	});
});

tap.test("basic folder - with bigint", async () => {
	tap.test("get file sizes", async () => {
		tap.equal(
			await callAll("/fixture/8bytes.txt", { bigint: true, fs: basicFS }),
			8n,
			"should return the correct file size",
		);
		tap.equal(
			await callAll("/fixture/500bytes.txt", {
				bigint: true,
				fs: basicFS,
			}),
			500n,
			"should return the correct file size",
		);
		tap.equal(
			await callAll("/fixture/6000bytes.txt", {
				bigint: true,
				fs: basicFS,
			}),
			6000n,
			"should return the correct file size",
		);
	});

	tap.test("get folder size", async () => {
		tap.equal(
			await callAll("/fixture", { bigint: true, fs: basicFS }),
			6508n,
			"should return the correct folder size",
		);
	});
});

tap.test("nested folder", async () => {
	const nestedFS = Volume.fromJSON(
		{
			"./8bytes.txt": B.repeat(8),
			"./much/empty/path/500bytes.txt": B.repeat(500),
			"./much/empty/path/nested/6000bytes.txt": B.repeat(6000),
		},
		"/fixture",
	).promisesApi;

	tap.test("get folder size", async () => {
		tap.equal(
			await callAll("/fixture", { fs: nestedFS }),
			6508,
			"should return the correct folder size",
		);
	});
});

/**
 * Links do not fill anything, so they should not count towards the folder size.
 * See this for issue more information: https://github.com/alessioalex/get-folder-size/issues/9
 */
tap.test("is not confused by links", async () => {
	const linkedFS = Volume.fromJSON(
		{
			"./original.txt": B.repeat(50),
		},
		"/fixture",
	).promisesApi;
	await linkedFS.link("/fixture/original.txt", "/fixture/link.txt");
	await linkedFS.symlink("/fixture/original.txt", "/fixture/symlink.txt");

	tap.equal(
		await callAll("/fixture", { fs: linkedFS }),
		50,
		"should only count the size of the original file",
	);
});

tap.test("ignore option", async () => {
	tap.equal(
		await callAll("/fixture", { ignore: /\d{4}bytes/, fs: basicFS }),
		508,
		"should not count the size of the 6000 byte file",
	);
});

tap.test("handling very large filesystems", async () => {
	const largeFSCore = Volume.fromJSON(
		{
			"./very.txt": B.repeat(200),
			"./large.txt": B.repeat(200),
			"./files.txt": B.repeat(200),
		},
		"/fixture",
	).promisesApi;

	const largeFS = {
		lstat: async (itemPath, options) => {
			const result = await largeFSCore.lstat(itemPath, options);
			result.size = BigInt(Number.MAX_SAFE_INTEGER);
			return result;
		},
		readdir: largeFSCore.readdir,
	};

	tap.test("returning Number", async () => {
		tap.type(
			await getFolderSize.loose("/fixture", { fs: largeFS }),
			"number",
			"should return Number",
		);

		tap.rejects(
			async () => {
				await getFolderSize.strict("/fixture", { fs: largeFS });
			},
			/The folder size is too large to return as a Number. You can instruct this package to return a BigInt instead./,
			"should throw appropriate error",
		);

		const { size, errors } = await getFolderSize("/fixture", {
			fs: largeFS,
		});
		tap.type(size, "number", "should return Number");
		tap.type(errors, Array, "should return Array of errors");
		tap.equal(errors.length, 1, "should return one error");
		tap.equal(
			errors[0].message,
			"The folder size is too large to return as a Number. You can instruct this package to return a BigInt instead.",
			"should return appropriate error",
		);
	});

	tap.test("returning BigInt", async () => {
		tap.equal(
			await getFolderSize.loose("/fixture", {
				bigint: true,
				fs: largeFS,
			}),
			BigInt(Number.MAX_SAFE_INTEGER) * 4n,
			"should return size of 4 times max safe Number",
		);

		tap.equal(
			await getFolderSize.strict("/fixture", {
				bigint: true,
				fs: largeFS,
			}),
			BigInt(Number.MAX_SAFE_INTEGER) * 4n,
			"should return size of 4 times max safe Number",
		);

		const { size, errors } = await getFolderSize("/fixture", {
			bigint: true,
			fs: largeFS,
		});
		tap.equal(
			size,
			BigInt(Number.MAX_SAFE_INTEGER) * 4n,
			"should return size of 4 times max safe Number",
		);
		tap.equal(errors, null, "should return no errors");
	});
});

tap.test("error handling", async () => {
	const badFSCore = Volume.fromJSON(
		{
			"./pass/pass.md": B.repeat(200),
			"./pass/pass.txt": B.repeat(200),
			"./pass/failFile.js": B.repeat(200),
			"./pass/failFile.md": B.repeat(200),
			"./pass/pass.js": B.repeat(200),
			"./pass/failDir/pass.txt": B.repeat(200),
			"./failDir/pass.txt": B.repeat(200),
			"./failDir/pass.js": B.repeat(200),
		},
		"/fixture",
	).promisesApi;

	const badFS = {
		lstat: async (itemPath, options) => {
			if (itemPath.includes("failFile")) {
				throw Error("Nah - File");
			} else {
				return await badFSCore.lstat(itemPath, options);
			}
		},
		readdir: async (itemPath, options) => {
			if (itemPath.includes("failDir")) {
				throw Error("Nah - Directory");
			} else {
				return await badFSCore.readdir(itemPath, options);
			}
		},
	};

	tap.test("missing folder", async () => {
		tap.equal(
			await getFolderSize.loose("/doesnotexist", { fs: basicFS }),
			0,
			"should return size of 0",
		);

		tap.rejects(
			async () => {
				await getFolderSize.strict("/doesnotexist", { fs: basicFS });
			},
			/ENOENT: no such file or directory, lstat '\/doesnotexist'/,
			"should throw appropriate error",
		);

		const { size, errors } = await getFolderSize("/doesnotexist", {
			fs: basicFS,
		});
		tap.equal(size, 0, "should return size of 0");
		tap.type(errors, Array, "should return Array of errors");
		tap.equal(errors.length, 1, "should return one error");
		tap.equal(
			errors[0].message,
			`ENOENT: no such file or directory, lstat '/doesnotexist'`,
			"should return appropriate error",
		);
	});

	tap.test("read errors on files and folders", async () => {
		tap.equal(
			await getFolderSize.loose("/fixture", { fs: badFS }),
			600,
			`should return size of files that didn't fail`,
		);

		tap.rejects(
			async () => {
				await getFolderSize.strict("/fixture", { fs: badFS });
			},
			/^Nah - /,
			"should return appropriate error",
		);

		const { size, errors } = await getFolderSize("/fixture", { fs: badFS });
		tap.equal(size, 600, `should return size of files that didn't fail`);
		tap.type(errors, Array, "should return Array of errors");
		tap.equal(errors.length, 4, "should return four errors");

		let dirErrors = 0,
			fileErrors = 0;
		for (const error of errors) {
			switch (error.message) {
				case "Nah - File":
					fileErrors++;
					break;
				case "Nah - Directory":
					dirErrors++;
					break;
			}
		}
		tap.equal(dirErrors, 2, "should return two directory read errors");
		tap.equal(fileErrors, 2, "should return two file read errors");
	});
});
