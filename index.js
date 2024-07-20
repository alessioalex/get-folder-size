import { join } from "node:path";

export default async function getFolderSize(itemPath, options) {
	return await core(itemPath, options, { errors: true });
}

getFolderSize.loose = async (itemPath, options) =>
	await core(itemPath, options);

getFolderSize.strict = async (itemPath, options) =>
	await core(itemPath, options, { strict: true });

async function core(rootItemPath, options = {}, returnType = {}) {
	const fs = options.fs || (await import("node:fs/promises"));

	let folderSize = 0n;
	const foundInos = new Set();
	const errors = [];

	await processItem(rootItemPath);

	async function processItem(itemPath) {
		if (options.ignore?.test(itemPath)) return;

		const stats = returnType.strict
			? await fs.lstat(itemPath, { bigint: true })
			: await fs
					.lstat(itemPath, { bigint: true })
					.catch((error) => errors.push(error));
		if (typeof stats !== "object") return;
		if (!foundInos.has(stats.ino)) {
			foundInos.add(stats.ino);
			folderSize += stats.size;
		}

		if (stats.isDirectory()) {
			const directoryItems = returnType.strict
				? await fs.readdir(itemPath)
				: await fs
						.readdir(itemPath)
						.catch((error) => errors.push(error));
			if (typeof directoryItems !== "object") return;
			await Promise.all(
				directoryItems.map((directoryItem) =>
					processItem(join(itemPath, directoryItem)),
				),
			);
		}
	}

	if (!options.bigint) {
		if (folderSize > BigInt(Number.MAX_SAFE_INTEGER)) {
			const error = new RangeError(
				"The folder size is too large to return as a Number. You can instruct this package to return a BigInt instead.",
			);
			if (returnType.strict) {
				throw error;
			}
			errors.push(error);
			folderSize = Number.MAX_SAFE_INTEGER;
		} else {
			folderSize = Number(folderSize);
		}
	}

	if (returnType.errors) {
		return {
			size: folderSize,
			errors: errors.length > 0 ? errors : null,
		};
	} else {
		return folderSize;
	}
}
