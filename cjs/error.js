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
var error_exports = {};
__export(error_exports, {
  ArchiverError: () => ArchiverError
});
module.exports = __toCommonJS(error_exports);
var import_util = __toESM(require("util"), 1);
const ERROR_CODES = {
  ABORTED: "archive was aborted",
  DIRECTORYDIRPATHREQUIRED: "diretory dirpath argument must be a non-empty string value",
  DIRECTORYFUNCTIONINVALIDDATA: "invalid data returned by directory custom data function",
  ENTRYNAMEREQUIRED: "entry name must be a non-empty string value",
  FILEFILEPATHREQUIRED: "file filepath argument must be a non-empty string value",
  FINALIZING: "archive already finalizing",
  QUEUECLOSED: "queue closed",
  NOENDMETHOD: "no suitable finalize/end method defined by module",
  DIRECTORYNOTSUPPORTED: "support for directory entries not defined by module",
  FORMATSET: "archive format already set",
  INPUTSTEAMBUFFERREQUIRED: "input source must be valid Stream or Buffer instance",
  MODULESET: "module already set",
  SYMLINKNOTSUPPORTED: "support for symlink entries not defined by module",
  SYMLINKFILEPATHREQUIRED: "symlink filepath argument must be a non-empty string value",
  SYMLINKTARGETREQUIRED: "symlink target argument must be a non-empty string value",
  ENTRYNOTSUPPORTED: "entry not supported"
};
function ArchiverError(code, data) {
  Error.captureStackTrace(this, this.constructor);
  this.message = ERROR_CODES[code] || code;
  this.code = code;
  this.data = data;
}
import_util.default.inherits(ArchiverError, Error);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArchiverError
});
