import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
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
  Loader2,
  Database,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { documentService, type DocumentItem } from '@/services/documentService';
import toast from 'react-hot-toast';
import './DocumentsPage.css';

interface DisplayFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
  status: 'ready' | 'uploading' | 'uploaded' | 'failed';
  chunkCount?: number;
  createdAt?: string | null;
  restrictedRole?: string | null;
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

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx', '.ppt', '.pptx', '.md', '.json'];

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

const getFileIcon = (extension: string) => {
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
  if (['doc', 'docx', 'pdf', 'txt', 'md'].includes(ext)) {
    return <FileText size={18} className="file-icon file-icon-document" />;
  }
  return <File size={18} className="file-icon file-icon-default" />;
};

const getStatusBadge = (status: DisplayFile['status']) => {
  switch (status) {
    case 'ready':
    case 'uploaded':
      return (
        <span className="file-status file-status-uploaded">
          <CheckCircle2 size={12} /> Ready
        </span>
      );
    case 'uploading':
      return (
        <span className="file-status file-status-uploading">
          <Loader2 size={12} className="animate-spin" /> Indexing...
        </span>
      );
    case 'failed':
      return (
        <span className="file-status file-status-failed">
          <AlertCircle size={12} /> Failed
        </span>
      );
    default:
      return null;
  }
};

export const DocumentsPage = () => {
  const [files, setFiles] = useState<DisplayFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Load existing indexed documents from backend
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs: DocumentItem[] = await documentService.getDocuments();
      const mapped: DisplayFile[] = docs.map((doc) => ({
        id: doc.id,
        name: doc.title,
        status: 'ready',
        chunkCount: doc.chunk_count,
        createdAt: doc.created_at,
        restrictedRole: doc.restricted_role,
      }));
      setFiles(mapped);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      toast.error(err.response?.data?.detail || 'Failed to load documents from knowledge base.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType =
      ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES] ||
      ACCEPTED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      return { valid: false, error: `Unsupported file type: ${extension}` };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` };
    }

    return { valid: true };
  }, []);

  // Upload a single file to backend and update state
  const uploadSingleFile = useCallback(async (file: File, tempId: string) => {
    try {
      const uploadedDoc = await documentService.uploadDocument(file);
      setFiles((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                id: uploadedDoc.id,
                name: uploadedDoc.title,
                size: file.size,
                status: 'ready',
                chunkCount: uploadedDoc.chunk_count,
                createdAt: uploadedDoc.created_at,
                restrictedRole: uploadedDoc.restricted_role,
              }
            : item
        )
      );
      toast.success(`"${file.name}" indexed and ready for AI retrieval!`);
    } catch (err: any) {
      console.error(`Upload error for ${file.name}:`, err);
      setFiles((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, status: 'failed' } : item))
      );
      const errMsg = err.response?.data?.detail || err.message || 'Upload and indexing failed.';
      toast.error(`${file.name}: ${errMsg}`);
    }
  }, []);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const toUpload: { file: File; tempId: string }[] = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          return;
        }

        const isDuplicate = files.some(
          (f) => f.name.toLowerCase() === file.name.toLowerCase() && f.status !== 'failed'
        );
        if (isDuplicate) {
          toast.error(`"${file.name}" is already in your knowledge base.`);
          return;
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        toUpload.push({ file, tempId });
      });

      if (toUpload.length === 0) return;

      // Add optimistic entries with status 'uploading'
      const newEntries: DisplayFile[] = toUpload.map(({ file, tempId }) => ({
        id: tempId,
        name: file.name,
        size: file.size,
        status: 'uploading',
      }));

      setFiles((prev) => [...newEntries, ...prev]);

      // Trigger actual uploads concurrently
      toUpload.forEach(({ file, tempId }) => {
        uploadSingleFile(file, tempId);
      });
    },
    [files, validateFile, uploadSingleFile]
  );

  const removeFile = useCallback(
    async (id: string, name: string) => {
      // If it's a temporary upload that failed or is uploading, just remove locally
      if (id.startsWith('temp-')) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        return;
      }

      setDeletingIds((prev) => new Set(prev).add(id));
      try {
        await documentService.deleteDocument(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
        toast.success(`"${name}" removed from knowledge base.`);
      } catch (err: any) {
        console.error('Failed to delete document:', err);
        toast.error(err.response?.data?.detail || 'Failed to remove document.');
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

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

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles]
  );

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="documents-title">Company Documents & Knowledge Base</h1>
            <p className="documents-subtitle">
              Upload policies, handbooks, and documentation. They are automatically chunked, embedded with pgvector, and made accessible to AI agents for search, grounding, and citing.
            </p>
          </div>
          {files.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Database size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>{files.length} document{files.length !== 1 ? 's' : ''} indexed</span>
            </div>
          )}
        </div>
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
          <Upload size={36} />
        </div>
        <h3 className="upload-dropzone-title">Add your documents</h3>
        <p className="upload-dropzone-text">Drag & drop files here or</p>
        <Button variant="primary" size="md" onClick={handleBrowseClick}>
          Browse Files
        </Button>
        <p className="upload-dropzone-formats">
          Supported: DOCX, PDF, TXT, CSV, MD (Max 50 MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.md,.json"
          onChange={handleFileSelect}
          className="upload-hidden-input"
        />
      </motion.div>

      <motion.div className="documents-list-section" variants={staggerItem}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="documents-list-title">Uploaded Documents</h2>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Spinner size="sm" /> Loading documents...
            </div>
          )}
        </div>

        <AnimatePresence>
          {files.length > 0 ? (
            <div className="documents-table-wrapper">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size / Chunks</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const ext = getFileExtension(file.name);
                    const isDeleting = deletingIds.has(file.id);
                    return (
                      <motion.tr
                        key={file.id}
                        className="documents-table-row"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="documents-table-name">
                          {getFileIcon(ext)}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span className="documents-table-filename" title={file.name}>
                              {file.name}
                            </span>
                            {file.restrictedRole && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>
                                Restricted: {file.restrictedRole.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{ext || 'DOC'}</td>
                        <td>
                          {file.size !== undefined
                            ? formatFileSize(file.size)
                            : file.chunkCount !== undefined
                            ? `${file.chunkCount} chunk${file.chunkCount !== 1 ? 's' : ''}`
                            : '—'}
                        </td>
                        <td>{getStatusBadge(file.status)}</td>
                        <td>
                          <button
                            type="button"
                            className="documents-table-remove"
                            onClick={() => removeFile(file.id, file.name)}
                            disabled={isDeleting || file.status === 'uploading'}
                            aria-label={`Remove ${file.name}`}
                            title={`Delete ${file.name}`}
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : !isLoading ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <FileText size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 500, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
                No documents uploaded yet
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Upload company documents above to allow the AI assistant to reference policies, guidelines, and procedures.
              </p>
            </div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default DocumentsPage;
