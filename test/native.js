import fs from "node:fs";
import tap from "tap";
import getSize from "../index.js";

/**
 * @file
 * This is just a sanity check to make sure the package actually works with the native filesystem.
 * The native filesystem is not suitable for strict testing because it is prone to random read errors and because the folder and file sizes can vary depending on the underlying OS.
 */

tap.test("get file sizes", async () => {
	const _8 = await getSize.strict("./test/fixture/8bytes.txt"),
		_500 = await getSize.strict("./test/fixture/500bytes.txt"),
		_6000 = await getSize.strict("./test/fixture/6000bytes.txt");

	//The slightly larger allowed size is for file systems that might convert LF to CRLF (Windows)
	tap.ok(_8 === 8 || _8 === 9, "should return correct size of the file");
	tap.ok(
		_500 === 500 || _500 === 510,
		"should return correct size of the file",
	);
	tap.ok(
		_6000 === 6000 || _6000 === 6020,
		"should return correct size of the file",
	);
});

tap.test("get folder sizes", async () => {
	const fixture = await getSize.strict("./test/fixture");

	//The returned size must be at least 1 byte larger than the size of the individual files, because the directory itself should use some space as well
	tap.ok(
		6508 < fixture && fixture < 1000000000,
		"should return approximately correct size of the folder",
	);

	//The node_modules folder offers a convenient opportunity to test the package on a complex folder structure.
	//If the folder is not present, this test is skipped. Theoretically speaking, anything that could go wrong in this test should also be covered by other tests.
	const node_modules = await getSize.loose("./node_modules");
	tap.ok(
		100000 < node_modules,
		"should return approximately correct size of the node_modules folder",
		{ skip: !fs.existsSync("./node_modules") },
	);
});
