/**
 * Ad Display Config
 *
 * For GitHub Pages, the simplest setup is:
 * - Leave localImages empty
 * - Put your Google Drive FILE IDs in driveFiles
 *   (from the JSON you saw at the Apps Script URL)
 */

window.AD_CONFIG = {
  defaultDuration: 15,
  gymInterval: 5,
  gymDuration: 15,
  gymPage: 'gym-schedule.html',

  // Use Drive-backed images (no local ads here)
  localImages: [],

  // For GitHub Pages, we don't call Apps Script (avoid CORS)
  driveFolderId: '',
  driveFolderScriptUrl: '',

  // TODO: paste your Drive file IDs here, e.g.:
  // driveFiles: ['ID_1', 'ID_2', 'ID_3'],
  driveFiles: [],
};

