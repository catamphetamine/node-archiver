// Copy-pasted from `DefinitelyTyped` on 23.02.2026:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/archiver/index.d.ts

import * as fs from "fs";
import * as stream from "stream";
import * as ReaddirGlob from "readdir-glob";
import { ZlibOptions } from "zlib";

// This library adds `cwd` to the options
type GlobOptions = ReaddirGlob.Options & { cwd?: string };

interface EntryData {
	/** Sets the entry name including internal path */
	name: string;
	/** Sets the entry date */
	date?: Date | string | undefined;
	/** Sets the entry permissions */
	mode?: number | undefined;
	/**
	 * Sets a path prefix for the entry name.
	 * Useful when working with methods like `directory` or `glob`
	 */
	prefix?: string | undefined;
	/**
	 * Sets the fs stat data for this entry allowing
	 * for reduction of fs stat calls when stat data is already known
	 */
	stats?: fs.Stats | undefined;
}

interface ZipEntryData extends EntryData {
	/** Sets the compression method to STORE */
	store?: boolean | undefined;
}

type TarEntryData = EntryData;

interface ProgressData {
	entries: {
		total: number;
		processed: number;
	};
	fs: {
		totalBytes: number;
		processedBytes: number;
	};
}

/** A function that lets you either opt out of including an entry (by returning false), or modify the contents of an entry as it is added (by returning an EntryData) */
type EntryDataFunction = (entry: EntryData) => false | EntryData;

class ArchiverError extends Error {
	code: string; // Since archiver format support is modular, we cannot enumerate all possible error codes, as the modules can throw arbitrary ones.
	data: any;
	path?: any;

	constructor(code: string, data: any);
}

type ArchiverOptions = CoreOptions & TransformOptions;

interface CoreOptions {
	statConcurrency?: number | undefined;
}

interface TransformOptions {
	allowHalfOpen?: boolean | undefined;
	readableObjectMode?: boolean | undefined;
	writeableObjectMode?: boolean | undefined;
	decodeStrings?: boolean | undefined;
	encoding?: string | undefined;
	highWaterMark?: number | undefined;
	objectmode?: boolean | undefined;
}

interface ZipOptions {
	comment?: string | undefined;
	forceLocalTime?: boolean | undefined;
	forceZip64?: boolean | undefined;
	/** @default false */
	namePrependSlash?: boolean | undefined;
	store?: boolean | undefined;
	zlib?: ZlibOptions | undefined;
}

interface TarOptions {
	gzip?: boolean | undefined;
	gzipOptions?: ZlibOptions | undefined;
}

export class Archiver extends stream.Transform {
	_format: string;
	_module: Module;
	_supportsDirectory: boolean;
	_supportsSymlink: boolean;
	_modulePipe: () => void;

	constructor(options?: ArchiverOptions);

	abort(): this;
	append(source: stream.Readable | Buffer | string, data?: EntryData | ZipEntryData | TarEntryData): this;

	/** if false is passed for destpath, the path of a chunk of data in the archive is set to the root */
	directory(dirpath: string, destpath: false | string, data?: Partial<EntryData> | EntryDataFunction): this;
	file(filename: string, data: EntryData): this;
	glob(pattern: string, options?: GlobOptions, data?: Partial<EntryData>): this;
	finalize(): Promise<void>;

	setFormat(format: string): this;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	setModule(module: Function): this;

	pointer(): number;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	use(plugin: Function): this;

	symlink(filepath: string, target: string, mode?: number): this;

	on(event: "error" | "warning", listener: (error: ArchiverError) => void): this;
	on(event: "data", listener: (data: Buffer) => void): this;
	on(event: "progress", listener: (progress: ProgressData) => void): this;
	on(event: "close" | "drain" | "finish", listener: () => void): this;
	on(event: "pipe" | "unpipe", listener: (src: stream.Readable) => void): this;
	on(event: "entry", listener: (entry: EntryData) => void): this;
	on(event: string, listener: (...args: any[]) => void): this;
}

export class ZipArchive extends Archiver {
	constructor(options?: ArchiverOptions & ZipOptions);
}

export class TarArchive extends Archiver {
	constructor(options?: ArchiverOptions & TarOptions);
}

export class JsonArchive extends Archiver {
	constructor(options?: ArchiverOptions);
}