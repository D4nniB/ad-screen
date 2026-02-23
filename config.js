/**
 * Ad Display Config – Google Drive Folder
 *
 * Your folder: https://drive.google.com/drive/folders/1ooyY1o7aLIL8RrS7wKjYCCmBuZEce3sq
 *
 * Option A – Auto-load from folder (recommended):
 * 1. Go to script.google.com → New project
 * 2. Paste the code from Google-Apps-Script.gs
 * 3. Deploy → New deployment → Web app → "Anyone" can access
 * 4. Copy the Web app URL and paste it below as driveFolderScriptUrl
 *
 * Option B – Manual file IDs:
 * Add each image's file ID to driveFiles (get from Share → Copy link)
 */

window.AD_CONFIG = {
  defaultDuration: 15,
  driveFolderId: '1ooyY1o7aLIL8RrS7wKjYCCmBuZEce3sq',
  driveFolderScriptUrl: 'https://script.google.com/macros/s/AKfycbzf8S7rHQPcm2dvh49J5xOTc08RUd1dO_HJXf1wJ6ULx_uC4Pov4kYUFjeUjFxhCrse/exec', // Paste your deployed Apps Script URL here for auto-load
  driveFiles: [], // Fallback: add file IDs manually if not using script
};
