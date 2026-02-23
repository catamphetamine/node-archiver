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
var json_exports = {};
__export(json_exports, {
  default: () => Json
});
module.exports = __toCommonJS(json_exports);
var import_readable_stream = require("readable-stream");
var import_buffer_crc32 = __toESM(require("buffer-crc32"), 1);
var import_utils = require("../utils.js");
/**
 * JSON Format Plugin
 *
 * @module plugins/json
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
class Json extends import_readable_stream.Transform {
  /**
   * @constructor
   * @param {(JsonOptions|TransformOptions)} options
   */
  constructor(options) {
    super({ ...options });
    this.files = [];
  }
  /**
   * [_transform description]
   *
   * @private
   * @param  {Buffer}   chunk
   * @param  {String}   encoding
   * @param  {Function} callback
   * @return void
   */
  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
  /**
   * [_writeStringified description]
   *
   * @private
   * @return void
   */
  _writeStringified() {
    var fileString = JSON.stringify(this.files);
    this.write(fileString);
  }
  /**
   * [append description]
   *
   * @param  {(Buffer|Stream)}   source
   * @param  {EntryData}   data
   * @param  {Function} callback
   * @return void
   */
  append(source, data, callback) {
    var self = this;
    data.crc32 = 0;
    function onend(err, sourceBuffer) {
      if (err) {
        callback(err);
        return;
      }
      data.size = sourceBuffer.length || 0;
      data.crc32 = import_buffer_crc32.default.unsigned(sourceBuffer);
      self.files.push(data);
      callback(null, data);
    }
    if (data.sourceType === "buffer") {
      onend(null, source);
    } else if (data.sourceType === "stream") {
      (0, import_utils.collectStream)(source, onend);
    }
  }
  /**
   * [finalize description]
   *
   * @return void
   */
  finalize() {
    this._writeStringified();
    this.end();
  }
}
