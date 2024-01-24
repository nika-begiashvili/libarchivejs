import { Archive } from "libarchive.js/dist/libarchive.js";

window.Archive = Archive;

document.getElementById("file").addEventListener("change", async (e) => {
  let obj = null;
  try {
    const file = e.currentTarget.files[0];
    const archive = await Archive.open(file);
    console.log(await archive.getFilesObject());
    obj = await archive.extractFiles();
    console.log(await archive.getFilesObject());
  } catch (err) {
    console.error(err);
  }
});
