
import { join as joinPaths } from 'path';

/**
 * Returns an object containing the size of the folder and a list of errors encountered while traversing the folder.
 * 
 * If any errors are returned, the returned folder size is likely smaller than the real folder size.
 * 
 * @param {string} itemPath         - Path of the folder.
 * @param {object} [options]        - Options.
 * @param {object} [options.ignore] - If a file's path matches this regex object, its size is not counted.
 * @param {object} [options.fs]     - The filesystem that should be used. Uses node fs by default.
 * 
 * @returns {Promise<{size: number, errors: Array<Error> | null}>} - An object containing the size of the folder in bytes and a list of encountered errors.
 */
export default async function getFolderSize (itemPath, options) { return await core(itemPath, options, {errors: true}) }

/**
 * Returns the size of the folder. If any errors are encountered while traversing the folder, they are silently ignored.
 * 
 * The returned folder size might be smaller than the real folder size. It is impossible to know for sure, since errors are ignored.
 * 
 * @param {string} itemPath         - Path of the folder.
 * @param {object} [options]        - Options.
 * @param {object} [options.ignore] - If a file's path matches this regex object, its size is not counted.
 * @param {object} [options.fs]     - The filesystem that should be used. Uses node fs by default.
 * 
 * @returns {Promise<number>} - The size of the folder in bytes.
 */
getFolderSize.loose = async (itemPath, options) => await core(itemPath, options);

/**
 * Returns the size of the folder. If any errors are encountered while traversing the folder, this method will throw an error.
 * 
 * Because errors will otherwise make this method fail, the returned folder size will always be accurate.
 * 
 * @param {string} itemPath         - Path of the folder.
 * @param {object} [options]        - Options.
 * @param {object} [options.ignore] - If a file's path matches this regex object, its size is not counted.
 * @param {object} [options.fs]     - The filesystem that should be used. Uses node fs by default.
 * 
 * @returns {Promise<number>} - The size of the folder in bytes.
 */
getFolderSize.strict = async (itemPath, options) => await core(itemPath, options, {strict: true});



async function core (rootItemPath, options = {}, returnType = {}) {
  const fs = options.fs || await import('fs/promises');
  
  const fileSizes = new Map();
  const errors = [];
  
  await processItem(rootItemPath);

  async function processItem(itemPath) {
    if(options.ignore?.test(itemPath)) return;

    const stats = returnType.strict ? await fs.lstat(itemPath) : await fs.lstat(itemPath).catch(error => errors.push(error));
    if(typeof stats !== 'object') return;
    fileSizes.set(stats.ino, stats.size);

    if(stats.isDirectory()) {
      const directoryItems = returnType.strict ? await fs.readdir(itemPath) : await fs.readdir(itemPath).catch(error => errors.push(error));
      if(typeof directoryItems !== 'object') return;
      await Promise.all(
        directoryItems.map(directoryItem => 
          processItem(joinPaths(itemPath, directoryItem))
        )
      );
    }
  }

  const folderSize = Array.from(fileSizes.values()).reduce((total, fileSize) => total + fileSize, 0);

  if (returnType.errors) {
    return {
      size: folderSize,
      errors: errors.length > 0 ? errors : null,
    }
  } else {
    return folderSize;
  }

}