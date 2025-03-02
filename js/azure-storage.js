// Import the BlobServiceClient from esm.sh, which bundles dependencies for the browser
import { BlobServiceClient } from "https://esm.sh/@azure/storage-blob@12.26.0";

// Immediately-invoked async function to scope our code
(async () => {
  // === 1. CONFIGURE YOUR ACCOUNT, TOKEN, AND CONTAINER NAME ===
  const accountName = 'prabinappstorage';
  // Make sure this SAS token has "List" (l) and "Read" (r) permissions
  const sasToken = '?sv=2022-11-02&ss=bfqt&srt=co&sp=rwdlacupiytfx&se=2025-03-02T13:55:42Z&st=2025-03-02T05:55:42Z&spr=https,http&sig=BjYxhE1k8mwi4kbpMN359pgAueI8S13%2Ba%2FdP0%2FBPa%2BY%3D';
  const containerName = 'voice-edit';

  // === 2. SET UP CLIENTS AND DOM ELEMENTS ===
  // Build the Blob Service Client URL with the SAS token
  const blobServiceClientUrl = `https://${accountName}.blob.core.windows.net${sasToken}`;
  // Create the BlobServiceClient
  const blobServiceClient = new BlobServiceClient(blobServiceClientUrl);
  // Get a reference to the container client
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Grab our DOM elements
  const fileInput = document.getElementById('fileInput');
  const uploadButton = document.getElementById('uploadButton');
  const refreshButton = document.getElementById('refreshButton');
  const statusDiv = document.getElementById('status');
  const fileListDiv = document.getElementById('fileList');

  // === 3. UPLOAD A SELECTED FILE TO BLOB STORAGE ===
  async function uploadFile(file) {
    try {
      const blobName = file.name;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      statusDiv.textContent = 'Uploading...';
      const uploadResponse = await blockBlobClient.uploadBrowserData(file);
      statusDiv.innerHTML = `Upload succeeded: ${JSON.stringify(uploadResponse)}`;

      // After upload, refresh the list
      await listBlobs();
    } catch (error) {
      statusDiv.innerHTML = `Error: ${error.message}`;
    }
  }

  // === 4. LIST ALL BLOBS IN THE CONTAINER ===
  async function listBlobs() {
    fileListDiv.innerHTML = ''; // Clear current list

    try {
      // We need "List" permission in SAS for this to work
      for await (const blob of containerClient.listBlobsFlat()) {
        // Create a clickable element for each blob
        const blobEl = document.createElement('div');
        blobEl.textContent = blob.name;
        blobEl.style.cursor = 'pointer';

        // On click, download the blob
        blobEl.addEventListener('click', () => {
          downloadBlob(blob.name);
        });

        fileListDiv.appendChild(blobEl);
      }
      statusDiv.textContent = 'List refreshed.';
    } catch (error) {
      statusDiv.textContent = `List error: ${error.message}`;
    }
  }

  // === 5. DOWNLOAD A BLOB ON CLICK ===
  async function downloadBlob(blobName) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      // We need "Read" permission in SAS for this to work
      const downloadResponse = await blockBlobClient.download(0);
      const downloadedBlob = await downloadResponse.blobBody; // Blob in the browser

      // Create a temporary link to force a download
      const blobUrl = URL.createObjectURL(downloadedBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = blobName; // Suggest the original file name
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      statusDiv.textContent = `Download error: ${error.message}`;
    }
  }

  // === 6. EVENT LISTENERS ===
  // Upload the selected file
  uploadButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
      statusDiv.textContent = 'Please select a file first.';
      return;
    }
    uploadFile(file);
  });

  // Refresh the list of blobs
  refreshButton.addEventListener('click', listBlobs);

  // === 7. INITIALIZE ===
  // Optionally, load the list on page load
  listBlobs();
})();
