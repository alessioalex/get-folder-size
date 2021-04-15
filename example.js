
import path from 'path';
import getFolderSize from './index.js';

if (!process.env.FOLDER) {
  throw new Error('FOLDER env var needed');
}

getFolderSize.strict(path.resolve(process.env.FOLDER)).then(size => {

  console.log(size + ' bytes');
  console.log((size / 1000 / 1000).toFixed(2) + ' MB');

});
