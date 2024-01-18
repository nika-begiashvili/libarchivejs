import { CompressedFile } from "./compressed-file";

export function cloneContent(obj: any) {
  if (obj instanceof File || obj instanceof CompressedFile || obj === null)
    return obj;
  const o: any = {};
  for (const prop of Object.keys(obj)) {
    o[prop] = cloneContent(obj[prop]);
  }
  return o;
}

export function objectToArray(obj: any, path: string = "") {
  const files: any[] = [];
  for (const key of Object.keys(obj)) {
    if (
      obj[key] instanceof File ||
      obj[key] instanceof CompressedFile ||
      obj[key] === null
    ) {
      files.push({
        file: obj[key] || key,
        path: path,
      });
    } else {
      files.push(...objectToArray(obj[key], `${path}${key}/`));
    }
  }
  return files;
}

export function getObjectPropReference(obj: any, path: string) {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "") parts.pop();
  let cur = obj,
    prev = null;
  for (const part of parts) {
    cur[part] = cur[part] || {};
    prev = cur;
    cur = cur[part];
  }
  return [prev, parts[parts.length - 1]];
}
