/**
 * Deploy this at script.google.com to load ads from a Google Drive folder.
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
 *
 * Routes:
 * - ?folderId=...  → JSON list of image files in folder
 * - ?imageId=...   → Serves the image (bypasses Drive embedding restrictions)
 */
function doGet(e) {
  const params = e?.parameter || {};
  const imageId = params.imageId || params.id;
  const folderId = params.folderId || params.folder;

  if (imageId) {
    return serveImage(imageId);
  }
  if (folderId) {
    return listFolder(folderId);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'imageId or folderId required' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function serveImage(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const mime = file.getMimeType() || 'image/png';
  return ContentService.createBlobOutput(blob).setMimeType(mime);
}

function listFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const list = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType().indexOf('image/') === 0) {
      list.push({ id: file.getId(), name: file.getName() });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(list))
    .setMimeType(ContentService.MimeType.JSON);
}
