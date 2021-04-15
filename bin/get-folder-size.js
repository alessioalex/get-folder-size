#!/usr/bin/env node

import getFolderSize from '../index.js';
import gar from 'gar';
import path from 'path';

const argv = gar(process.argv.slice(2));

// --folder or -f or last argument passed
const folder = argv.folder || argv.f || argv._[argv._.length - 1];

if (!folder) {
  console.error('missing folder argument');
  console.error('\n  Usage:\n');
  console.error('get-folder-size --folder=/home/alex/www');
  process.exit(1);
}

const ignore = argv.ignore ? new RegExp(argv.ignore) : null;

const size = await getFolderSize.strict(path.resolve(folder), {ignore});
console.log((size / 1000 / 1000).toFixed(2) + ' MB');
