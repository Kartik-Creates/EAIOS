/**
 * search.types.ts
 *
 * TypeScript contracts that mirror the backend Pydantic schemas in:
 *   backend/app/schemas/search.py
 *
 * Also includes frontend-only types for the search hook state.
 *
 * RULE: SearchResult and SearchResponse must never diverge from the
 *       backend schema without a matching backend change.
 */

// ─────────────────────────────────────────────
// Search Result
// Mirrors: schemas/search.py → SearchResult
// Part of: SearchResponse.results[]
// ─────────────────────────────────────────────
export interface SearchResult {
  document_id: string;
  document_title: string;
  excerpt: string;
  score: number; // 0.0 – 1.0 confidence/relevance score
}

// ─────────────────────────────────────────────
// Search Response
// Mirrors: schemas/search.py → SearchResponse
// Returned by: GET /api/v1/search?q=...&top_k=...
// ─────────────────────────────────────────────
export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

// ─────────────────────────────────────────────
// Search Query Params (frontend-only)
// Used to build the GET /api/v1/search query string
// Backend constraints: q (1–4000 chars), top_k (1–20, default 10)
// ─────────────────────────────────────────────
export interface SearchParams {
  q: string;
  top_k?: number; // default 10, max 20
}

// ─────────────────────────────────────────────
// Search Hook State (frontend-only)
// Defines the shape returned by useSearch()
// ─────────────────────────────────────────────
export interface SearchState {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean; // distinguishes "not searched yet" from "empty results"
}
