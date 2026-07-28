import { apiClient } from './axios';
import type { SearchParams, SearchResponse } from '@/types/search.types';

export const searchService = {
  /**
   * Performs a semantic search over the enterprise knowledge base.
   * @param params Query parameters (q, top_k)
   * @returns SearchResponse with matching documents and excerpts
   */
  search: async (params: SearchParams): Promise<SearchResponse> => {
    // Axios takes query parameters via the `params` config object
    const response = await apiClient.get<SearchResponse>('/search', { params });
    return response.data;
  }
};
