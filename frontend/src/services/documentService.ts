import { apiClient } from './axios';

export interface DocumentItem {
  id: string;
  title: string;
  source: string;
  restricted_role: string | null;
  chunk_count: number;
  created_at: string | null;
}

export const documentService = {
  /**
   * Fetch all indexed documents in the Company Brain.
   */
  getDocuments: async (): Promise<DocumentItem[]> => {
    const response = await apiClient.get<DocumentItem[]>('/documents');
    return response.data;
  },

  /**
   * Upload a document file (DOCX, PDF, TXT, CSV, etc.) for vector chunking & indexing.
   */
  uploadDocument: async (file: File, restrictedRole?: string): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (restrictedRole && restrictedRole.toLowerCase() !== 'none') {
      formData.append('restricted_role', restrictedRole);
    }

    const response = await apiClient.post<DocumentItem>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a document and its indexed vector chunks.
   */
  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },
};
