# get-folder-size

Get the size of a folder by iterating through its sub-files and -folders.

| :warning: | Version 3+ of this package is pure ESM and uses a new promise-based API. If you need to use CommonJS or the old callback syntax, keep your dependency pinned to version ^2 ([v2 API reference](https://github.com/alessioalex/get-folder-size/tree/v2.0.1)). |
|-----------|----------------------------------------------------------------------------------------|

## Basic usage

If you don't care about the details and just want a quick implementation, you can use:

```js
getFolderSize.loose('/path/to/folder');
```

Example:

```js
import getFolderSize from 'get-folder-size';

const myFolder = '/path/to/my/folder';

const size = await getFolderSize.loose(myFolder);
console.log(`The folder is ${size} bytes large`);
console.log(`That is the same as ${(size / 1000 / 1000).toFixed(2)} MB`);
```

## Methods

When reading the size of a folder, read errors can randomly occur for a number of reasons, especially if a different process is altering files in the same folder at the same time. There are three different ways to call this package, depending on how you want to handle those errors:

### `getFolderSize(path, [options]): object`
The default method will return an object with the size of the folder and a list of encountered errors:

```js
{
  size: 1435,
  errors: [
    Error{} ...
  ]
}
```

If no errors were encountered, `errors` will be `null`. If errors were encountered, `size` will likely be smaller than the real folder size.

This method is great if you want to implement custom logic based on the errors that were encountered.

### `getFolderSize.loose(path, [options]): number | bigint`
The `loose` method will return the folder size directly and ignore any errors it encounters, which means the returned folder size could be smaller than the real folder size.

This method is great if the precise size isn't too important, for example when used only to display the folder size to the user.

### `getFolderSize.strict(path, [options]): number | bigint`
The `strict` method will return the folder size directly, but throw an error if it encounters any read errors.

This method is great if you need a very accurate number. You will have to implement some sort of error handling to use it reliably.

## Options

Any of the three methods can also take an `options` object:

```js
getFolderSize(
  '/path/to/folder', 
  {
    bigint: true,
    ignore: /pattern/,
    fs: customFS,
  }
)
```

If the `bigint` option is set to true, the folder size is returned as a BigInt instead of the default Number.

The `ignore` option takes a regex pattern. Any file or folder with a path that matches the pattern will not be counted in the total folder size.

The `fs` option allows you to pass a different filesystem handler, such as [memfs](https://github.com/streamich/memfs), that will be used to read the folder size. The filesystem handler must incorporate `lstat` and `readdir` promise functions.

## CLI tool

You can run this module from your command line:

```bash
get-folder-size --folder="/my/folder" --ignore="node_modules"
```
The optional `ignore` statement takes a regex pattern.

## FAQ

### I don't care if I have a file or folder, I just want to get the size.

If a file is passed to `get-folder-size`, it will simply return the size of the file. This means you can use it as a catch-all to get the size of any element in the filesystem.

Example:

```js
import getItemSize from 'get-folder-size';

for(const path of [
  '/path/to/small/file.txt',
  '/path/to/small/folder/',
  '/path/to/large/file.js',
  '/path/to/large/folder/',
]){
  console.log(await getItemSize.strict(path));
}

// Console:
// 273
// 402
// 348614
// 674362319

```
### Does it return actual size or size on disk?

This module calculates the actual folder size, and not the size on disk. [Read about the difference here.](https://web.archive.org/web/20140712235443/https://stackoverflow.com/questions/15470787/please-help-me-understand-size-vs-size-on-disk)

### How do I import it from a CommonJS module?

CommonJS modules do not support the `import..from` method, but they do support this method:
```js
const getFolderSize = (await import("get-folder-size")).default;
```
Note that this import only works inside an async function.

If you want to use the `require` method, consider just staying on v2. You can make v2 return a promise by importing it this way:
```js
const util = require("util");
const getFolderSize = util.promisify(require("get-folder-size"));
```
If none of these methods work for you, [send us a detailed explanation of your issue](https://github.com/alessioalex/get-folder-size/issues), and we will take a look at it.

### How do I use it?

This is a Node module. If you are not sure what that means, please check out one of the many great tutorials online, like [nodejs.dev](https://nodejs.dev/learn/introduction-to-nodejs).

When you have Node set up, you can install `get-folder-size` from your command line with this command:

```bash
npm install get-folder-size
```

You can now import it into your JavaScript files, or you can use its command line interface (CLI).

## License

MIT
