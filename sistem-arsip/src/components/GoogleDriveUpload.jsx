import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Download, 
  Trash2, 
  Cloud, 
  FileText,
  ExternalLink,
  Loader
} from 'lucide-react';
import { Button } from './ui/Button';
import googleDriveService from '../services/googleDriveService';
import toast from 'react-hot-toast';

const GoogleDriveUpload = ({ 
  onFileUploaded, 
  onFileRemoved, 
  existingFile = null,
  perihal = '',
  tanggalSurat = '',
  disabled = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(existingFile);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    checkSignInStatus();
  }, []);

  const checkSignInStatus = async () => {
    try {
      setIsInitializing(true);
      await googleDriveService.initialize();
      setIsSignedIn(googleDriveService.isUserSignedIn());
    } catch (error) {
      console.error('Failed to check Google Drive sign-in status:', error);
      toast.error('Gagal menginisialisasi Google Drive');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsInitializing(true);
      await googleDriveService.signIn();
      setIsSignedIn(true);
      toast.success('Berhasil masuk ke Google Drive');
    } catch (error) {
      console.error('Failed to sign in to Google Drive:', error);
      toast.error('Gagal masuk ke Google Drive');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!isSignedIn) {
      toast.error('Silakan masuk ke Google Drive terlebih dahulu');
      return;
    }

    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan PDF, DOCX, PNG, JPG, atau GIF');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate custom file name
      const customFileName = googleDriveService.generateFileName(
        perihal || 'Dokumen_Arsip',
        tanggalSurat || new Date().toISOString(),
        file.name
      );

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await googleDriveService.uploadFile(
        file,
        customFileName,
        null, // No specific folder
        (progress) => setUploadProgress(progress)
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileData = {
        id: result.id,
        name: result.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
        downloadLink: result.downloadLink,
        uploadedAt: new Date().toISOString()
      };

      setUploadedFile(fileData);
      onFileUploaded(fileData);
      toast.success('File berhasil diupload ke Google Drive!');

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Gagal mengupload file ke Google Drive');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && isSignedIn) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || !isSignedIn) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveFile = async () => {
    if (uploadedFile && uploadedFile.id) {
      try {
        await googleDriveService.deleteFile(uploadedFile.id);
        toast.success('File berhasil dihapus dari Google Drive');
      } catch (error) {
        console.error('Failed to delete file:', error);
        toast.error('Gagal menghapus file dari Google Drive');
      }
    }
    
    setUploadedFile(null);
    onFileRemoved();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-gray-600">Menginisialisasi Google Drive...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Integrasi Google Drive
          </h3>
          <p className="text-gray-600 mb-4">
            Masuk ke Google Drive untuk mengupload dan menyimpan file arsip secara otomatis
          </p>
          <Button 
            onClick={handleSignIn}
            disabled={isInitializing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Masuk ke Google Drive
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!uploadedFile && (
        <motion.div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            isDragOver 
              ? 'border-primary-400 bg-primary-50 scale-105' 
              : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={!disabled ? { scale: 1.02 } : {}}
        >
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary-100 rounded-full">
                  <Upload className="w-8 h-8 text-primary-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Mengupload ke Google Drive...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <motion.div 
                      className="bg-primary-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary-100 rounded-full">
                  <Cloud className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragOver ? 'Lepaskan file di sini' : 'Upload ke Google Drive'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag & drop file atau klik untuk pilih
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOCX, PNG, JPG, dll. (Maks. 10MB)
                  </p>
                </div>
                <label className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium cursor-pointer transition-colors duration-200">
                  <Upload className="w-5 h-5 mr-2" />
                  Pilih File
                  <input 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                    disabled={disabled}
                  />
                </label>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Uploaded File Display */}
      <AnimatePresence>
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-medium text-green-900 truncate">
                    {uploadedFile.name}
                  </h4>
                </div>
                
                <div className="text-xs text-green-700 space-y-1">
                  <p>Ukuran: {formatFileSize(uploadedFile.size)}</p>
                  <p>Diupload: {new Date(uploadedFile.uploadedAt).toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(uploadedFile.webViewLink, '_blank')}
                    className="text-xs h-7 px-2"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(uploadedFile.downloadLink, '_blank')}
                    className="text-xs h-7 px-2"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(uploadedFile.webViewLink, '_blank')}
                    className="text-xs h-7 px-2"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Buka di Drive
                  </Button>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Status */}
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Cloud className="w-3 h-3" />
          <span>Terhubung dengan Google Drive</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => googleDriveService.signOut().then(() => setIsSignedIn(false))}
          className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
        >
          Keluar
        </Button>
      </div>
    </div>
  );
};

export default GoogleDriveUpload;