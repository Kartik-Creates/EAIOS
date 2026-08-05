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
import { motion } from 'framer-motion';
import { useSearch } from '@/hooks/useSearch';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { staggerContainer, staggerItem, fadeInDownVariants } from '@/lib/motion';
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
    <motion.div className="search-page" variants={fadeInDownVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-10px' }}>
      {/* ── Header Search Panel ── */}
      <motion.header className="search-header-panel" variants={staggerItem}>
        <div className="search-title-area">
          <h1>
            <Database size={24} className="text-muted" />
            Semantic Knowledge Base Search
          </h1>
          <Badge variant="slate">Vector Index Scope: Active Role</Badge>
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
              Powered by pgvector (PostgreSQL) & Cosine Distance Scoring
            </span>
          </div>
        </form>
      </motion.header>

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
          <p className="text-slate-400 text-sm">Querying pgvector index & scoring similarity...</p>
        </div>
      ) : hasSearched && results.length > 0 ? (
        <main className="search-results-container">
          <div className="search-stats-bar">
            <span className="search-count-label">
              Found <strong>{results.length}</strong> matching document chunk{results.length === 1 ? '' : 's'} for{' '}
              <strong>"{query}"</strong>
            </span>
            <Badge variant="slate">Ranked by Vector Similarity</Badge>
          </div>

          <motion.div className="search-results-list" style={{ marginTop: '1rem' }} variants={staggerContainer}>
            {results.map((res, index) => (
              <motion.div key={`${res.document_id}-${index}`} variants={staggerItem}>
                <SearchResultCard result={res} index={index} />
              </motion.div>
            ))}
          </motion.div>
        </main>
      ) : hasSearched && results.length === 0 ? (
        <motion.div className="no-results-panel" variants={staggerItem}>
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
        </motion.div>
      ) : (
        /* ── Pre-Search Suggested Topics State ── */
        <motion.section className="search-empty-state" aria-label="Suggested search topics" variants={staggerItem}>
          <motion.div className="empty-search-hero" variants={staggerItem}>
            <h2>Explore Knowledge Base Vectors</h2>
            <p>Select a pre-computed vector topic below or enter any search term above.</p>
          </motion.div>

          <motion.div className="topics-grid" variants={staggerContainer}>
            {[
              { icon: ShieldCheck, label: 'Security & Compliance', desc: 'Data privacy, password rotation policies, & encryption standards', query: 'Security policy and compliance guidelines' },
              { icon: HardDrive, label: 'Google Drive Connector', desc: 'OAuth authentication, webhook sync, and document ingestion', query: 'Google Drive continuous integration sync' },
              { icon: Code2, label: 'API Specifications', desc: 'Endpoint rate limiting, CORS configuration, & JWT headers', query: 'FastAPI backend API endpoints rate limits' },
              { icon: Users, label: 'RBAC Access Control', desc: 'Role hierarchies: Employee, Manager, HR, and Admin privileges', query: 'User authentication and RBAC roles matrix' },
            ].map((topic) => (
              <motion.div
                key={topic.query}
                className="topic-card"
                variants={staggerItem}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTopicClick(topic.query)}
              >
                <div className="topic-card-title">
                  <topic.icon size={16} className="text-muted" />
                  {topic.label}
                </div>
                <div className="topic-card-desc">
                  {topic.desc}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default SearchPage;
