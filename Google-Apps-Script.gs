/**
 * Deploy this at script.google.com to load ads from a Google Drive folder.
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
 *
 * Routes:
 * - ?folderId=...   → { main: [...], gym: [...] } (main folder images + "gym" subfolder items)
 * - ?imageId=...    → Image as base64 JSON
 * - ?contentId=... → Raw file content (for HTML in gym folder)
 */
function doGet(e) {
  const params = e?.parameter || {};
  const imageId = params.imageId || params.id;
  const contentId = params.contentId || params.content;
  const folderId = params.folderId || params.folder;

  if (imageId) {
    return serveImage(imageId);
  }
  if (contentId) {
    return serveFileContent(contentId);
  }
  if (folderId) {
    return listFolder(folderId);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'imageId, contentId or folderId required' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function serveFileContent(fileId) {
  const file = DriveApp.getFileById(fileId);
  const content = file.getBlob().getDataAsString('UTF-8');
  return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.HTML);
}

function serveImage(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const mime = file.getMimeType() || 'image/png';
  const base64 = Utilities.base64Encode(blob.getBytes());
  const json = JSON.stringify({ mime: mime, data: base64 });
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function listFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const main = [];
  const gym = [];

  // Main folder: only direct files (images), not subfolders
  const mainFiles = folder.getFiles();
  while (mainFiles.hasNext()) {
    const file = mainFiles.next();
    if (file.getMimeType().indexOf('image/') === 0) {
      main.push({ id: file.getId(), name: file.getName(), mimeType: file.getMimeType() });
    }
  }

  // Subfolder named "gym": images and HTML
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    if (sub.getName().toLowerCase() === 'gym') {
      const gymFiles = sub.getFiles();
      while (gymFiles.hasNext()) {
        const file = gymFiles.next();
        const mime = file.getMimeType();
        if (mime.indexOf('image/') === 0 || mime === 'text/html' || mime.indexOf('html') !== -1) {
          gym.push({ id: file.getId(), name: file.getName(), mimeType: mime });
        }
      }
      break;
    }
  }

  const result = { main: main, gym: gym };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
