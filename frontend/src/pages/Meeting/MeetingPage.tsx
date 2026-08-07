import { useState, useRef } from 'react';
import {
  Mic,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  Trash2,
  Paperclip,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { meetingService } from '@/services/meetingService';
import type { MeetingSummary, ActionItem, Decision } from '@/types/meeting.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './MeetingPage.css';

export const MeetingPage = () => {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      toast.error('Please paste a meeting transcript first.');
      textareaRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await meetingService.summarize({ transcript: transcript.trim() });
      setSummary(result);
      toast.success('Meeting intelligence report generated.');
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to generate meeting summary. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setSummary(null);
    setError(null);
  };

  const toggleActionItem = (itemId: string) => {
    if (!summary) return;
    setSummary({
      ...summary,
      action_items: summary.action_items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  return (
    <motion.div className="meeting-page" variants={staggerContainer}>
      {/* ── Error Banner ── */}
      {error && !isLoading && (
        <motion.div className="meeting-error-banner" variants={staggerItem} style={{ border: '1px solid var(--color-error)', background: 'var(--color-error-bg)' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
          <span style={{ color: '#fca5a5' }}>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* ── Input Panel ── */}
      <motion.section className="meeting-section-card" variants={staggerItem}>
        <div className="meeting-section-header">
          <div className="meeting-section-title">
            <FileText size={20} className="text-muted" />
            <h2>Meeting Transcript</h2>
          </div>
          <div className="meeting-header-actions">
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading || (!transcript && !summary)}>
              <Trash2 size={14} className="mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted" style={{ margin: '0 0 0.75rem 0' }}>
          Paste the full meeting transcript below. The AI agent will identify key decisions,
          action items with assignees, and generate a concise executive summary.
        </p>

        {attachedFiles.length > 0 && (
          <div className="meeting-attachments-area">
            {attachedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="meeting-attachment-chip">
                <FileText size={14} className="meeting-attachment-icon" />
                <div className="meeting-attachment-info">
                  <span className="meeting-attachment-name">{file.name}</span>
                  <span className="meeting-attachment-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="meeting-attachment-remove"
                  onClick={() => handleRemoveFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="meeting-textarea-wrapper">
          <button
            type="button"
            className="meeting-attach-btn"
            onClick={handleAttachClick}
            aria-label="Attach files"
            title="Attach files"
          >
            <Paperclip size={18} />
          </button>
          <textarea
            ref={textareaRef}
            className="meeting-transcript-input meeting-transcript-input-with-attach"
            placeholder="Paste meeting transcript here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={isLoading}
            rows={10}
            aria-label="Meeting transcript input"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>

        <div className="meeting-input-footer">
          <span className="text-xs text-slate-400">
            {transcript.length > 0 ? `${transcript.length} characters` : 'No transcript provided'}
          </span>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSummarize}
            disabled={isLoading || !transcript.trim()}
            isLoading={isLoading}
          >
            <Sparkles size={18} className="mr-2" />
            Generate Summary
          </Button>
        </div>
      </motion.section>

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="meeting-loading-state">
          <Spinner size="lg" />
          <p className="text-slate-400">Processing transcript with AI agent...</p>
          <p className="text-xs text-slate-500">Extracting decisions, action items, and knowledge graph entries</p>
        </div>
      )}

      {/* ── Results Sections ── */}
      {summary && !isLoading && (
        <motion.div className="meeting-results-grid" variants={staggerContainer}>
          {/* Summary Card */}
          <motion.section className="meeting-section-card" variants={staggerItem}>
            <div className="meeting-section-header">
              <div className="meeting-section-title">
                <Sparkles size={20} className="text-muted" />
                <h2>Executive Summary</h2>
              </div>
              <Badge variant="slate">
                {(summary.confidence * 100).toFixed(0)}% Confidence
              </Badge>
            </div>
            <p className="meeting-summary-text">{summary.summary}</p>
            <div className="meeting-meta-row">
              {summary.participants_count && (
                <span className="meeting-meta-tag">
                  <User size={14} className="mr-1" />
                  {summary.participants_count} Participants
                </span>
              )}
              {summary.duration_seconds && (
                <span className="meeting-meta-tag">
                  <Clock size={14} className="mr-1" />
                  {Math.floor(summary.duration_seconds / 60)} min
                </span>
              )}
            </div>
          </motion.section>

          {/* Decisions Card */}
          <motion.section className="meeting-section-card">
            <div className="meeting-section-header">
              <div className="meeting-section-title">
                <CheckCircle2 size={20} className="text-muted" />
                <h2>Key Decisions</h2>
              </div>
              <Badge variant="slate">{summary.decisions.length}</Badge>
            </div>

            {summary.decisions.length === 0 ? (
              <p className="text-xs text-slate-400">No explicit decisions detected in this transcript.</p>
            ) : (
              <motion.div className="meeting-list" variants={staggerContainer}>
                {summary.decisions.map((decision: Decision) => (
                  <motion.div key={decision.id} className="meeting-decision-item" variants={staggerItem}>
                    <div className="meeting-decision-bullet" />
                    <div className="meeting-decision-content">
                      <div className="meeting-decision-desc">{decision.description}</div>
                      {decision.context && (
                        <div className="text-xs text-slate-400">{decision.context}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
                </motion.div>
            )}
          </motion.section>

          {/* Action Items Card */}
          <motion.section className="meeting-section-card" variants={staggerItem}>
            <div className="meeting-section-header">
              <div className="meeting-section-title">
                <Clock size={20} className="text-muted" />
                <h2>Action Items</h2>
              </div>
              <Badge variant="slate">
                {summary.action_items.filter((i) => i.completed).length}/{summary.action_items.length} Done
              </Badge>
            </div>

            {summary.action_items.length === 0 ? (
              <p className="text-xs text-slate-400">No action items detected in this transcript.</p>
            ) : (
              <motion.div className="meeting-list" variants={staggerContainer}>
                {summary.action_items.map((item: ActionItem) => (
                  <motion.div
                    key={item.id}
                    className={`meeting-action-item ${item.completed ? 'completed' : ''}`}
                  >
                    <button
                      type="button"
                      className={`meeting-action-checkbox ${item.completed ? 'checked' : ''}`}
                      onClick={() => toggleActionItem(item.id)}
                      aria-label={`Mark ${item.description} as ${item.completed ? 'incomplete' : 'complete'}`}
                    >
                      {item.completed && <CheckCircle2 size={16} />}
                    </button>
                    <div className="meeting-action-content">
                      <div className="meeting-action-desc">{item.description}</div>
                      <div className="meeting-action-meta">
                        {item.assignee && (
                          <span className="meeting-meta-tag">
                            <User size={12} className="mr-1" />
                            {item.assignee}
                          </span>
                        )}
                        {item.due_date && (
                          <span className="meeting-meta-tag">
                            <Clock size={12} className="mr-1" />
                            {item.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                   </motion.div>
                ))}
               </motion.div>
            )}
           </motion.section>
         </motion.div>
      )}

      {/* ── Empty State ── */}
      {!summary && !isLoading && !error && transcript.length === 0 && (
        <div className="meeting-empty-state">
          <div className="meeting-empty-icon">
            <Mic size={32} />
          </div>
          <h3>No transcript provided</h3>
          <p>Paste a meeting transcript above and click <strong>Generate Summary</strong> to produce an intelligent meeting report.</p>
        </div>
      )}
    </motion.div>
  );
};

export default MeetingPage;
