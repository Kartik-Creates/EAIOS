import { useState, useCallback } from 'react';
import { searchService } from '@/services/searchService';
import type { SearchState } from '@/types/search.types';

export const useSearch = () => {
  const [state, setState] = useState<SearchState>({
    results: [],
    query: '',
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const [topK, setTopK] = useState<number>(10);

  /**
   * Executes a semantic search query against the vector database.
   */
  const performSearch = useCallback(
    async (queryText: string, kCount?: number) => {
      const trimmed = queryText.trim();
      if (!trimmed) return;

      const activeTopK = kCount ?? topK;

      setState((prev) => ({
        ...prev,
        query: trimmed,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await searchService.search({
          q: trimmed,
          top_k: activeTopK,
        });

        setState({
          results: response.results || [],
          query: response.query || trimmed,
          isLoading: false,
          error: null,
          hasSearched: true,
        });
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.detail ||
          err?.message ||
          'Semantic search query failed. Please check network connection.';

        setState((prev) => ({
          ...prev,
          results: [],
          isLoading: false,
          error: errorMessage,
          hasSearched: true,
        }));
      }
    },
    [topK]
  );

  /**
   * Clears active search results and query.
   */
  const clearSearch = useCallback(() => {
    setState({
      results: [],
      query: '',
      isLoading: false,
      error: null,
      hasSearched: false,
    });
  }, []);

  return {
    results: state.results,
    query: state.query,
    isLoading: state.isLoading,
    error: state.error,
    hasSearched: state.hasSearched,
    topK,
    setTopK,
    performSearch,
    clearSearch,
  };
};
