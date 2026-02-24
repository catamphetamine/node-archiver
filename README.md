# Archiver

Creates `.zip` or `.tar` archives using Node.js Streams (supports Node.js 18+).

[Forked](https://github.com/archiverjs/node-archiver/issues/819#issuecomment-3945988393) from [`archiver`](https://www.npmjs.com/package/archiver) package at its unreleased version `8.0.0`.

## Install

```bash
npm install archiver-node --save
```

## Use

For simplified use, consider `archiver-node/zip` subpackage.

```js
import ZipArchive from 'archiver-node/zip'

const archive = new ZipArchive()

// Add a file from stream.
archive.add(fs.createReadStream("/path/to/file1.txt"), "file1.txt")

// Add a file from string.
archive.add("some text", "file2.txt")

// Add a file from buffer.
archive.add(Buffer.from(...), "file3.txt")

// Add a file from disk.
archive.includeFile("/path/to/file4.txt", "file4.txt")

// Add a directory from disk.
archive.includeDirectory("/path/to/directory", "directory")

// Add a directory from disk, putting its contents at the root of archive.
archive.includeDirectory("/path/to/directory")

// Add all files matching a "glob" pattern.
archive.includeFilesByMatch("/path/to/directory", "file*.txt")

// Finalize the archive, i.e. we are done adding files to it.
const archiveDataStream = archive.write()

// Pipe the archive data to an output stream.
archiveDataStream.pipe(fs.createWriteStream("/path/to/archive.zip"))

// (optional)
// When the archive has been written.
archive.promise.then(() => {
  // Print the size of the archive (in bytes).
  console.log(archive.size)
})
```

For classic use, see the [API documentation](https://www.archiverjs.com/) of the original `archiver` package.

```js
import { ZipArchive, TarArchive, JsonArchive } from 'archiver-node'

const archive = new ZipArchive({
  // (optional)
  // Node.js `zlib` options such as compression level.
  // https://nodejs.org/api/zlib
  zlib: { level: 9 }
})

// catch "non-critical" errors
archive.on("warning", (error) => {
  if (error.code === "ENOENT") {
    console.warn(error)
  } else {
    throw error
  }
})

// catch errors
archive.on("error", (error) => {
  throw error
})

// pipe archive data to the file
archive.pipe(fs.createWriteStream("/path/to/archive.zip"))

// append a file from stream
archive.append(fs.createReadStream("/path/to/file1.txt"), { name: "file1.txt" })

// append a file from string
archive.append("some text", { name: "file2.txt" })

// append a file from buffer
archive.append(Buffer.from(...);, { name: "file3.txt" })

// append a file
archive.file("/path/to/file4.txt", { name: "file4.txt" })

// append files from a sub-directory and naming it `new-subdir` within the archive
archive.directory("/path/to/directory", "directory")

// append files from a sub-directory, putting its contents at the root of archive
archive.directory("/path/to/directory", false)

// append files from a glob pattern
archive.glob("file*.txt", { cwd: "/path/to/directory" })

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize()
```

For implementing a new type of archive, extend the exported `Archiver` class.

```js
import { Archiver } from 'archiver-node'

class NewTypeOfArchive extends Archiver {
  constructor(options) {
    super(options)
    this._format = "new-type-of-archive"
    this._module = new NewTypeOfArchiveImplementation(options)
    this._supportsDirectory = true
    this._supportsSymlink = true
    this._modulePipe()
  }
}

class NewTypeOfArchiveImplementation {
  constructor(options) { ... }
  append(source, data, callback) { ... }
  finalize() { ... }
  on() { ... }
  pipe() { ... }
  unpipe() { ... }
}
```