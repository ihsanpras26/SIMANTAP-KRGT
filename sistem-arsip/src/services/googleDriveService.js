/**
 * Google Drive Integration Service
 * Handles file upload, preview, and management with Google Drive API
 */

class GoogleDriveService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    this.scopes = 'https://www.googleapis.com/auth/drive.file';
    this.isInitialized = false;
    this.isSignedIn = false;
  }

  /**
   * Initialize Google Drive API
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      await new Promise((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      await window.gapi.client.init({
        apiKey: this.apiKey,
        clientId: this.clientId,
        discoveryDocs: [this.discoveryDoc],
        scope: this.scopes
      });

      this.authInstance = window.gapi.auth2.getAuthInstance();
      this.isSignedIn = this.authInstance.isSignedIn.get();
      this.isInitialized = true;

      console.log('Google Drive API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  /**
   * Sign in to Google Drive
   */
  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isSignedIn) {
      try {
        await this.authInstance.signIn();
        this.isSignedIn = true;
        console.log('Successfully signed in to Google Drive');
      } catch (error) {
        console.error('Failed to sign in to Google Drive:', error);
        throw error;
      }
    }
  }

  /**
   * Upload file to Google Drive
   * @param {File} file - File to upload
   * @param {string} fileName - Custom file name
   * @param {string} folderId - Google Drive folder ID (optional)
   * @param {Function} onProgress - Progress callback
   */
  async uploadFile(file, fileName, folderId = null, onProgress = null) {
    await this.signIn();

    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
      
      // Set file permissions to be viewable by anyone with the link
      await this.setFilePermissions(result.id);
      
      return {
        id: result.id,
        name: result.name,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`,
        webContentLink: `https://drive.google.com/uc?id=${result.id}`,
        downloadLink: `https://drive.google.com/uc?export=download&id=${result.id}`
      };
    } catch (error) {
      console.error('Failed to upload file to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Set file permissions to be viewable by anyone with the link
   * @param {string} fileId - Google Drive file ID
   */
  async setFilePermissions(fileId) {
    try {
      await window.gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (error) {
      console.warn('Failed to set file permissions:', error);
    }
  }

  /**
   * Generate file name based on document info
   * @param {string} perihal - Document subject
   * @param {string} tanggalSurat - Document date
   * @param {string} originalFileName - Original file name
   */
  generateFileName(perihal, tanggalSurat, originalFileName) {
    const date = new Date(tanggalSurat).toISOString().split('T')[0];
    const cleanPerihal = perihal.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const extension = originalFileName.split('.').pop();
    return `${cleanPerihal}_${date}.${extension}`;
  }

  /**
   * Delete file from Google Drive
   * @param {string} fileId - Google Drive file ID
   */
  async deleteFile(fileId) {
    await this.signIn();

    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId
      });
      console.log('File deleted successfully from Google Drive');
    } catch (error) {
      console.error('Failed to delete file from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param {string} fileId - Google Drive file ID
   */
  async getFileMetadata(fileId) {
    await this.signIn();

    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink'
      });
      return response.result;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  /**
   * Check if user is signed in
   */
  isUserSignedIn() {
    return this.isSignedIn && this.authInstance && this.authInstance.isSignedIn.get();
  }

  /**
   * Sign out from Google Drive
   */
  async signOut() {
    if (this.authInstance) {
      await this.authInstance.signOut();
      this.isSignedIn = false;
      console.log('Signed out from Google Drive');
    }
  }
}

// Export singleton instance
export default new GoogleDriveService();