import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Citation } from '@/types/chat.types';
import { Badge } from '@/components/ui/Badge';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export const CitationCard = ({ citation, index }: CitationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="citation-card"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10px' }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="citation-header"
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="citation-title-group">
          <Badge variant="blue" className="citation-number-badge">
            [{index + 1}]
          </Badge>
          <FileText size={16} className="text-blue-400" />
          <span className="citation-doc-title">{citation.document_title}</span>
        </div>

        <div className="citation-actions">
          <span className="citation-id-tag">ID: {citation.document_id.slice(0, 8)}...</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div className="citation-body">
          <div className="citation-excerpt">
            <span className="excerpt-label">Relevant Excerpt:</span>
            <blockquote className="excerpt-text">"{citation.excerpt}"</blockquote>
          </div>
          <div className="citation-meta">
            <span className="meta-item">
              <ExternalLink size={12} /> Document ID: {citation.document_id}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
