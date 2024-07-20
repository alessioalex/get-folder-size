import { join as joinPaths } from "node:path";

export default async function getFolderSize(itemPath, options) {
	return await core(itemPath, options, { errors: true });
}

getFolderSize.loose = async (itemPath, options) =>
	await core(itemPath, options);

getFolderSize.strict = async (itemPath, options) =>
	await core(itemPath, options, { strict: true });

async function core(rootItemPath, options = {}, returnType = {}) {
	const fs = options.fs || (await import("node:fs/promises"));

	const fileSizes = new Map();
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
		fileSizes.set(stats.ino, stats.size);

		if (stats.isDirectory()) {
			const directoryItems = returnType.strict
				? await fs.readdir(itemPath)
				: await fs
						.readdir(itemPath)
						.catch((error) => errors.push(error));
			if (typeof directoryItems !== "object") return;
			await Promise.all(
				directoryItems.map((directoryItem) =>
					processItem(joinPaths(itemPath, directoryItem)),
				),
			);
		}
	}

	let folderSize = Array.from(fileSizes.values()).reduce(
		(total, fileSize) => total + fileSize,
		0n,
	);

	if (!options.bigint) {
		if (folderSize > BigInt(Number.MAX_SAFE_INTEGER)) {
			const error = new RangeError(
				"The folder size is too large to return as a Number. You can instruct this package to return a BigInt instead.",
			);
			if (returnType.strict) {
				throw error;
			} else {
				errors.push(error);
			}
		}
		folderSize = Number(folderSize);
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
