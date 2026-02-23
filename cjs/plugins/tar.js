var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tar_exports = {};
__export(tar_exports, {
  default: () => Tar
});
module.exports = __toCommonJS(tar_exports);
var import_zlib = __toESM(require("zlib"), 1);
var import_tar_stream = __toESM(require("tar-stream"), 1);
var import_utils = require("../utils.js");
/**
 * TAR Format Plugin
 *
 * @module plugins/tar
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
class Tar {
  /**
   * @constructor
   * @param {TarOptions} options
   */
  constructor(options) {
    options = this.options = {
      gzip: false,
      ...options
    };
    if (typeof options.gzipOptions !== "object") {
      options.gzipOptions = {};
    }
    this.engine = import_tar_stream.default.pack(options);
    this.compressor = false;
    if (options.gzip) {
      this.compressor = import_zlib.default.createGzip(options.gzipOptions);
      this.compressor.on("error", this._onCompressorError.bind(this));
    }
  }
  /**
   * [_onCompressorError description]
   *
   * @private
   * @param  {Error} err
   * @return void
   */
  _onCompressorError(err) {
    this.engine.emit("error", err);
  }
  /**
   * [append description]
   *
   * @param  {(Buffer|Stream)} source
   * @param  {TarEntryData} data
   * @param  {Function} callback
   * @return void
   */
  append(source, data, callback) {
    var self = this;
    data.mtime = data.date;
    function append(err, sourceBuffer) {
      if (err) {
        callback(err);
        return;
      }
      self.engine.entry(data, sourceBuffer, function(err2) {
        callback(err2, data);
      });
    }
    if (data.sourceType === "buffer") {
      append(null, source);
    } else if (data.sourceType === "stream" && data.stats) {
      data.size = data.stats.size;
      var entry = self.engine.entry(data, function(err) {
        callback(err, data);
      });
      source.pipe(entry);
    } else if (data.sourceType === "stream") {
      (0, import_utils.collectStream)(source, append);
    }
  }
  /**
   * [finalize description]
   *
   * @return void
   */
  finalize() {
    this.engine.finalize();
  }
  /**
   * [on description]
   *
   * @return this.engine
   */
  on() {
    return this.engine.on.apply(this.engine, arguments);
  }
  /**
   * [pipe description]
   *
   * @param  {String} destination
   * @param  {Object} options
   * @return this.engine
   */
  pipe(destination, options) {
    if (this.compressor) {
      return this.engine.pipe.apply(this.engine, [this.compressor]).pipe(destination, options);
    } else {
      return this.engine.pipe.apply(this.engine, arguments);
    }
  }
  /**
   * [unpipe description]
   *
   * @return this.engine
   */
  unpipe() {
    if (this.compressor) {
      return this.compressor.unpipe.apply(this.compressor, arguments);
    } else {
      return this.engine.unpipe.apply(this.engine, arguments);
    }
  }
}
