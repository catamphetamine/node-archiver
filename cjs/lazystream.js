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
var lazystream_exports = {};
__export(lazystream_exports, {
  Readable: () => Readable,
  Writable: () => Writable
});
module.exports = __toCommonJS(lazystream_exports);
var import_stream = require("stream");
function beforeFirstCall(instance, method, callback) {
  instance[method] = function(...args) {
    delete instance[method];
    callback.apply(this, args);
    return this[method].apply(this, args);
  };
}
class Readable extends import_stream.PassThrough {
  constructor(fn, options) {
    super(options);
    if (!(this instanceof Readable)) {
      return new Readable(fn, options);
    }
    beforeFirstCall(this, "_read", function() {
      const source = fn.call(this, options);
      const emit = this.emit.bind(this, "error");
      source.on("error", emit);
      source.pipe(this);
    });
    this.emit("readable");
  }
}
class Writable extends import_stream.PassThrough {
  constructor(fn, options) {
    super(options);
    if (!(this instanceof Writable)) {
      return new Writable(fn, options);
    }
    beforeFirstCall(this, "_write", function() {
      const destination = fn.call(this, options);
      const emit = this.emit.bind(this, "error");
      destination.on("error", emit);
      this.pipe(destination);
    });
    this.emit("writable");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Readable,
  Writable
});
