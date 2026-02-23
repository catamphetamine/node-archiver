var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Archiver_exports = {};
__export(Archiver_exports, {
  default: () => Archiver
});
module.exports = __toCommonJS(Archiver_exports);
var import_fs = require("fs");
var import_is_stream = require("is-stream");
var import_readdir_glob = require("readdir-glob");
var import_lazystream = require("./lazystream.js");
var import_async = require("async");
var import_path = require("path");
var import_error = require("./error.js");
var import_readable_stream = require("readable-stream");
var import_utils = require("./utils.js");
const { ReaddirGlob } = import_readdir_glob.readdirGlob;
const win32 = process.platform === "win32";
class Archiver extends import_readable_stream.Transform {
  _supportsDirectory = false;
  _supportsSymlink = false;
  /**
   * @constructor
   * @param {String} format The archive format to use.
   * @param {(CoreOptions|TransformOptions)} options See also {@link ZipOptions} and {@link TarOptions}.
   */
  constructor(options) {
    options = {
      highWaterMark: 1024 * 1024,
      statConcurrency: 4,
      ...options
    };
    super(options);
    this.options = options;
    this._format = false;
    this._module = false;
    this._pending = 0;
    this._pointer = 0;
    this._entriesCount = 0;
    this._entriesProcessedCount = 0;
    this._fsEntriesTotalBytes = 0;
    this._fsEntriesProcessedBytes = 0;
    this._queue = (0, import_async.queue)(this._onQueueTask.bind(this), 1);
    this._queue.drain(this._onQueueDrain.bind(this));
    this._statQueue = (0, import_async.queue)(
      this._onStatQueueTask.bind(this),
      options.statConcurrency
    );
    this._statQueue.drain(this._onQueueDrain.bind(this));
    this._state = {
      aborted: false,
      finalize: false,
      finalizing: false,
      finalized: false,
      modulePiped: false
    };
    this._streams = [];
  }
  /**
   * Internal logic for `abort`.
   *
   * @private
   * @return void
   */
  _abort() {
    this._state.aborted = true;
    this._queue.kill();
    this._statQueue.kill();
    if (this._queue.idle()) {
      this._shutdown();
    }
  }
  /**
   * Internal helper for appending files.
   *
   * @private
   * @param  {String} filepath The source filepath.
   * @param  {EntryData} data The entry data.
   * @return void
   */
  _append(filepath, data) {
    data = data || {};
    let task = {
      source: null,
      filepath
    };
    if (!data.name) {
      data.name = filepath;
    }
    data.sourcePath = filepath;
    task.data = data;
    this._entriesCount++;
    if (data.stats && data.stats instanceof import_fs.Stats) {
      task = this._updateQueueTaskWithStats(task, data.stats);
      if (task) {
        if (data.stats.size) {
          this._fsEntriesTotalBytes += data.stats.size;
        }
        this._queue.push(task);
      }
    } else {
      this._statQueue.push(task);
    }
  }
  /**
   * Internal logic for `finalize`.
   *
   * @private
   * @return void
   */
  _finalize() {
    if (this._state.finalizing || this._state.finalized || this._state.aborted) {
      return;
    }
    this._state.finalizing = true;
    this._moduleFinalize();
    this._state.finalizing = false;
    this._state.finalized = true;
  }
  /**
   * Checks the various state variables to determine if we can `finalize`.
   *
   * @private
   * @return {Boolean}
   */
  _maybeFinalize() {
    if (this._state.finalizing || this._state.finalized || this._state.aborted) {
      return false;
    }
    if (this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
      this._finalize();
      return true;
    }
    return false;
  }
  /**
   * Appends an entry to the module.
   *
   * @private
   * @fires  Archiver#entry
   * @param  {(Buffer|Stream)} source
   * @param  {EntryData} data
   * @param  {Function} callback
   * @return void
   */
  _moduleAppend(source, data, callback) {
    if (this._state.aborted) {
      callback();
      return;
    }
    this._module.append(
      source,
      data,
      function(err) {
        this._task = null;
        if (this._state.aborted) {
          this._shutdown();
          return;
        }
        if (err) {
          this.emit("error", err);
          setImmediate(callback);
          return;
        }
        this.emit("entry", data);
        this._entriesProcessedCount++;
        if (data.stats && data.stats.size) {
          this._fsEntriesProcessedBytes += data.stats.size;
        }
        this.emit("progress", {
          entries: {
            total: this._entriesCount,
            processed: this._entriesProcessedCount
          },
          fs: {
            totalBytes: this._fsEntriesTotalBytes,
            processedBytes: this._fsEntriesProcessedBytes
          }
        });
        setImmediate(callback);
      }.bind(this)
    );
  }
  /**
   * Finalizes the module.
   *
   * @private
   * @return void
   */
  _moduleFinalize() {
    if (typeof this._module.finalize === "function") {
      this._module.finalize();
    } else if (typeof this._module.end === "function") {
      this._module.end();
    } else {
      this.emit("error", new import_error.ArchiverError("NOENDMETHOD"));
    }
  }
  /**
   * Pipes the module to our internal stream with error bubbling.
   *
   * @private
   * @return void
   */
  _modulePipe() {
    this._module.on("error", this._onModuleError.bind(this));
    this._module.pipe(this);
    this._state.modulePiped = true;
  }
  /**
   * Unpipes the module from our internal stream.
   *
   * @private
   * @return void
   */
  _moduleUnpipe() {
    this._module.unpipe(this);
    this._state.modulePiped = false;
  }
  /**
   * Normalizes entry data with fallbacks for key properties.
   *
   * @private
   * @param  {Object} data
   * @param  {fs.Stats} stats
   * @return {Object}
   */
  _normalizeEntryData(data, stats) {
    data = {
      type: "file",
      name: null,
      date: null,
      mode: null,
      prefix: null,
      sourcePath: null,
      stats: false,
      ...data
    };
    if (stats && data.stats === false) {
      data.stats = stats;
    }
    let isDir = data.type === "directory";
    if (data.name) {
      if (typeof data.prefix === "string" && "" !== data.prefix) {
        data.name = data.prefix + "/" + data.name;
        data.prefix = null;
      }
      data.name = (0, import_utils.sanitizePath)(data.name);
      if (data.type !== "symlink" && data.name.slice(-1) === "/") {
        isDir = true;
        data.type = "directory";
      } else if (isDir) {
        data.name += "/";
      }
    }
    if (typeof data.mode === "number") {
      if (win32) {
        data.mode &= 511;
      } else {
        data.mode &= 4095;
      }
    } else if (data.stats && data.mode === null) {
      if (win32) {
        data.mode = data.stats.mode & 511;
      } else {
        data.mode = data.stats.mode & 4095;
      }
      if (win32 && isDir) {
        data.mode = 493;
      }
    } else if (data.mode === null) {
      data.mode = isDir ? 493 : 420;
    }
    if (data.stats && data.date === null) {
      data.date = data.stats.mtime;
    } else {
      data.date = (0, import_utils.dateify)(data.date);
    }
    return data;
  }
  /**
   * Error listener that re-emits error on to our internal stream.
   *
   * @private
   * @param  {Error} err
   * @return void
   */
  _onModuleError(err) {
    this.emit("error", err);
  }
  /**
   * Checks the various state variables after queue has drained to determine if
   * we need to `finalize`.
   *
   * @private
   * @return void
   */
  _onQueueDrain() {
    if (this._state.finalizing || this._state.finalized || this._state.aborted) {
      return;
    }
    if (this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
      this._finalize();
    }
  }
  /**
   * Appends each queue task to the module.
   *
   * @private
   * @param  {Object} task
   * @param  {Function} callback
   * @return void
   */
  _onQueueTask(task, callback) {
    const fullCallback = () => {
      if (task.data.callback) {
        task.data.callback();
      }
      callback();
    };
    if (this._state.finalizing || this._state.finalized || this._state.aborted) {
      fullCallback();
      return;
    }
    this._task = task;
    this._moduleAppend(task.source, task.data, fullCallback);
  }
  /**
   * Performs a file stat and reinjects the task back into the queue.
   *
   * @private
   * @param  {Object} task
   * @param  {Function} callback
   * @return void
   */
  _onStatQueueTask(task, callback) {
    if (this._state.finalizing || this._state.finalized || this._state.aborted) {
      callback();
      return;
    }
    (0, import_fs.lstat)(
      task.filepath,
      function(err, stats) {
        if (this._state.aborted) {
          setImmediate(callback);
          return;
        }
        if (err) {
          this._entriesCount--;
          this.emit("warning", err);
          setImmediate(callback);
          return;
        }
        task = this._updateQueueTaskWithStats(task, stats);
        if (task) {
          if (stats.size) {
            this._fsEntriesTotalBytes += stats.size;
          }
          this._queue.push(task);
        }
        setImmediate(callback);
      }.bind(this)
    );
  }
  /**
   * Unpipes the module and ends our internal stream.
   *
   * @private
   * @return void
   */
  _shutdown() {
    this._moduleUnpipe();
    this.end();
  }
  /**
   * Tracks the bytes emitted by our internal stream.
   *
   * @private
   * @param  {Buffer} chunk
   * @param  {String} encoding
   * @param  {Function} callback
   * @return void
   */
  _transform(chunk, encoding, callback) {
    if (chunk) {
      this._pointer += chunk.length;
    }
    callback(null, chunk);
  }
  /**
   * Updates and normalizes a queue task using stats data.
   *
   * @private
   * @param  {Object} task
   * @param  {Stats} stats
   * @return {Object}
   */
  _updateQueueTaskWithStats(task, stats) {
    if (stats.isFile()) {
      task.data.type = "file";
      task.data.sourceType = "stream";
      task.source = new import_lazystream.Readable(function() {
        return (0, import_fs.createReadStream)(task.filepath);
      });
    } else if (stats.isDirectory() && this._supportsDirectory) {
      task.data.name = (0, import_utils.trailingSlashIt)(task.data.name);
      task.data.type = "directory";
      task.data.sourcePath = (0, import_utils.trailingSlashIt)(task.filepath);
      task.data.sourceType = "buffer";
      task.source = Buffer.concat([]);
    } else if (stats.isSymbolicLink() && this._supportsSymlink) {
      const linkPath = (0, import_fs.readlinkSync)(task.filepath);
      const dirName = (0, import_path.dirname)(task.filepath);
      task.data.type = "symlink";
      task.data.linkname = (0, import_path.relative)(
        dirName,
        (0, import_path.resolve)(dirName, linkPath)
      );
      task.data.sourceType = "buffer";
      task.source = Buffer.concat([]);
    } else {
      if (stats.isDirectory()) {
        this.emit(
          "warning",
          new import_error.ArchiverError("DIRECTORYNOTSUPPORTED", task.data)
        );
      } else if (stats.isSymbolicLink()) {
        this.emit(
          "warning",
          new import_error.ArchiverError("SYMLINKNOTSUPPORTED", task.data)
        );
      } else {
        this.emit("warning", new import_error.ArchiverError("ENTRYNOTSUPPORTED", task.data));
      }
      return null;
    }
    task.data = this._normalizeEntryData(task.data, stats);
    return task;
  }
  /**
   * Aborts the archiving process, taking a best-effort approach, by:
   *
   * - removing any pending queue tasks
   * - allowing any active queue workers to finish
   * - detaching internal module pipes
   * - ending both sides of the Transform stream
   *
   * It will NOT drain any remaining sources.
   *
   * @return {this}
   */
  abort() {
    if (this._state.aborted || this._state.finalized) {
      return this;
    }
    this._abort();
    return this;
  }
  /**
   * Appends an input source (text string, buffer, or stream) to the instance.
   *
   * When the instance has received, processed, and emitted the input, the `entry`
   * event is fired.
   *
   * @fires  Archiver#entry
   * @param  {(Buffer|Stream|String)} source The input source.
   * @param  {EntryData} data See also {@link ZipEntryData} and {@link TarEntryData}.
   * @return {this}
   */
  append(source, data) {
    if (this._state.finalize || this._state.aborted) {
      this.emit("error", new import_error.ArchiverError("QUEUECLOSED"));
      return this;
    }
    data = this._normalizeEntryData(data);
    if (typeof data.name !== "string" || data.name.length === 0) {
      this.emit("error", new import_error.ArchiverError("ENTRYNAMEREQUIRED"));
      return this;
    }
    if (data.type === "directory" && !this._supportsDirectory) {
      this.emit(
        "error",
        new import_error.ArchiverError("DIRECTORYNOTSUPPORTED", { name: data.name })
      );
      return this;
    }
    source = (0, import_utils.normalizeInputSource)(source);
    if (Buffer.isBuffer(source)) {
      data.sourceType = "buffer";
    } else if ((0, import_is_stream.isStream)(source)) {
      data.sourceType = "stream";
    } else {
      this.emit(
        "error",
        new import_error.ArchiverError("INPUTSTEAMBUFFERREQUIRED", { name: data.name })
      );
      return this;
    }
    this._entriesCount++;
    this._queue.push({
      data,
      source
    });
    return this;
  }
  /**
   * Appends a directory and its files, recursively, given its dirpath.
   *
   * @param  {String} dirpath The source directory path.
   * @param  {String} destpath The destination path within the archive.
   * @param  {(EntryData|Function)} data See also [ZipEntryData]{@link ZipEntryData} and
   * [TarEntryData]{@link TarEntryData}.
   * @return {this}
   */
  directory(dirpath, destpath, data) {
    if (this._state.finalize || this._state.aborted) {
      this.emit("error", new import_error.ArchiverError("QUEUECLOSED"));
      return this;
    }
    if (typeof dirpath !== "string" || dirpath.length === 0) {
      this.emit("error", new import_error.ArchiverError("DIRECTORYDIRPATHREQUIRED"));
      return this;
    }
    this._pending++;
    if (destpath === false) {
      destpath = "";
    } else if (typeof destpath !== "string") {
      destpath = dirpath;
    }
    var dataFunction = false;
    if (typeof data === "function") {
      dataFunction = data;
      data = {};
    } else if (typeof data !== "object") {
      data = {};
    }
    var globOptions = {
      stat: true,
      dot: true
    };
    function onGlobEnd() {
      this._pending--;
      this._maybeFinalize();
    }
    function onGlobError(err) {
      this.emit("error", err);
    }
    function onGlobMatch(match) {
      globber.pause();
      let ignoreMatch = false;
      let entryData = Object.assign({}, data);
      entryData.name = match.relative;
      entryData.prefix = destpath;
      entryData.stats = match.stat;
      entryData.callback = globber.resume.bind(globber);
      try {
        if (dataFunction) {
          entryData = dataFunction(entryData);
          if (entryData === false) {
            ignoreMatch = true;
          } else if (typeof entryData !== "object") {
            throw new import_error.ArchiverError("DIRECTORYFUNCTIONINVALIDDATA", {
              dirpath
            });
          }
        }
      } catch (e) {
        this.emit("error", e);
        return;
      }
      if (ignoreMatch) {
        globber.resume();
        return;
      }
      this._append(match.absolute, entryData);
    }
    const globber = (0, import_readdir_glob.readdirGlob)(dirpath, globOptions);
    globber.on("error", onGlobError.bind(this));
    globber.on("match", onGlobMatch.bind(this));
    globber.on("end", onGlobEnd.bind(this));
    return this;
  }
  /**
   * Appends a file given its filepath using a
   * [lazystream]{@link https://github.com/jpommerening/node-lazystream} wrapper to
   * prevent issues with open file limits.
   *
   * When the instance has received, processed, and emitted the file, the `entry`
   * event is fired.
   *
   * @param  {String} filepath The source filepath.
   * @param  {EntryData} data See also [ZipEntryData]{@link ZipEntryData} and
   * [TarEntryData]{@link TarEntryData}.
   * @return {this}
   */
  file(filepath, data) {
    if (this._state.finalize || this._state.aborted) {
      this.emit("error", new import_error.ArchiverError("QUEUECLOSED"));
      return this;
    }
    if (typeof filepath !== "string" || filepath.length === 0) {
      this.emit("error", new import_error.ArchiverError("FILEFILEPATHREQUIRED"));
      return this;
    }
    this._append(filepath, data);
    return this;
  }
  /**
   * Appends multiple files that match a glob pattern.
   *
   * @param  {String} pattern The [glob pattern]{@link https://github.com/isaacs/minimatch} to match.
   * @param  {Object} options See [node-readdir-glob]{@link https://github.com/yqnn/node-readdir-glob#options}.
   * @param  {EntryData} data See also [ZipEntryData]{@link ZipEntryData} and
   * [TarEntryData]{@link TarEntryData}.
   * @return {this}
   */
  glob(pattern, options, data) {
    this._pending++;
    options = {
      stat: true,
      pattern,
      ...options
    };
    function onGlobEnd() {
      this._pending--;
      this._maybeFinalize();
    }
    function onGlobError(err) {
      this.emit("error", err);
    }
    function onGlobMatch(match) {
      globber.pause();
      const entryData = Object.assign({}, data);
      entryData.callback = globber.resume.bind(globber);
      entryData.stats = match.stat;
      entryData.name = match.relative;
      this._append(match.absolute, entryData);
    }
    const globber = new ReaddirGlob(options.cwd || ".", options);
    globber.on("error", onGlobError.bind(this));
    globber.on("match", onGlobMatch.bind(this));
    globber.on("end", onGlobEnd.bind(this));
    return this;
  }
  /**
   * Finalizes the instance and prevents further appending to the archive
   * structure (queue will continue til drained).
   *
   * The `end`, `close` or `finish` events on the destination stream may fire
   * right after calling this method so you should set listeners beforehand to
   * properly detect stream completion.
   *
   * @return {Promise}
   */
  finalize() {
    if (this._state.aborted) {
      var abortedError = new import_error.ArchiverError("ABORTED");
      this.emit("error", abortedError);
      return Promise.reject(abortedError);
    }
    if (this._state.finalize) {
      var finalizingError = new import_error.ArchiverError("FINALIZING");
      this.emit("error", finalizingError);
      return Promise.reject(finalizingError);
    }
    this._state.finalize = true;
    if (this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
      this._finalize();
    }
    var self = this;
    return new Promise(function(resolve, reject) {
      var errored;
      self._module.on("end", function() {
        if (!errored) {
          resolve();
        }
      });
      self._module.on("error", function(err) {
        errored = true;
        reject(err);
      });
    });
  }
  /**
   * Appends a symlink to the instance.
   *
   * This does NOT interact with filesystem and is used for programmatically creating symlinks.
   *
   * @param  {String} filepath The symlink path (within archive).
   * @param  {String} target The target path (within archive).
   * @param  {Number} mode Sets the entry permissions.
   * @return {this}
   */
  symlink(filepath, target, mode) {
    if (this._state.finalize || this._state.aborted) {
      this.emit("error", new import_error.ArchiverError("QUEUECLOSED"));
      return this;
    }
    if (typeof filepath !== "string" || filepath.length === 0) {
      this.emit("error", new import_error.ArchiverError("SYMLINKFILEPATHREQUIRED"));
      return this;
    }
    if (typeof target !== "string" || target.length === 0) {
      this.emit(
        "error",
        new import_error.ArchiverError("SYMLINKTARGETREQUIRED", { filepath })
      );
      return this;
    }
    if (!this._supportsSymlink) {
      this.emit(
        "error",
        new import_error.ArchiverError("SYMLINKNOTSUPPORTED", { filepath })
      );
      return this;
    }
    var data = {};
    data.type = "symlink";
    data.name = filepath.replace(/\\/g, "/");
    data.linkname = target.replace(/\\/g, "/");
    data.sourceType = "buffer";
    if (typeof mode === "number") {
      data.mode = mode;
    }
    this._entriesCount++;
    this._queue.push({
      data,
      source: Buffer.concat([])
    });
    return this;
  }
  /**
   * Returns the current length (in bytes) that has been emitted.
   *
   * @return {Number}
   */
  pointer() {
    return this._pointer;
  }
}
