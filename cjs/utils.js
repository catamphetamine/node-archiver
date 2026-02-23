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
var utils_exports = {};
__export(utils_exports, {
  collectStream: () => collectStream,
  dateify: () => dateify,
  normalizeInputSource: () => normalizeInputSource,
  sanitizePath: () => sanitizePath,
  trailingSlashIt: () => trailingSlashIt
});
module.exports = __toCommonJS(utils_exports);
var import_normalize_path = __toESM(require("normalize-path"), 1);
var import_readable_stream = require("readable-stream");
var import_is_stream = require("is-stream");
function collectStream(source, callback) {
  var collection = [];
  var size = 0;
  source.on("error", callback);
  source.on("data", function(chunk) {
    collection.push(chunk);
    size += chunk.length;
  });
  source.on("end", function() {
    var buf = Buffer.alloc(size);
    var offset = 0;
    collection.forEach(function(data) {
      data.copy(buf, offset);
      offset += data.length;
    });
    callback(null, buf);
  });
}
function dateify(dateish) {
  dateish = dateish || /* @__PURE__ */ new Date();
  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === "string") {
    dateish = new Date(dateish);
  } else {
    dateish = /* @__PURE__ */ new Date();
  }
  return dateish;
}
function normalizeInputSource(source) {
  if (source === null) {
    return Buffer.alloc(0);
  } else if (typeof source === "string") {
    return Buffer.from(source);
  } else if ((0, import_is_stream.isStream)(source, { canOpen: false })) {
    return source.pipe(new import_readable_stream.PassThrough());
  }
  return source;
}
function sanitizePath(filepath) {
  return (0, import_normalize_path.default)(filepath, false).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, "");
}
function trailingSlashIt(str) {
  return str.slice(-1) !== "/" ? str + "/" : str;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectStream,
  dateify,
  normalizeInputSource,
  sanitizePath,
  trailingSlashIt
});
