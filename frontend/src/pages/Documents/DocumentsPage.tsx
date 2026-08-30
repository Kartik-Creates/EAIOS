import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Trash2,
  File,
  FileSpreadsheet,
  FileImage,
  Presentation,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import './DocumentsPage.css';

interface UploadedFile {
  id: string;
  file: File;
  status: 'ready' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
}

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx', '.ppt', '.pptx'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toUpperCase();
};

const getFileIcon = (_type: string, extension: string) => {
  const ext = extension.toLowerCase();
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet size={18} className="file-icon file-icon-spreadsheet" />;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return <Presentation size={18} className="file-icon file-icon-presentation" />;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return <FileImage size={18} className="file-icon file-icon-image" />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileText size={18} className="file-icon file-icon-document" />;
  }
  return <File size={18} className="file-icon file-icon-default" />;
};

const getStatusBadge = (status: UploadedFile['status']) => {
  switch (status) {
    case 'ready':
      return <span className="file-status file-status-ready">Ready</span>;
    case 'uploading':
      return <span className="file-status file-status-uploading">Uploading...</span>;
    case 'uploaded':
      return <span className="file-status file-status-uploaded"><CheckCircle2 size={12} /> Uploaded</span>;
    case 'failed':
      return <span className="file-status file-status-failed"><AlertCircle size={12} /> Failed</span>;
    default:
      return null;
  }
};

export const DocumentsPage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES] ||
      ACCEPTED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      return { valid: false, error: `Unsupported file type: ${extension}` };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` };
    }

    return { valid: true };
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        return;
      }

      const isDuplicate = files.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (isDuplicate) {
        toast.error(`${file.name} is already added.`);
        return;
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'ready',
        progress: 0,
      });
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added successfully.`);
    }
  }, [files, validateFile]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <motion.div
      className="documents-page"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="documents-header" variants={staggerItem}>
        <h1 className="documents-title">Documents</h1>
        <p className="documents-subtitle">
          Upload and manage your enterprise documents for AI-powered search and analysis.
        </p>
      </motion.div>

      <motion.div
        className={cn('upload-dropzone', isDragging && 'upload-dropzone-dragging')}
        variants={staggerItem}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-dropzone-icon">
          <Upload size={40} />
        </div>
        <h3 className="upload-dropzone-title">Add your documents</h3>
        <p className="upload-dropzone-text">
          Drag & drop files here or
        </p>
        <Button variant="primary" size="md" onClick={handleBrowseClick}>
          Browse Files
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileSelect}
          className="upload-hidden-input"
        />
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="documents-list-section"
            variants={staggerItem}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="documents-list-title">Uploaded Documents</h2>
            <div className="documents-table-wrapper">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <motion.tr
                      key={file.id}
                      className="documents-table-row"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="documents-table-name">
                        {getFileIcon(file.file.type, getFileExtension(file.file.name))}
                        <span className="documents-table-filename">{file.file.name}</span>
                      </td>
                      <td>{getFileExtension(file.file.name)}</td>
                      <td>{formatFileSize(file.file.size)}</td>
                      <td>{getStatusBadge(file.status)}</td>
                      <td>
                        <button
                          type="button"
                          className="documents-table-remove"
                          onClick={() => removeFile(file.id)}
                          aria-label={`Remove ${file.file.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DocumentsPage;
