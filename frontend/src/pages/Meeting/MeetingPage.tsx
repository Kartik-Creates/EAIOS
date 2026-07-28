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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingService } from '@/services/meetingService';
import type { MeetingSummary, ActionItem, Decision } from '@/types/meeting.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import './MeetingPage.css';

export const MeetingPage = () => {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="meeting-page">
      {/* ── Hero Header ── */}
      <header className="meeting-hero-panel">
        <div className="meeting-hero-text">
          <h1>
            <Mic size={24} className="text-purple-400" />
            Meeting Intelligence
          </h1>
          <p>
            Transform raw meeting transcripts into structured summaries, key decisions,
            and actionable follow-up items using EAIOS AI agents.
          </p>
        </div>

        <div className="meeting-stats-pill">
          <Badge variant="purple">AI Powered</Badge>
          <span className="text-xs text-slate-400">
            RAG + LangChain Agent
          </span>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && !isLoading && (
        <div className="meeting-error-banner" style={{ border: '1px solid var(--color-error)', background: 'var(--color-error-bg)' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
          <span style={{ color: '#fca5a5' }}>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Input Panel ── */}
      <section className="meeting-section-card">
        <div className="meeting-section-header">
          <div className="meeting-section-title">
            <FileText size={20} className="text-blue-400" />
            <h2>Meeting Transcript</h2>
          </div>
          <div className="meeting-header-actions">
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading || (!transcript && !summary)}>
              <Trash2 size={14} className="mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-400" style={{ margin: '0 0 0.75rem 0' }}>
          Paste the full meeting transcript below. The AI agent will identify key decisions,
          action items with assignees, and generate a concise executive summary.
        </p>

        <textarea
          ref={textareaRef}
          className="meeting-transcript-input"
          placeholder="Paste meeting transcript here...&#10;&#10;Example:&#10;Alice: We need to decide on the Q4 roadmap priority.&#10;Bob: I recommend focusing on the RAG pipeline improvements.&#10;Carol: Agreed. Let's schedule a follow-up for next Tuesday.&#10;..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={isLoading}
          rows={10}
          aria-label="Meeting transcript input"
        />

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
      </section>

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
        <div className="meeting-results-grid">
          {/* Summary Card */}
          <section className="meeting-section-card">
            <div className="meeting-section-header">
              <div className="meeting-section-title">
                <Sparkles size={20} className="text-green-400" />
                <h2>Executive Summary</h2>
              </div>
              <Badge variant="green">
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
          </section>

          {/* Decisions Card */}
          <section className="meeting-section-card">
            <div className="meeting-section-header">
              <div className="meeting-section-title">
                <CheckCircle2 size={20} className="text-blue-400" />
                <h2>Key Decisions</h2>
              </div>
              <Badge variant="blue">{summary.decisions.length}</Badge>
            </div>

            {summary.decisions.length === 0 ? (
              <p className="text-xs text-slate-400">No explicit decisions detected in this transcript.</p>
            ) : (
              <div className="meeting-list">
                {summary.decisions.map((decision: Decision) => (
                  <div key={decision.id} className="meeting-decision-item">
                    <div className="meeting-decision-bullet" />
                    <div className="meeting-decision-content">
                      <div className="meeting-decision-desc">{decision.description}</div>
                      {decision.context && (
                        <div className="text-xs text-slate-400">{decision.context}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Items Card */}
          <section className="meeting-section-card">
            <div className="meeting-section-header">
              <div className="meeting-section-title">
                <Clock size={20} className="text-amber-400" />
                <h2>Action Items</h2>
              </div>
              <Badge variant="yellow">
                {summary.action_items.filter((i) => i.completed).length}/{summary.action_items.length} Done
              </Badge>
            </div>

            {summary.action_items.length === 0 ? (
              <p className="text-xs text-slate-400">No action items detected in this transcript.</p>
            ) : (
              <div className="meeting-list">
                {summary.action_items.map((item: ActionItem) => (
                  <div
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
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
    </div>
  );
};

export default MeetingPage;
