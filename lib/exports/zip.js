import ZipArchive_ from '../archivers/ZipArchive.js'

// `WritableStream` doesn't work well with `archiver`.
// It breaks in certain cases. Use `PassThrough` stream instead.
// https://github.com/archiverjs/node-archiver/issues/336
// https://github.com/catamphetamine/archiver-bug
// import { WritableStream } from 'memory-streams'

import Stream, { PassThrough } from 'stream'

export default class ZipArchive {
  /**
   * @param {object} [options] — Node.js `zlib` options such as compression level. https://nodejs.org/api/zlib. Example: `{ zlib: { level: 9 } }`.
   */
  constructor(options) {
    // this._outputStream = new WritableStream()
    this._outputStream = new PassThrough()

    const archive = new ZipArchive_(options)

    this._archive = archive

    // `archive` has a `.pipe()` method which kinda makes it usable as a readable stream.
    // Although it's still not a "proper" implementation of a `Readable` stream.
    // https://github.com/archiverjs/node-archiver/issues/765
    // To get a "proper" implementation of a `Readable` stream, people use a workaround:
    // `const passThroughStream = new PassThrough()` and then `archive.pipe(passThroughStream)`.

    // An alternative way of how to create a `ReadableStream` from an `archive`.
    // https://github.com/archiverjs/node-archiver/issues/759
    //
    // const readableStream = new ReadableStream({
    //   start(controller) {
    //     archive.on('data', chunk => controller.enqueue(chunk));
    //     archive.on('end', () => controller.close());
    //     archive.on('error', error => controller.error(error));
    //
    //     archive.append(...);
    //     archive.append(...);
    //     archive.finalize();
    //   }
    // });

    // The size of the resulting archive (in bytes).
    // Is `undefined` until the archive has been written.
    this.size = undefined

    // A `Promise<void>` that resolves when the archive has been written.
    this.promise = new Promise((resolve, reject) => {
      // Listens for all archive data to be written.
      // 'close' event is fired when all data has been written.
      this._outputStream.on('close', () => {
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
      archive.pipe(this._outputStream)
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
    this._archive.append(content, { name: internalPath })
  }

  /**
   * @param {string} pathToFile — Path to file in the filesystem
   * @param {string} internalPath — Path inside the archive
   */
  includeFile(pathToFile, internalPath) {
    this._archive.file(pathToFile, { name: internalPath })
  }

  /**
   * @param {string} pathToDirectory — Path to directory in the filesystem.
   * @param {string} filePathPattern — File path "glob" pattern. Example: "file*.txt".
   */
  includeFilesByMatch(pathToDirectory, filePathPattern) {
    this._archive.glob(filePathPattern, { cwd: pathToDirectory })
  }

  /**
   * @param {string} pathToDirectory — Path to directory in the filesystem
   * @param {string} [internalPath] — Path inside the archive. Omitting this argument will put the contents of the directory to the root of the archive.
   */
  includeDirectory(pathToDirectory, internalPath) {
    this._archive.directory(pathToDirectory, internalPath || false);
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
    // "close", "end" or "finish" events may be fired on `this._archive`
    // right after calling this method, so any required event handlers
    // should have been added beforehand.
    //
    this._archive.finalize()

    // Returns a readable `Stream` with the `.zip` archive data.
    return this._outputStream
  }
}