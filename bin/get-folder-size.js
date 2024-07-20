#!/usr/bin/env node

import getFolderSize from "../index.js";
import { parseArgs } from "node:util";
import { resolve } from "node:path";

const args = parseArgs({
	args: process.argv.slice(2),
	options: {
		folder: {
			short: "f",
			type: "string",
		},
		ignore: {
			short: "i",
			type: "string",
		},
	},
	allowPositionals: true,
});

// --folder or -f or last argument passed
const folder = args.values.folder || args.positionals.at(-1);

if (!folder) {
	console.error("missing folder argument");
	console.error("\n  Usage:\n");
	console.error(`get-folder-size --folder "/home/alex/www"`);
	process.exit(1);
}

const ignore = args.values.ignore ? new RegExp(args.values.ignore) : undefined;

const size = await getFolderSize.strict(resolve(folder), { ignore });
console.log((size / 1000 / 1000).toFixed(2) + " MB");
