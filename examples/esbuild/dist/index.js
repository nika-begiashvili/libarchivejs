// node_modules/libarchive.js/dist/libarchive.js
var e = Symbol("Comlink.proxy");
var t = Symbol("Comlink.endpoint");
var n = Symbol("Comlink.releaseProxy");
var r = Symbol("Comlink.finalizer");
var i = Symbol("Comlink.thrown");
var s = (e2) => "object" == typeof e2 && null !== e2 || "function" == typeof e2;
var a = /* @__PURE__ */ new Map([["proxy", { canHandle: (t2) => s(t2) && t2[e], serialize(e2) {
  const { port1: t2, port2: n2 } = new MessageChannel();
  return o(e2, t2), [n2, [n2]];
}, deserialize: (e2) => (e2.start(), l(e2)) }], ["throw", { canHandle: (e2) => s(e2) && i in e2, serialize({ value: e2 }) {
  let t2;
  return t2 = e2 instanceof Error ? { isError: true, value: { message: e2.message, name: e2.name, stack: e2.stack } } : { isError: false, value: e2 }, [t2, []];
}, deserialize(e2) {
  if (e2.isError)
    throw Object.assign(new Error(e2.value.message), e2.value);
  throw e2.value;
} }]]);
function o(e2, t2 = globalThis, n2 = ["*"]) {
  t2.addEventListener("message", function s2(a2) {
    if (!a2 || !a2.data)
      return;
    if (!function(e3, t3) {
      for (const n3 of e3) {
        if (t3 === n3 || "*" === n3)
          return true;
        if (n3 instanceof RegExp && n3.test(t3))
          return true;
      }
      return false;
    }(n2, a2.origin))
      return void console.warn(`Invalid origin '${a2.origin}' for comlink proxy`);
    const { id: l2, type: u2, path: p2 } = Object.assign({ path: [] }, a2.data), h2 = (a2.data.argumentList || []).map(E);
    let f2;
    try {
      const t3 = p2.slice(0, -1).reduce((e3, t4) => e3[t4], e2), n3 = p2.reduce((e3, t4) => e3[t4], e2);
      switch (u2) {
        case "GET":
          f2 = n3;
          break;
        case "SET":
          t3[p2.slice(-1)[0]] = E(a2.data.value), f2 = true;
          break;
        case "APPLY":
          f2 = n3.apply(t3, h2);
          break;
        case "CONSTRUCT":
          f2 = w(new n3(...h2));
          break;
        case "ENDPOINT":
          {
            const { port1: t4, port2: n4 } = new MessageChannel();
            o(e2, n4), f2 = function(e3, t5) {
              return g.set(e3, t5), e3;
            }(t4, [t4]);
          }
          break;
        case "RELEASE":
          f2 = void 0;
          break;
        default:
          return;
      }
    } catch (e3) {
      f2 = { value: e3, [i]: 0 };
    }
    Promise.resolve(f2).catch((e3) => ({ value: e3, [i]: 0 })).then((n3) => {
      const [i2, a3] = y(n3);
      t2.postMessage(Object.assign(Object.assign({}, i2), { id: l2 }), a3), "RELEASE" === u2 && (t2.removeEventListener("message", s2), c(t2), r in e2 && "function" == typeof e2[r] && e2[r]());
    }).catch((e3) => {
      const [n3, r2] = y({ value: new TypeError("Unserializable return value"), [i]: 0 });
      t2.postMessage(Object.assign(Object.assign({}, n3), { id: l2 }), r2);
    });
  }), t2.start && t2.start();
}
function c(e2) {
  (function(e3) {
    return "MessagePort" === e3.constructor.name;
  })(e2) && e2.close();
}
function l(e2, t2) {
  return d(e2, [], t2);
}
function u(e2) {
  if (e2)
    throw new Error("Proxy has been released and is not useable");
}
function p(e2) {
  return v(e2, { type: "RELEASE" }).then(() => {
    c(e2);
  });
}
var h = /* @__PURE__ */ new WeakMap();
var f = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e2) => {
  const t2 = (h.get(e2) || 0) - 1;
  h.set(e2, t2), 0 === t2 && p(e2);
});
function d(e2, r2 = [], i2 = function() {
}) {
  let s2 = false;
  const a2 = new Proxy(i2, { get(t2, i3) {
    if (u(s2), i3 === n)
      return () => {
        !function(e3) {
          f && f.unregister(e3);
        }(a2), p(e2), s2 = true;
      };
    if ("then" === i3) {
      if (0 === r2.length)
        return { then: () => a2 };
      const t3 = v(e2, { type: "GET", path: r2.map((e3) => e3.toString()) }).then(E);
      return t3.then.bind(t3);
    }
    return d(e2, [...r2, i3]);
  }, set(t2, n2, i3) {
    u(s2);
    const [a3, o2] = y(i3);
    return v(e2, { type: "SET", path: [...r2, n2].map((e3) => e3.toString()), value: a3 }, o2).then(E);
  }, apply(n2, i3, a3) {
    u(s2);
    const o2 = r2[r2.length - 1];
    if (o2 === t)
      return v(e2, { type: "ENDPOINT" }).then(E);
    if ("bind" === o2)
      return d(e2, r2.slice(0, -1));
    const [c2, l2] = m(a3);
    return v(e2, { type: "APPLY", path: r2.map((e3) => e3.toString()), argumentList: c2 }, l2).then(E);
  }, construct(t2, n2) {
    u(s2);
    const [i3, a3] = m(n2);
    return v(e2, { type: "CONSTRUCT", path: r2.map((e3) => e3.toString()), argumentList: i3 }, a3).then(E);
  } });
  return function(e3, t2) {
    const n2 = (h.get(t2) || 0) + 1;
    h.set(t2, n2), f && f.register(e3, t2, e3);
  }(a2, e2), a2;
}
function m(e2) {
  const t2 = e2.map(y);
  return [t2.map((e3) => e3[0]), (n2 = t2.map((e3) => e3[1]), Array.prototype.concat.apply([], n2))];
  var n2;
}
var g = /* @__PURE__ */ new WeakMap();
function w(t2) {
  return Object.assign(t2, { [e]: true });
}
function y(e2) {
  for (const [t2, n2] of a)
    if (n2.canHandle(e2)) {
      const [r2, i2] = n2.serialize(e2);
      return [{ type: "HANDLER", name: t2, value: r2 }, i2];
    }
  return [{ type: "RAW", value: e2 }, g.get(e2) || []];
}
function E(e2) {
  switch (e2.type) {
    case "HANDLER":
      return a.get(e2.name).deserialize(e2.value);
    case "RAW":
      return e2.value;
  }
}
function v(e2, t2, n2) {
  return new Promise((r2) => {
    const i2 = new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
    e2.addEventListener("message", function t3(n3) {
      n3.data && n3.data.id && n3.data.id === i2 && (e2.removeEventListener("message", t3), r2(n3.data));
    }), e2.start && e2.start(), e2.postMessage(Object.assign({ id: i2 }, t2), n2);
  });
}
var b = class {
  constructor(e2, t2, n2, r2, i2) {
    this._name = e2, this._size = t2, this._path = n2, this._lastModified = r2, this._archiveRef = i2;
  }
  get name() {
    return this._name;
  }
  get size() {
    return this._size;
  }
  get lastModified() {
    return this._lastModified;
  }
  extract() {
    return this._archiveRef.extractSingleFile(this._path);
  }
};
function R(e2) {
  if (e2 instanceof File || e2 instanceof b || null === e2)
    return e2;
  const t2 = {};
  for (const n2 of Object.keys(e2))
    t2[n2] = R(e2[n2]);
  return t2;
}
function S(e2, t2 = "") {
  const n2 = [];
  for (const r2 of Object.keys(e2))
    e2[r2] instanceof File || e2[r2] instanceof b || null === e2[r2] ? n2.push({ file: e2[r2] || r2, path: t2 }) : n2.push(...S(e2[r2], `${t2}${r2}/`));
  return n2;
}
function A(e2, t2) {
  const n2 = t2.split("/");
  "" === n2[n2.length - 1] && n2.pop();
  let r2 = e2, i2 = null;
  for (const e3 of n2)
    r2[e3] = r2[e3] || {}, i2 = r2, r2 = r2[e3];
  return [i2, n2[n2.length - 1]];
}
var _ = class {
  constructor(e2, t2, n2) {
    this._content = {}, this._processed = 0, this.file = e2, this.client = t2, this.worker = n2;
  }
  open() {
    return this._content = {}, this._processed = 0, new Promise((e2, t2) => {
      this.client.open(this.file, w(() => {
        e2(this);
      }));
    });
  }
  async close() {
    var e2;
    null === (e2 = this.worker) || void 0 === e2 || e2.terminate(), this.worker = null, this.client = null, this.file = null;
  }
  async hasEncryptedData() {
    return await this.client.hasEncryptedData();
  }
  async usePassword(e2) {
    await this.client.usePassword(e2);
  }
  async setLocale(e2) {
    await this.client.setLocale(e2);
  }
  async getFilesObject() {
    if (this._processed > 0)
      return Promise.resolve().then(() => this._content);
    return (await this.client.listFiles()).forEach((e2) => {
      const [t2, n2] = A(this._content, e2.path);
      "FILE" === e2.type && (t2[n2] = new b(e2.fileName, e2.size, e2.path, e2.lastModified, this));
    }), this._processed = 1, R(this._content);
  }
  getFilesArray() {
    return this.getFilesObject().then((e2) => S(e2));
  }
  async extractSingleFile(e2) {
    if (null === this.worker)
      throw new Error("Archive already closed");
    const t2 = await this.client.extractSingleFile(e2);
    return new File([t2.fileData], t2.fileName, { type: "application/octet-stream", lastModified: t2.lastModified / 1e6 });
  }
  async extractFiles(e2 = void 0) {
    var t2;
    if (this._processed > 1)
      return Promise.resolve().then(() => this._content);
    return (await this.client.extractFiles()).forEach((t3) => {
      const [n2, r2] = A(this._content, t3.path);
      "FILE" === t3.type && (n2[r2] = new File([t3.fileData], t3.fileName, { type: "application/octet-stream" }), void 0 !== e2 && setTimeout(e2.bind(null, { file: n2[r2], path: t3.path })));
    }), this._processed = 2, null === (t2 = this.worker) || void 0 === t2 || t2.terminate(), R(this._content);
  }
};
var P;
var k;
!function(e2) {
  e2.SEVEN_ZIP = "7zip", e2.AR = "ar", e2.ARBSD = "arbsd", e2.ARGNU = "argnu", e2.ARSVR4 = "arsvr4", e2.BIN = "bin", e2.BSDTAR = "bsdtar", e2.CD9660 = "cd9660", e2.CPIO = "cpio", e2.GNUTAR = "gnutar", e2.ISO = "iso", e2.ISO9660 = "iso9660", e2.MTREE = "mtree", e2.MTREE_CLASSIC = "mtree-classic", e2.NEWC = "newc", e2.ODC = "odc", e2.OLDTAR = "oldtar", e2.PAX = "pax", e2.PAXR = "paxr", e2.POSIX = "posix", e2.PWB = "pwb", e2.RAW = "raw", e2.RPAX = "rpax", e2.SHAR = "shar", e2.SHARDUMP = "shardump", e2.USTAR = "ustar", e2.V7TAR = "v7tar", e2.V7 = "v7", e2.WARC = "warc", e2.XAR = "xar", e2.ZIP = "zip";
}(P || (P = {})), function(e2) {
  e2.B64ENCODE = "b64encode", e2.BZIP2 = "bzip2", e2.COMPRESS = "compress", e2.GRZIP = "grzip", e2.GZIP = "gzip", e2.LRZIP = "lrzip", e2.LZ4 = "lz4", e2.LZIP = "lzip", e2.LZMA = "lzma", e2.LZOP = "lzop", e2.UUENCODE = "uuencode", e2.XZ = "xz", e2.ZSTD = "zstd", e2.NONE = "none";
}(k || (k = {}));
var O = class _O {
  static init(e2 = null) {
    return _O._options = e2 || {}, _O._options;
  }
  static async open(e2) {
    const t2 = _O.getWorker(_O._options), n2 = await _O.getClient(t2, _O._options), r2 = new _(e2, n2, t2);
    return await r2.open();
  }
  static async write({ files: e2, outputFileName: t2, compression: n2, format: r2, passphrase: i2 = null }) {
    const s2 = _O.getWorker(_O._options), a2 = await _O.getClient(s2, _O._options), o2 = await a2.writeArchive(e2, n2, r2, i2);
    return s2.terminate(), new File([o2], t2, { type: "application/octet-stream" });
  }
  static getWorker(e2) {
    return e2.getWorker ? e2.getWorker() : new Worker(e2.workerUrl || new URL("./worker-bundle.js", import.meta.url), { type: "module" });
  }
  static async getClient(e2, t2) {
    var n2;
    const r2 = (null === (n2 = t2.createClient) || void 0 === n2 ? void 0 : n2.call(t2, e2)) || l(e2);
    let { promise: i2, resolve: s2 } = Promise.withResolvers();
    const a2 = await new r2(w(() => {
      s2();
    }));
    return await i2, a2;
  }
};
O._options = {};

// index.js
window.Archive = O;
document.getElementById("file").addEventListener("change", async (e2) => {
  let obj = null;
  try {
    const file = e2.currentTarget.files[0];
    const archive = await O.open(file);
    console.log(await archive.getFilesObject());
    obj = await archive.extractFiles();
    console.log(await archive.getFilesObject());
  } catch (err) {
    console.error(err);
  }
});
/*! Bundled license information:

libarchive.js/dist/libarchive.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: Apache-2.0
   *)
*/
