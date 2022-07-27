
import tap from 'tap';
import { Volume } from 'memfs';
import getSize from '../index.js';

/**
 * @file
 * This test makes sure that jobs which require many recursions won't exceed any V8 limits.
 * This is mainly to make sure that the following bug isn't reintroduced: https://github.com/alessioalex/get-folder-size/issues/12
 */


//NOTE: Folder sizes are always 0 in memfs. This is not true in native filesystems.

const files = {};
for(let index = 100000; index--;){
  files[`./${index}`] = '#';
}

const largeFS = Volume.fromJSON(files, '/fixture').promisesApi;


tap.test('folder with many files', async () => {
  
  tap.equal(await getSize.strict('/fixture', {fs: largeFS}), 100000, 'should return correct size of the folder without throwing an error');
  tap.end();
    
});
