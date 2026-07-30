import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import type { SearchResult } from '@/types/search.types';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants/routes';

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
}

export const SearchResultCard = ({ result, index }: SearchResultCardProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const percentage = Math.round(result.score * 100);

  const handleCopyExcerpt = async () => {
    try {
      await navigator.clipboard.writeText(result.excerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy excerpt:', err);
    }
  };

  const handleAskAI = () => {
    const prompt = `Analyze and explain document chunk "${result.document_title}" (ID: ${result.document_id}):\n\n"${result.excerpt}"`;
    navigate(`${ROUTES.CHAT}?prompt=${encodeURIComponent(prompt)}`);
  };

  // Helper for score badge variant
  const getScoreVariant = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.5) return 'yellow';
    return 'slate';
  };

  return (
    <div className="search-result-card">
      <div className="result-card-header">
        <div className="result-doc-info">
          <Badge variant="blue" className="result-rank-badge">
            #{index + 1}
          </Badge>
          <FileText size={18} className="text-blue-400" />
          <h3 className="result-title">{result.document_title}</h3>
        </div>

        <div className="result-score-group">
          <Badge variant={getScoreVariant(result.score)}>
            {percentage}% Match Score
          </Badge>
        </div>
      </div>

      <div className="result-body">
        <blockquote className="result-excerpt-box">
          "{result.excerpt}"
        </blockquote>
      </div>

      <div className="result-card-footer">
        <span className="doc-id-label">
          <ExternalLink size={12} className="inline mr-1" />
          Document ID: {result.document_id}
        </span>

        <div className="result-actions">
          <button
            type="button"
            className="result-action-btn"
            onClick={handleCopyExcerpt}
            title="Copy excerpt to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Excerpt</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="result-action-btn primary-action"
            onClick={handleAskAI}
            title="Ask AI Assistant about this document excerpt"
          >
            <Sparkles size={14} />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
