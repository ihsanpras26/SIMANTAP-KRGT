# Google Drive Integration Setup

## Overview
SIMANTEP now supports direct integration with Google Drive for file uploads. Files are automatically named based on the archive information (subject_date) and stored in your Google Drive with proper permissions.

## Features
- 🔄 Direct upload to Google Drive
- 📝 Automatic file naming (perihal_tanggal)
- 👁️ File preview in the web interface
- 🔗 Direct links to view and download files
- 🗂️ Organized storage in designated Google Drive folder
- 🔒 Proper file permissions management

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create Credentials

#### API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key for later use
4. (Optional) Restrict the API key to Google Drive API only

#### OAuth 2.0 Client ID
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as the application type
5. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
6. Copy the Client ID for later use

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Fill in the required information:
   - App name: "SIMANTEP"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users (for development)

### 4. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Google Drive credentials in `.env`:
   ```env
   VITE_GOOGLE_API_KEY=your_google_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
   VITE_GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
   ```

### 5. Create Google Drive Folder (Optional)

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for SIMANTEP files
3. Open the folder and copy the folder ID from the URL:
   - URL: `https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL`
   - Folder ID: `1ABC123DEF456GHI789JKL`
4. Add this ID to your `.env` file

## Usage

### For Users
1. When adding a new archive, go to step 2 (File Upload)
2. Click "Sign in to Google Drive" if not already signed in
3. Drag and drop your file or click to select
4. The file will be automatically uploaded with the name format: `perihal_tanggal`
5. You can preview, download, or open the file directly in Google Drive

### File Naming Convention
- Format: `{perihal}_{tanggal_surat}`
- Example: `Surat_Undangan_Rapat_2024-01-15.pdf`
- Special characters are replaced with underscores
- Spaces are replaced with underscores

## Troubleshooting

### Common Issues

1. **"Sign in failed" error**
   - Check if your OAuth Client ID is correct
   - Verify that your domain is added to authorized origins
   - Make sure OAuth consent screen is properly configured

2. **"Upload failed" error**
   - Check if Google Drive API is enabled
   - Verify API key is correct and not restricted
   - Check file size limits (Google Drive: 5TB, but we recommend < 100MB)

3. **"Permission denied" error**
   - Make sure the OAuth scope includes `https://www.googleapis.com/auth/drive.file`
   - Check if the user has granted necessary permissions

### Development Tips

1. Use browser developer tools to check for console errors
2. Test with different file types and sizes
3. Verify that files appear in the correct Google Drive folder
4. Check that file permissions are set correctly (viewable by anyone with the link)

## Security Considerations

- Files are uploaded with "anyone with the link can view" permissions
- Only the `drive.file` scope is used (limited access)
- API keys and client IDs should be kept secure
- Consider implementing additional access controls for production use

## Fallback Behavior

If Google Drive integration fails or is not configured:
- The system will fall back to traditional Supabase storage
- Users can still upload files using the legacy upload method
- No data loss occurs during the fallback process