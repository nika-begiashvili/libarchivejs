function hex(buffer) {
  const hexCodes = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i);
    const stringValue = value.toString(16);
    const padding = "00000000";
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }
  return hexCodes.join("");
}

export async function getChecksum(file) {
  return hex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

export async function fileChecksums(obj) {
  for (const [key, val] of Object.entries(obj)) {
    obj[key] =
      val instanceof File ? await getChecksum(val) : await fileChecksums(val);
  }
  return obj;
}
