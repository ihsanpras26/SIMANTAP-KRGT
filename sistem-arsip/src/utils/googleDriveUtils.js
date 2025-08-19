/**
 * Google Drive Link Utilities
 * Fungsi untuk mengekstrak file ID dan menghasilkan berbagai format link Google Drive
 */

/**
 * Mengekstrak file ID dari berbagai format Google Drive link
 * @param {string} link - Google Drive link dalam berbagai format
 * @returns {string|null} - File ID atau null jika tidak valid
 */
export const extractGoogleDriveFileId = (link) => {
  if (!link || typeof link !== 'string') {
    return null;
  }

  // Hapus whitespace
  const cleanLink = link.trim();

  // Pattern untuk berbagai format Google Drive link
  const patterns = [
    // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    
    // Format: https://drive.google.com/open?id=FILE_ID
    /[?&]id=([a-zA-Z0-9_-]+)/,
    
    // Format: https://docs.google.com/document/d/FILE_ID/edit
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    
    // Format: https://docs.google.com/spreadsheets/d/FILE_ID/edit
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    
    // Format: https://docs.google.com/presentation/d/FILE_ID/edit
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    
    // Format: https://drive.google.com/uc?id=FILE_ID
    /\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    
    // Format langsung file ID (jika user hanya input file ID)
    /^([a-zA-Z0-9_-]{25,})$/
  ];

  for (const pattern of patterns) {
    const match = cleanLink.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Menghasilkan berbagai format link Google Drive dari file ID
 * @param {string} fileId - Google Drive file ID
 * @returns {object} - Object berisi berbagai format link
 */
export const generateGoogleDriveLinks = (fileId) => {
  if (!fileId) {
    return {
      viewLink: null,
      downloadLink: null,
      embedLink: null,
      directLink: null,
      previewLink: null
    };
  }

  return {
    // Link untuk melihat file di Google Drive
    viewLink: `https://drive.google.com/file/d/${fileId}/view`,
    
    // Link untuk download langsung
    downloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
    
    // Link untuk embed (iframe)
    embedLink: `https://drive.google.com/file/d/${fileId}/preview`,
    
    // Link direct access
    directLink: `https://drive.google.com/uc?id=${fileId}`,
    
    // Link untuk preview thumbnail
    previewLink: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`
  };
};

/**
 * Memvalidasi apakah link Google Drive valid
 * @param {string} link - Google Drive link
 * @returns {boolean} - true jika valid, false jika tidak
 */
export const isValidGoogleDriveLink = (link) => {
  const fileId = extractGoogleDriveFileId(link);
  return fileId !== null;
};

/**
 * Mengkonversi link Google Drive ke format view yang konsisten
 * @param {string} link - Google Drive link dalam format apapun
 * @returns {string|null} - Link dalam format view atau null jika tidak valid
 */
export const normalizeGoogleDriveLink = (link) => {
  const fileId = extractGoogleDriveFileId(link);
  if (!fileId) {
    return null;
  }
  
  return generateGoogleDriveLinks(fileId).viewLink;
};

/**
 * Mengekstrak informasi lengkap dari Google Drive link
 * @param {string} link - Google Drive link
 * @returns {object} - Object berisi file ID dan berbagai format link
 */
export const parseGoogleDriveLink = (link) => {
  const fileId = extractGoogleDriveFileId(link);
  
  if (!fileId) {
    return {
      isValid: false,
      fileId: null,
      links: {
        viewLink: null,
        downloadLink: null,
        embedLink: null,
        directLink: null,
        previewLink: null
      }
    };
  }

  return {
    isValid: true,
    fileId: fileId,
    links: generateGoogleDriveLinks(fileId)
  };
};

/**
 * Menghasilkan link download PDF dari Google Drive link
 * @param {string} link - Google Drive link
 * @returns {string|null} - Link download PDF atau null jika tidak valid
 */
export const getGoogleDrivePdfDownloadLink = (link) => {
  const fileId = extractGoogleDriveFileId(link);
  if (!fileId) {
    return null;
  }
  
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Contoh penggunaan dan testing
 */
export const testGoogleDriveUtils = () => {
  const testLinks = [
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing',
    'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  ];

  // Testing function for development - logs removed for production
  return testLinks.map((link, index) => {
    const result = parseGoogleDriveLink(link);
    return {
      test: index + 1,
      input: link,
      fileId: result.fileId,
      isValid: result.isValid,
      viewLink: result.links.viewLink
    };
  });
};