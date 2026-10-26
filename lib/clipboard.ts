// Windows copies from Excel/Word/OneNote (and copying an image off a web
// page) often put a bitmap on the clipboard alongside text/plain or
// text/html. When text is present, treat the paste as text — otherwise a
// user pasting a sentence would get a picture instead.
export function shouldPasteAsImage({
  hasImage,
  hasText,
}: {
  hasImage: boolean;
  hasText: boolean;
}): boolean {
  return hasImage && !hasText;
}
