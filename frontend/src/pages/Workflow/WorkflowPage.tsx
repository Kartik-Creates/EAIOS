import { useState, useEffect } from 'react';
import {
  Wand2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Search,
  Filter,
  FileText,
  CheckSquare,
  Video,
  GitPullRequest,
  Info,
  XCircle,
  Play,
  Zap,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { workflowService } from '@/services/workflowService';
import type {
  WorkflowDefinition,
  ExecutionPlan,
  ExecutionResult,
  RiskLevel,
} from '@/types/workflow.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './WorkflowPage.css';

const ICON_MAP: Record<string, any> = {
  FileText,
  CheckSquare,
  Video,
  GitPullRequest,
  Wand2,
};

const RISK_COLOR_MAP: Record<RiskLevel, 'green' | 'yellow' | 'red'> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'red',
  CRITICAL: 'red',
};

export const WorkflowPage = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true);
      const [listData, catData] = await Promise.all([
        workflowService.listWorkflows(),
        workflowService.getCategories(),
      ]);
      setWorkflows(listData);
      setCategories(['All', ...catData]);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to load workflow metadata.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkflow = (wf: WorkflowDefinition) => {
    setSelectedWorkflow(wf);
    setExecutionPlan(null);
    setExecutionResult(null);
    const initial: Record<string, any> = {};
    wf.parameter_schema.forEach((param) => {
      if (param.default_value !== undefined) {
        initial[param.id] = param.default_value;
      }
    });
    setFormValues(initial);
  };

  const handleInputChange = (paramId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [paramId]: value }));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow) return;

    try {
      setIsGeneratingPlan(true);
      setExecutionResult(null);
      const plan = await workflowService.createPlan(selectedWorkflow.id, formValues);
      setExecutionPlan(plan);
      if (plan.validation_summary.is_valid) {
        toast.success(`Execution Plan '${plan.plan_id}' generated!`);
      } else {
        toast.error('Parameter validation failed. Please check errors.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to generate execution plan.';
      toast.error(message);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!executionPlan || !executionPlan.validation_summary.is_valid) return;

    try {
      setIsExecuting(true);
      const res = await workflowService.executePlan(executionPlan);
      setExecutionResult(res);
      if (res.overall_status === 'completed') {
        toast.success(`Workflow '${res.execution_id}' completed in ${res.total_duration}s!`);
      } else if (res.overall_status === 'awaiting_approval') {
        toast('Workflow paused: Intercepted by Policy Engine for Human Approval.', { icon: '🛡️' });
      } else {
        toast.error(`Workflow execution failed.`);
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to execute workflow plan.';
      toast.error(message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setIsExecuting(true);
      const res = await workflowService.approveRequest(requestId, 'Approved via Policy Queue UI');
      setExecutionResult(res);
      toast.success(`Approval Request '${requestId}' approved! Workflow resumed.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to approve workflow.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setIsExecuting(true);
      const res = await workflowService.rejectRequest(requestId, 'Rejected via Policy Queue UI');
      setExecutionResult(res);
      toast.error(`Approval Request '${requestId}' rejected. Workflow terminated.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to reject workflow.');
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    const cat = String(w.category ?? '');
    const matchesCategory = selectedCategory === 'All' || cat === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      String(w.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(w.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper: safely coerce any value to a display string
  const s = (v: any): string => (v == null ? '' : String(v));

  return (
    <div className="workflow-page">
      {/* Header Section */}
      <motion.div
        className="workflow-header-container"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="workflow-title-block" variants={staggerItem}>
          <div className="workflow-badge">
            <Wand2 size={16} />
            <span>Workflow Automation Engine</span>
          </div>
          <h1>Workflow Automation Library</h1>
          <p>
            Policy Engine evaluates rules and intercepts high-risk workflows. Human Approval Framework pauses execution for manager/admin approval.
          </p>
        </motion.div>
      </motion.div>

      {/* Filter & Search Bar */}
      <div className="workflow-controls-bar">
        <div className="workflow-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search workflows by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="workflow-category-tabs">
          <Filter size={16} className="filter-icon" />
          {categories.map((cat) => (
            <button
              key={String(cat)}
              className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(String(cat))}
            >
              {String(cat)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="workflow-loading">
          <Spinner size="lg" />
          <p>Loading Registry Workflow Definitions...</p>
        </div>
      ) : (
        <div className="workflow-main-layout">
          {/* Left Grid: Workflow Library */}
          <div className="workflow-grid-section">
            <div className="section-header">
              <h2>Available Workflows ({filteredWorkflows.length})</h2>
            </div>

            <div className="workflow-cards-grid">
              {filteredWorkflows.map((wf) => {
                const iconKey = s(wf.icon);
                const IconComp = ICON_MAP[iconKey] || Wand2;
                const isSelected = selectedWorkflow?.id === wf.id;
                const riskKey = s(wf.risk_level) as RiskLevel;
                const riskVariant = RISK_COLOR_MAP[riskKey] ?? 'slate';

                return (
                  <motion.div
                    key={s(wf.id)}
                    className={`workflow-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectWorkflow(wf)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="card-top">
                      <div className="icon-wrapper">
                        <IconComp size={22} />
                      </div>
                      <div className="card-badges">
                        <Badge variant="slate">v{s(wf.version)}</Badge>
                        <Badge variant="blue">{s(wf.category)}</Badge>
                        <Badge variant={riskVariant}>{s(wf.risk_level)} RISK</Badge>
                      </div>
                    </div>

                    <h3>{s(wf.name)}</h3>
                    <p>{s(wf.description)}</p>

                    <div className="card-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{s(wf.estimated_runtime)}</span>
                      </div>
                      {wf.requires_confirmation && (
                        <div className="meta-item warning">
                          <Shield size={14} />
                          <span>Requires Approval</span>
                        </div>
                      )}
                    </div>

                    <div className="capabilities-list">
                      {(wf.capabilities ?? []).map((cap, i) => (
                        <span key={`cap-${i}-${s(cap)}`} className="capability-chip">
                          ⚡ {s(cap)}
                        </span>
                      ))}
                    </div>

                    <div className="integrations-list">
                      {(wf.integrations ?? []).map((integ, i) => (
                        <span key={`int-${i}-${s(integ)}`} className="integration-chip">
                          {s(integ)}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Drawer: Selected Workflow Detail, Parameter Form, Execution Plan & Approval Banner */}
          <div className="workflow-detail-section">
            {selectedWorkflow ? (
              <div className="workflow-detail-card">
                <div className="detail-header">
                  <div className="detail-title-group">
                    <Badge variant={RISK_COLOR_MAP[s(selectedWorkflow.risk_level) as RiskLevel] ?? 'slate'}>
                      {s(selectedWorkflow.risk_level)} RISK
                    </Badge>
                    <h2>{s(selectedWorkflow.name)}</h2>
                    <p>{s(selectedWorkflow.description)}</p>
                  </div>
                </div>

                {/* Dynamic Parameter Form */}
                <div className="detail-section-block">
                  <h3>Input Parameters</h3>
                  <form className="dynamic-parameter-form" onSubmit={handleGeneratePlan}>
                    {(selectedWorkflow.parameter_schema ?? []).map((param) => (
                      <div key={s(param.id)} className="form-group">
                        <label>
                          {s(param.label)} {param.required && <span className="req">*</span>}
                        </label>
                        <span className="param-desc">{s(param.description)}</span>

                        {s(param.type) === 'select' ? (
                          <select
                            value={formValues[param.id] || ''}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                          >
                            {param.validation_rules?.options?.map((opt) => (
                              <option key={s(opt)} value={s(opt)}>
                                {s(opt)}
                              </option>
                            ))}
                          </select>
                        ) : s(param.type) === 'textarea' ? (
                          <textarea
                            rows={3}
                            placeholder={s(param.placeholder)}
                            value={formValues[param.id] || ''}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                          />
                        ) : s(param.type) === 'boolean' ? (
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={!!formValues[param.id]}
                              onChange={(e) => handleInputChange(param.id, e.target.checked)}
                            />
                            <span>Enable {s(param.label)}</span>
                          </label>
                        ) : (
                          <input
                            type={s(param.type) === 'number' ? 'number' : 'text'}
                            placeholder={s(param.placeholder)}
                            value={formValues[param.id] || ''}
                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      type="submit"
                      variant="primary"
                      className="generate-plan-btn"
                      isLoading={isGeneratingPlan}
                    >
                      <Play size={16} /> Generate Execution Plan
                    </Button>
                  </form>
                </div>

                {/* Phase 2 Execution Plan Output Card */}
                {executionPlan && (
                  <div className={`execution-plan-card ${executionPlan.validation_summary.is_valid ? 'valid' : 'invalid'}`}>
                    <div className="plan-header">
                      <div className="plan-status">
                        {executionPlan.validation_summary.is_valid ? (
                          <CheckCircle2 size={20} className="status-icon valid" />
                        ) : (
                          <XCircle size={20} className="status-icon invalid" />
                        )}
                        <h4>Execution Plan Preview</h4>
                      </div>
                      <span className="plan-id">{s(executionPlan.plan_id)}</span>
                    </div>

                    {!executionPlan.validation_summary.is_valid && (
                      <div className="validation-error-box">
                        <AlertTriangle size={16} />
                        <div>
                          <strong>Validation Failed:</strong>
                          <ul>
                            {executionPlan.validation_summary.errors.map((err) => (
                              <li key={s(err.field_id)}>{s(err.message)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="plan-meta-grid">
                      <div className="meta-box">
                        <span className="lbl">Runtime</span>
                        <span className="val">{s(executionPlan.estimated_runtime)}</span>
                      </div>
                      <div className="meta-box">
                        <span className="lbl">Risk Level</span>
                        <span className="val">{s(executionPlan.risk_level)}</span>
                      </div>
                      <div className="meta-box">
                        <span className="lbl">Confirmation</span>
                        <span className="val">{executionPlan.requires_confirmation ? 'Required' : 'Not Required'}</span>
                      </div>
                    </div>

                    {executionPlan.validation_summary.is_valid && (
                      <Button
                        variant="secondary"
                        className="execute-plan-action-btn"
                        onClick={handleExecutePlan}
                        isLoading={isExecuting}
                      >
                        <Zap size={16} /> Run Orchestrator Engine
                      </Button>
                    )}
                  </div>
                )}

                {/* Phase 3 & 5 Execution Result Card */}
                {executionResult && (
                  <div className={`execution-result-card ${s(executionResult.overall_status)}`}>
                    <div className="result-header">
                      <div className="result-status-title">
                        {s(executionResult.overall_status) === 'awaiting_approval' ? (
                          <Shield size={20} className="result-icon warning" />
                        ) : s(executionResult.overall_status) === 'completed' ? (
                          <CheckCircle2 size={20} className="result-icon success" />
                        ) : (
                          <XCircle size={20} className="result-icon invalid" />
                        )}
                        <h4>Execution Result Log</h4>
                      </div>
                      <span className="exec-id">{s(executionResult.execution_id)}</span>
                    </div>

                    {/* Phase 5 Intercepted Approval Queue Card */}
                    {s(executionResult.overall_status) === 'awaiting_approval' && (
                      <div className="approval-intercept-banner">
                        <div className="banner-top">
                          <UserCheck size={20} />
                          <div>
                            <strong>Approval Required by Policy Engine</strong>
                            <p>{s(executionResult.execution_summary?.approval_reason)}</p>
                          </div>
                        </div>

                        <div className="approval-actions-row">
                          <Button
                            variant="primary"
                            size="sm"
                            className="btn-approve"
                            isLoading={isExecuting}
                            onClick={() => handleApprove(s(executionResult.execution_summary?.approval_request_id))}
                          >
                            <Check size={14} /> Approve & Resume Execution
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="btn-reject"
                            isLoading={isExecuting}
                            onClick={() => handleReject(s(executionResult.execution_summary?.approval_request_id))}
                          >
                            <X size={14} /> Reject & Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="result-summary-grid">
                      <div className="res-box">
                        <span className="lbl">Status</span>
                        <span className="val uppercase">{s(executionResult.overall_status)}</span>
                      </div>
                      <div className="res-box">
                        <span className="lbl">Duration</span>
                        <span className="val">{executionResult.total_duration}s</span>
                      </div>
                      <div className="res-box">
                        <span className="lbl">Completed</span>
                        <span className="val">{executionResult.completed_steps} / {(executionResult.step_results ?? []).length}</span>
                      </div>
                    </div>

                    {(executionResult.step_results ?? []).length > 0 && (
                      <div className="executed-steps-timeline">
                        <h5>Executed Steps Output</h5>
                        {(executionResult.step_results ?? []).map((res, i) => (
                          <div key={`step-${i}-${s(res.step_id)}`} className="executed-step-box">
                            <div className="exec-step-top">
                              <span className="step-id-tag">{s(res.step_id)}</span>
                              <span className="duration-tag">{res.duration}s</span>
                            </div>
                            <pre className="output-json">{JSON.stringify(res.outputs, null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="phase3-notice">
                      <Info size={16} />
                      <span>Phase 5 Policy Engine: Intercepts high-risk actions. Approving resumes execution through adapters.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-selection-placeholder">
                <Wand2 size={40} />
                <h3>Select a Workflow Definition</h3>
                <p>Click any workflow card on the left to inspect parameters, generate an Execution Plan, and run the Orchestration Engine.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowPage;
