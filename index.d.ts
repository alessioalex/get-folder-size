/**
 * The stats object returned by the underlying file system's lstat function.
 */
export interface Stats {
	isDirectory(): boolean;
	ino: bigint;
	size: bigint;
}

/**
 * The underlying filesystem implementation that will be used.
 * See the node fs documentation for more details:
 * https://nodejs.org/api/fs.html
 */
export interface Fs {
	lstat(
		path: string,
		options?: {
			bigint?: true;
		},
	): Promise<Stats>;
	readdir(path: string): Promise<string[]>;
}

/**
 * Configuration options.
 */
export interface Options {
	/**
	 * Should the folder size be returned as a BigInt instead of a Number.
	 */
	bigint?: boolean;
	/**
	 * If a file's path matches this regex object, its size is not counted.
	 */
	ignore?: RegExp;
	/**
	 * The filesystem that should be used. Uses node fs by default.
	 */
	fs?: Fs;
}

/**
 * The result object returned by the default getFolderSize function.
 */
export interface Result<T extends number | bigint> {
	/**
	 * The size of the folder in bytes.
	 */
	size: T;
	/**
	 * A list of errors encountered while traversing the folder.
	 */
	errors: Error[] | null;
}

/**
 * Returns an object containing the size of the folder and a list of errors encountered while traversing the folder.
 *
 * If any errors are returned, the returned folder size is likely smaller than the real folder size.
 *
 * @param itemPath - Path of the folder.
 * @param options  - Configuration options.
 *
 * @returns An object containing the size of the folder in bytes and a list of encountered errors.
 */
declare function getFolderSize(
	itemPath: string,
	options?: Options & {
		bigint?: false | undefined;
	},
): Promise<Result<number>>;
declare function getFolderSize(
	itemPath: string,
	options: Options & {
		bigint: true;
	},
): Promise<Result<bigint>>;

declare namespace getFolderSize {
	/**
	 * Returns the size of the folder. If any errors are encountered while traversing the folder, they are silently ignored.
	 *
	 * The returned folder size might be smaller than the real folder size. It is impossible to know for sure, since errors are ignored.
	 *
	 * @param itemPath - Path of the folder.
	 * @param options  - Configuration options.
	 *
	 * @returns The size of the folder in bytes.
	 */
	function loose(
		itemPath: string,
		options?: Options & {
			bigint?: false | undefined;
		},
	): Promise<number>;
	function loose(
		itemPath: string,
		options: Options & {
			bigint: true;
		},
	): Promise<bigint>;

	/**
	 * Returns the size of the folder. If any errors are encountered while traversing the folder, this method will throw an error.
	 *
	 * Because errors will otherwise make this method fail, the returned folder size will always be accurate.
	 *
	 * @param itemPath - Path of the folder.
	 * @param options  - Configuration options.
	 *
	 * @returns The size of the folder in bytes.
	 */
	function strict(
		itemPath: string,
		options?: Options & {
			bigint?: false | undefined;
		},
	): Promise<number>;
	function strict(
		itemPath: string,
		options: Options & {
			bigint: true;
		},
	): Promise<bigint>;
}

export default getFolderSize;
