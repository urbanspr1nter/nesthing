export const pako = require("pako");

function getSaveStateFilename(romName: string) {
  return `${romName}-save-state-${new Date(Date.now()).toISOString()}.dat`;
}

export function saveStateData(data: string, romName: string) {
  if (!data) {
    return;
  }

  const filename = getSaveStateFilename(romName);
  const compressedData = pako.deflate(data, { to: "string" });
  const blob = new Blob([compressedData]);
  const e = document.createEvent("MouseEvents");
  const a = document.createElement("a");

  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ["text/plain", a.download, a.href].join(":");
  e.initMouseEvent(
    "click",
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  a.dispatchEvent(e);
}
