import { useState, useEffect } from 'react';
import {
  Wand2,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { workflowService } from '@/services/workflowService';
import type { WorkflowTool, WorkflowRun, WorkflowExecuteRequest } from '@/types/workflow.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import './WorkflowPage.css';

export const WorkflowPage = () => {
  const [tools, setTools] = useState<WorkflowTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<WorkflowTool | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingExecution, setPendingExecution] = useState<WorkflowExecuteRequest | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setIsLoadingTools(true);
      setError(null);
      const data = await workflowService.listTools();
      setTools(data);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to load workflow tools.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleToolSelect = (tool: WorkflowTool) => {
    setSelectedTool(tool);
    setActiveRun(null);
    const initialValues: Record<string, any> = {};
    tool.parameters.forEach((param) => {
      if (param.default !== undefined) {
        initialValues[param.name] = param.default;
      }
    });
    setFormValues(initialValues);
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecuteClick = () => {
    if (!selectedTool) return;

    const missing = selectedTool.parameters.filter((p) => p.required && !formValues[p.name]);
    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.map((m) => m.label).join(', ')}`);
      return;
    }

    const payload: WorkflowExecuteRequest = {
      tool_name: selectedTool.name,
      parameters: formValues,
    };

    if (selectedTool.requires_confirmation) {
      setPendingExecution(payload);
      setShowConfirmModal(true);
    } else {
      executeWorkflow(payload);
    }
  };

  const executeWorkflow = async (payload: WorkflowExecuteRequest) => {
    setIsExecuting(true);
    setError(null);
    try {
      const run = await workflowService.execute(payload);
      setActiveRun(run);
      setRuns((prev) => [run, ...prev]);
      setSelectedTool(null);
      setFormValues({});
      setShowConfirmModal(false);
      setPendingExecution(null);
      toast.success(`Workflow "${run.tool_name}" started.`);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Workflow execution failed.';
      setError(message);
      toast.error(message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConfirm = () => {
    if (pendingExecution) {
      executeWorkflow({ ...pendingExecution, confirmed: true });
    }
  };

  const handleClearHistory = () => {
    setRuns([]);
    setActiveRun(null);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'awaiting_confirmation':
        return 1;
      case 'running':
        return 2;
      case 'completed':
        return 3;
      case 'failed':
        return 3;
      case 'cancelled':
        return 3;
      default:
        return 0;
    }
  };

  const renderStatusIcon = (status: string, size = 18) => {
    switch (status) {
      case 'pending':
        return <Clock size={size} className="workflow-status-icon workflow-status-pending" />;
      case 'awaiting_confirmation':
        return <AlertCircle size={size} className="workflow-status-icon workflow-status-awaiting" />;
      case 'running':
        return <Loader2 size={size} className="workflow-status-icon workflow-status-running" />;
      case 'completed':
        return <CheckCircle2 size={size} className="workflow-status-icon workflow-status-completed" />;
      case 'failed':
        return <XCircle size={size} className="workflow-status-icon workflow-status-failed" />;
      case 'cancelled':
        return <XCircle size={size} className="workflow-status-icon workflow-status-cancelled" />;
      default:
        return <Clock size={size} className="workflow-status-icon workflow-status-pending" />;
    }
  };

  return (
    <div className="workflow-page">
      {/* ── Hero Header ── */}


      {/* ── Error Banner ── */}
      {error && (
        <div className="workflow-error-banner" style={{ border: '1px solid var(--color-error)', background: 'var(--color-error-bg)' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
          <span style={{ color: '#fca5a5' }}>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Active Run / Status Stepper ── */}
      {activeRun && (
        <section className="workflow-section-card workflow-active-run-card">
          <div className="workflow-section-header">
            <div className="workflow-section-title">
              {renderStatusIcon(activeRun.status, 20)}
              <h2>Active Workflow Run</h2>
            </div>
            <Badge variant="slate">
              {activeRun.status.toUpperCase()}
            </Badge>
          </div>

          <div className="workflow-stepper">
            {['pending', 'awaiting_confirmation', 'running', 'completed'].map((step, idx) => {
              const currentStep = getStatusStep(activeRun.status);
              const isFailed = activeRun.status === 'failed' || activeRun.status === 'cancelled';
              let stateClass = 'workflow-step-pending';
              if (isFailed && idx === currentStep) stateClass = 'workflow-step-failed';
              else if (idx < currentStep) stateClass = 'workflow-step-completed';
              else if (idx === currentStep) stateClass = 'workflow-step-active';

              return (
                <div key={step} className={`workflow-step ${stateClass}`}>
                  <div className="workflow-step-indicator">
                    {idx < currentStep ? (
                      <CheckCircle2 size={16} />
                    ) : idx === currentStep && !isFailed ? (
                      <Loader2 size={16} className="workflow-step-spinner" />
                    ) : (
                      <span className="workflow-step-number">{idx + 1}</span>
                    )}
                  </div>
                  <div className="workflow-step-label">{step.replace('_', ' ')}</div>
                  {idx < 3 && <div className={`workflow-step-line ${idx < currentStep ? 'completed' : ''}`} />}
                </div>
              );
            })}
          </div>

          <div className="workflow-run-detail">
            <div className="workflow-run-meta">
              <span><strong>Run ID:</strong> {activeRun.id.slice(0, 12)}...</span>
              <span><strong>Tool:</strong> {activeRun.tool_name}</span>
              <span><strong>Started:</strong> {new Date(activeRun.created_at).toLocaleString()}</span>
            </div>
            {activeRun.result && (
              <details className="workflow-run-result">
                <summary>View Result</summary>
                <pre>{JSON.stringify(activeRun.result, null, 2)}</pre>
              </details>
            )}
            {activeRun.error && (
              <div className="workflow-run-error">
                <AlertCircle size={14} /> {activeRun.error}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tools Grid ── */}
      <section className="workflow-section-card">
        <div className="workflow-section-header">
          <div className="workflow-section-title">
            <Play size={20} className="text-muted" />
            <h2>Available Workflows</h2>
          </div>
          <Badge variant="slate">{tools.length} Tools</Badge>
        </div>

        {isLoadingTools ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1rem' }}>
            <Spinner size="lg" />
            <p className="text-sm text-muted">Loading workflow tool catalog...</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="workflow-empty-state">
            <Wand2 size={32} className="text-muted" style={{ margin: '0 auto 1rem' }} />
            <p>No workflow tools available. Contact your administrator.</p>
          </div>
        ) : (
          <div className="workflow-tools-grid">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className={`workflow-tool-card ${selectedTool?.name === tool.name ? 'selected' : ''}`}
                onClick={() => handleToolSelect(tool)}
              >
                <div className="workflow-tool-header">
                  <div className="workflow-tool-icon">
                    <Wand2 size={18} />
                  </div>
                  <div className="workflow-tool-info">
                    <div className="workflow-tool-name">{tool.name}</div>
                    <div className="workflow-tool-desc">{tool.description}</div>
                  </div>
                </div>
                <div className="workflow-tool-footer">
                  {tool.requires_confirmation && (
                    <Badge variant="yellow" className="workflow-tool-badge">
                      <AlertCircle size={12} className="mr-1" />
                      Confirmation Required
                    </Badge>
                  )}
                  <span className="workflow-tool-params">{tool.parameters.length} parameters</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Selected Tool Form ── */}
      {selectedTool && !isExecuting && (
        <section className="workflow-section-card workflow-form-card">
          <div className="workflow-section-header">
            <div className="workflow-section-title">
              <Wand2 size={20} className="text-muted" />
              <h2>Configure: {selectedTool.name}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedTool(null); setFormValues({}); }}>
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted" style={{ margin: '0 0 1rem 0' }}>
            {selectedTool.description}
          </p>

          <div className="workflow-form-grid">
            {selectedTool.parameters.map((param) => (
              <div key={param.name} className="workflow-form-field">
                <label className="workflow-form-label">
                  {param.label}
                  {param.required && <span className="workflow-required">*</span>}
                </label>
                <input
                  type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                  className="workflow-form-input"
                  placeholder={param.description}
                  value={formValues[param.name] ?? ''}
                  onChange={(e) =>
                    handleFormChange(param.name, param.type === 'number' ? Number(e.target.value) : e.target.value)
                  }
                  required={param.required}
                />
                <span className="text-xs text-slate-500">{param.description}</span>
              </div>
            ))}
          </div>

          <div className="workflow-form-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleExecuteClick}
              disabled={isExecuting}
            >
              <Play size={18} className="mr-2" />
              Execute Workflow
            </Button>
            {selectedTool.requires_confirmation && (
              <span className="text-xs text-amber-400 workflow-confirmation-hint">
                <AlertCircle size={12} className="mr-1" />
                This workflow requires human confirmation before execution.
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Execution Loading State ── */}
      {isExecuting && (
        <div className="workflow-loading-state">
          <Spinner size="lg" />
          <p className="text-slate-400">
            {activeRun?.status === 'awaiting_confirmation'
              ? 'Awaiting human confirmation...'
              : 'Executing workflow agent...'}
          </p>
        </div>
      )}

      {/* ── Run History ── */}
      {runs.length > 0 && (
        <section className="workflow-section-card">
          <div className="workflow-section-header">
            <div className="workflow-section-title">
              <Clock size={20} className="text-green-400" />
              <h2>Execution History</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              <Trash2 size={14} className="mr-1" />
              Clear
            </Button>
          </div>

          <div className="workflow-history-list">
            {runs.map((run) => (
              <div key={run.id} className="workflow-history-item">
                <div className="workflow-history-icon">
                  {renderStatusIcon(run.status, 16)}
                </div>
                <div className="workflow-history-info">
                  <div className="workflow-history-tool">{run.tool_name}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(run.created_at).toLocaleString()} · Run ID: {run.id.slice(0, 12)}...
                  </div>
                </div>
                <Badge
                  variant="slate"
                >
                  {run.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Confirmation Modal ── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingExecution(null);
        }}
        title="Confirm Workflow Execution"
      >
        <div className="workflow-confirm-modal">
          <div className="workflow-confirm-warning">
            <AlertCircle size={24} className="text-muted" />
            <p>
              This workflow performs a <strong>write action</strong> and requires explicit human confirmation.
            </p>
          </div>

          {pendingExecution && (
            <div className="workflow-confirm-details">
              <div className="workflow-confirm-row">
                <span>Tool:</span>
                <strong>{pendingExecution.tool_name}</strong>
              </div>
              <div className="workflow-confirm-row">
                <span>Parameters:</span>
                <pre>{JSON.stringify(pendingExecution.parameters, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="workflow-confirm-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirm}
              disabled={isExecuting}
              isLoading={isExecuting}
            >
              <CheckCircle2 size={18} className="mr-2" />
              Confirm & Execute
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowConfirmModal(false);
                setPendingExecution(null);
              }}
              disabled={isExecuting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowPage;
