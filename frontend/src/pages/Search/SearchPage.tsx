import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Database,
  SlidersHorizontal,
  ShieldCheck,
  HardDrive,
  Code2,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import './SearchPage.css';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    results,
    query,
    isLoading,
    error,
    hasSearched,
    topK,
    setTopK,
    performSearch,
    clearSearch,
  } = useSearch();

  const [inputQuery, setInputQuery] = useState('');
  const queryProcessedRef = useRef(false);

  // Sync URL query params e.g. /search?q=...
  useEffect(() => {
    const qFromUrl = searchParams.get('q');
    if (qFromUrl && !queryProcessedRef.current) {
      queryProcessedRef.current = true;
      setInputQuery(qFromUrl);
      performSearch(qFromUrl);
    }
  }, [searchParams, performSearch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    performSearch(inputQuery);
    setSearchParams({ q: inputQuery.trim() });
  };

  const handleClear = () => {
    setInputQuery('');
    clearSearch();
    setSearchParams({});
  };

  const handleTopicClick = (topicQuery: string) => {
    setInputQuery(topicQuery);
    performSearch(topicQuery);
    setSearchParams({ q: topicQuery });
  };

  return (
    <div className="search-page">
      {/* ── Header Search Panel ── */}
      <header className="search-header-panel">
        <div className="search-title-area">
          <h1>
            <Database size={24} className="text-blue-400" />
            Semantic Knowledge Base Search
          </h1>
          <Badge variant="blue">Vector Index Scope: Active Role</Badge>
        </div>

        <form onSubmit={handleSubmit} className="search-form-group">
          <div className="search-input-row">
            <div className="search-input-wrapper">
              <Search size={20} className="search-input-icon" />
              <input
                type="text"
                className="search-main-input"
                placeholder="Search internal documents by vector similarity (e.g. 'security compliance', 'OAuth token refresh')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                aria-label="Semantic search query"
              />
              {inputQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClear}
                  title="Clear search input"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!inputQuery.trim() || isLoading}
              isLoading={isLoading}
            >
              <span>Search</span>
            </Button>
          </div>

          <div className="search-controls-row">
            <div className="topk-selector-group">
              <SlidersHorizontal size={14} />
              <label htmlFor="topk-select">Max Vector Chunks (top_k):</label>
              <select
                id="topk-select"
                className="topk-select"
                value={topK}
                onChange={(e) => {
                  const newK = Number(e.target.value);
                  setTopK(newK);
                  if (inputQuery.trim()) {
                    performSearch(inputQuery, newK);
                  }
                }}
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10 (Default)</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20 (Max)</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">
              Powered by FAISS Vector Database & Cosine Distance Scoring
            </span>
          </div>
        </form>
      </header>

      {/* ── Search Error Alert ── */}
      {error && (
        <div className="no-results-panel" style={{ border: '1px solid var(--color-error)' }}>
          <div className="no-results-icon" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
            <AlertCircle size={28} />
          </div>
          <h3>Search Query Failed</h3>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      )}

      {/* ── Search Results List ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm">Querying FAISS vector index & scoring similarity...</p>
        </div>
      ) : hasSearched && results.length > 0 ? (
        <main className="search-results-container">
          <div className="search-stats-bar">
            <span className="search-count-label">
              Found <strong>{results.length}</strong> matching document chunk{results.length === 1 ? '' : 's'} for{' '}
              <strong>"{query}"</strong>
            </span>
            <Badge variant="purple">Ranked by Vector Similarity</Badge>
          </div>

          <div className="search-results-list" style={{ marginTop: '1rem' }}>
            {results.map((res, index) => (
              <SearchResultCard key={`${res.document_id}-${index}`} result={res} index={index} />
            ))}
          </div>
        </main>
      ) : hasSearched && results.length === 0 ? (
        <div className="no-results-panel">
          <div className="no-results-icon">
            <AlertCircle size={28} />
          </div>
          <h3>No Matching Vectors Found</h3>
          <p className="text-sm text-slate-400">
            No document chunks met the minimum similarity threshold for <strong>"{query}"</strong> under your current RBAC role.
          </p>
          <Button variant="ghost" size="sm" onClick={() => performSearch(query, 20)}>
            Try Top 20 Results
          </Button>
        </div>
      ) : (
        /* ── Pre-Search Suggested Topics State ── */
        <section className="search-empty-state" aria-label="Suggested search topics">
          <div className="empty-search-hero">
            <h2>Explore Knowledge Base Vectors</h2>
            <p>Select a pre-computed vector topic below or enter any search term above.</p>
          </div>

          <div className="topics-grid">
            <div
              className="topic-card"
              onClick={() => handleTopicClick('Security policy and compliance guidelines')}
            >
              <div className="topic-card-title">
                <ShieldCheck size={16} className="text-blue-400" />
                Security & Compliance
              </div>
              <div className="topic-card-desc">
                Data privacy, password rotation policies, & encryption standards
              </div>
            </div>

            <div
              className="topic-card"
              onClick={() => handleTopicClick('Google Drive continuous integration sync')}
            >
              <div className="topic-card-title">
                <HardDrive size={16} className="text-purple-400" />
                Google Drive Connector
              </div>
              <div className="topic-card-desc">
                OAuth authentication, webhook sync, and document ingestion
              </div>
            </div>

            <div
              className="topic-card"
              onClick={() => handleTopicClick('FastAPI backend API endpoints rate limits')}
            >
              <div className="topic-card-title">
                <Code2 size={16} className="text-green-400" />
                API Specifications
              </div>
              <div className="topic-card-desc">
                Endpoint rate limiting, CORS configuration, & JWT headers
              </div>
            </div>

            <div
              className="topic-card"
              onClick={() => handleTopicClick('User authentication and RBAC roles matrix')}
            >
              <div className="topic-card-title">
                <Users size={16} className="text-amber-400" />
                RBAC Access Control
              </div>
              <div className="topic-card-desc">
                Role hierarchies: Employee, Manager, HR, and Admin privileges
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchPage;
