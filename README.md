# Archiver

Creates `.zip` or `.tar` archives using Node.js Streams (supports Node.js 18+).

Forked from [`archiver`](https://www.npmjs.com/package/archiver) package at its unreleased version `8.0.0`.

Visit the [API documentation](https://www.archiverjs.com/) for a list of all methods available.

## Install

```bash
npm install archiver-node --save
```

## Use

Create a utility class called `ZipArchive`.

```js
import { ZipArchive as ZipArchiver } from 'archiver-node'

// `WritableStream` doesn't work well with `archiver`.
// It breaks in certain cases. Use `PassThrough` stream instead.
// https://github.com/archiverjs/node-archiver/issues/336
// https://github.com/catamphetamine/archiver-bug
// import { WritableStream } from 'memory-streams'

import Stream, { PassThrough } from 'stream'

class ZipArchive {
  constructor() {
		this.outputStream = new PassThrough()

    const archive = new ZipArchiver({
      // Sets the compression level.
      // zlib: { level: 9 }
    })

    this.archive = archive

    this.promise = new Promise((resolve, reject) => {
      // Listens for all archive data to be written.
      // 'close' event is fired when all data has been written.
      this.outputStream.on('close', () => {
				this.size = archive.pointer()
        resolve()
      })

      // // Listens for all archive data to be written.
      // // `end` event is fired when all archive data has been consumed by a consumer stream.
      // // @see: https://nodejs.org/api/stream.html#stream_event_end
      // archive.on('end', function() {
      //   this.size = archive.pointer()
      //   resolve()
      // })

      // Catch "warnings", whatever those're.
      archive.on('warning', function(error) {
        reject(error)
        // The following code sample is from `archiver` README:
        // if (error.code === 'ENOENT') {
        //   // `ENOENT` errors happen when a file or folder doesn't exist.
        //   // It's not clear what are the cases when it could happen.
        //   // And it's not clear why they're dismissed as unimportant here.
        //   console.warn(error)
        // } else {
        //   reject(error)
        // }
      })

      // Catch errors.
      archive.on('error', reject)

      // Pipe archive data to the output stream.
      archive.pipe(this.outputStream)
    })
  }

  /**
   * @param {(stream.Readable|Buffer|string)} content
   * @param {string} internalPath — Path inside the archive
   */
  add(content, internalPath) {
    if (content instanceof Stream) {
      // `Stream` is allowed.
    } else if (content instanceof Buffer) {
      // `Buffer` is allowed.
    } else if (typeof content === 'string') {
      // `string` is allowed.
    } else {
      const message = 'Unsupported type of content attempted to be added to a .zip archive'
      console.log(message + ':')
      console.log(content)
      throw new Error(message)
    }
    this.archive.append(content, { name: internalPath })
  }

  /**
   * @param {string} filePath — Path to file in the filesystem
   * @param {string} internalPath — Path inside the archive
   */
  includeFile(filePath, internalPath) {
    this.archive.file(filePath, { name: internalPath })
  }

  /**
   * @param {string} directoryPath — Path to directory in the filesystem.
   * @param {string} filePathPattern — File path "glob" pattern. Example: "file*.txt".
   */
  includeFilesByMatch(directoryPath, filePathPattern) {
    this.archive.glob(filePathPattern, { cwd: directoryPath })
  }

  /**
   * @param {string} directoryPath — Path to directory in the filesystem
   * @param {string} [internalPath] — Path inside the archive. Omitting this argument will put the contents of the directory to the root of the archive.
   */
  includeDirectory(directoryPath, internalPath) {
    this.archive.directory(directoryPath, internalPath || false);
  }

  /**
   * Starts the process of writing the archive file data.
   * @returns {stream.Readable}
   */
  write() {
    // `.finalize()` starts the process of writing the archive file.
    //
    // `.finalize()` also returns some kind of `Promise` but it's some kind of a weird one
    // and is not meant to be `await`ed or anything like that.
    // https://github.com/archiverjs/node-archiver/issues/772
    //
    // "close", "end" or "finish" events may be fired on `this.archive`
    // right after calling this method, so any required event handlers
    // should have been added beforehand.
    //
    this.archive.finalize()

    // Returns a readable `Stream` with the `.zip` archive data.
    return this.outputStream
  }

  /**
   * Returns the size of the resulting archive.
   * Returns `undefined` until the archive has been written.
   * @returns {number | undefined}
   */
	getSize() {
		return this.size
	}
}
```

Use the utility class `ZipArchive`.

```js
const archive = new ZipArchive()

// append a file from stream
const file1 = __dirname + "/file1.txt";
archive.add(fs.createReadStream(file1), "file1.txt");

// append a file from string
archive.add("string cheese!", "file2.txt");

// append a file from buffer
const buffer3 = Buffer.from("buff it!");
archive.add(buffer3, "file3.txt");

// append a file
archive.includeFile("/path/to/file1.txt", "file4.txt");

// append files from a sub-directory and naming it `new-sub-directory` within the archive
archive.includeDirectory("/path/to/sub-directory/", "new-sub-directory");

// append files from a sub-directory, putting its contents at the root of archive
archive.includeDirectory("/path/to/sub-directory/");

// append files from a glob pattern
archive.includeFilesByMatch("/path/to/some/directory/", "file*.txt");

// finalize the archive (i.e. we are done appending files).
const archiveDataStream = archive.write();

archiveDataStream.pipe(...);
```

## Formats

Archiver ships with out of the box support for TAR and ZIP archives.
