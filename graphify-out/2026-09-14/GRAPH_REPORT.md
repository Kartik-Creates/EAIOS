# Graph Report - EAIOS  (2026-09-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2041 nodes · 4978 edges · 120 communities (94 shown, 8 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 520 edges (avg confidence: 0.92)
- Token cost: 80,034 input · 2,276 output

## Graph Freshness
- Built from commit: `6f1464c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Briefing & Chat API Tests
- Workflow Approval API Routes
- Integration Brand Icons
- Briefing Orchestration Tests
- Text Embedding Service
- Circuit Breaker Logic
- UI Toggle & Card Components
- Protected Routes & Chat UI
- Redis JWT Token Store
- Chat Input & Logo Components
- Integration Connector Specs
- Chat Endpoint Test Fixtures
- Briefing Item Detail Service
- Analytics & Audit Services
- Workflow Planning Exceptions
- Workflow Approval Policy Rules
- Workflow Step Execution
- Rate Limiting & Hardening
- Chat Message UI Components
- Auth & RBAC Dependencies
- LLM Provider Service Tests
- Connection & Service Picker Modals
- Workflow Trigger Scheduler
- Integration Disconnect Tests
- Workflow Schemas
- Chat Message Model & Schemas
- Drive Sync Tests
- Daily Briefing Schemas
- Workflow Definition Registry
- Frontend NPM Dependencies
- Frontend Package Config
- Workflow Frontend Types
- DB Models & Migrations Setup
- OAuth State & Connect Flow
- Document Management Endpoints
- Notifications API
- Workflow Execution Actions
- Chat Tool Dispatch
- Generic OAuth Integration Tests
- User Notification Model & Tests
- LLM Service Core
- Search Endpoint RBAC Tests
- RBAC Boundary Tests
- TypeScript Config
- Search Router & Schemas
- Workflow State Machine
- Document Ingestion Tests
- Token Encryption & Drive Sync
- Meeting Summary Extraction Tests
- Jira Token & Briefing Tests
- App Layout & Sidebar
- Document Chunking & Ingestion
- Adapter Error Exceptions
- Dashboard Page UI
- Workflow Run Audit & Dashboard
- Base Integration Adapter
- Auth Login/Refresh Tests
- App Context Providers
- Meeting Summary Model & Service
- Chat Greeting Handling
- Meeting Summarize Router
- Slack Briefing Tests
- Test Fixture Mocks
- Auth Context & Types
- Documents Page UI
- Meeting Page UI
- Briefing & Connector Routes
- Briefing/Meeting Adapter Interfaces
- API Client Services
- Jira Adapter Tests
- Background Execution Runner
- Workflow Scheduler Interface
- Text Chunking Service
- Adapter Registry
- Frontend Dev Dependencies
- Search Overlay Mocks
- React Error Boundary
- App Settings & CORS Config
- Document Text Extraction
- Drive Integration Adapter
- Execution History Service
- Frontend Role Hierarchy
- Search Hook & Service
- Company Brain Adapter
- GitHub Integration Adapter
- Gmail Integration Adapter
- Slack Integration Adapter
- Enterprise Template Library
- Global Exception Handler
- Adapter Action Interface
- Workflow Execution Engine
- Refresh Token Rotation Tests
- NPM Build Scripts
- Split Text Animation
- Admin Service & Types
- Token Encryption Utility
- Sub-Workflow Composition Engine
- Health/Root Endpoint Tests
- Build Tool Dependencies
- API Routes Config
- Vercel Deployment Config
- Vite Build Config

## God Nodes (most connected - your core abstractions)
1. `User` - 115 edges
2. `SourceResult` - 71 edges
3. `react` - 52 edges
4. `BriefingItem` - 47 edges
5. `register_and_login()` - 45 edges
6. `WorkflowDefinition` - 44 edges
7. `ExecutionPlan` - 43 edges
8. `get_db()` - 41 edges
9. `WorkflowRunStatus` - 38 edges
10. `OAuthToken` - 37 edges

## Surprising Connections (you probably didn't know these)
- `test_adapter_connection_validation()` --uses--> `IntegrationType`  [INFERRED]
  backend/tests/test_workflow_adapters.py → backend/app/workflows/enums.py
- `ApprovalEngine` --uses--> `ExecutionPlan`  [INFERRED]
  backend/app/workflows/approval_engine.py → backend/app/workflows/plan.py
- `PolicyEngine` --uses--> `ApprovalDecision`  [INFERRED]
  backend/app/workflows/policy.py → backend/app/workflows/approval_models.py
- `get_pending_approvals()` --uses--> `ApprovalLifecycleState`  [INFERRED]
  backend/app/routers/dashboard.py → backend/app/workflows/approval_models.py
- `WorkflowOrchestrator` --uses--> `ApprovalLifecycleState`  [INFERRED]
  backend/app/workflows/orchestrator.py → backend/app/workflows/approval_models.py

## Import Cycles
- None detected.

## Communities (120 total, 8 thin omitted)

### Community 0 - "Briefing & Chat API Tests"
Cohesion: 0.04
Nodes (34): _add_mock_oauth_token(), _create_test_user(), asyncio, User, Stat card verification: confirm Open Tickets and Pending Reviews show non-zero…, HTML entities in email subject/snippet (like &#39;) must be decoded cleanly., Automated notification emails (no-reply, Supabase alerts, etc.) must be…, Test GET /api/v1/briefing/{source}/{item_id} and prove server-side cross-user… (+26 more)

### Community 1 - "Workflow Approval API Routes"
Cohesion: 0.05
Nodes (52): ApprovalRequestModel, delete_workflow_schedule(), get_approval_request(), get_circuit_breaker_status(), get_execution_event_timeline(), get_execution_history_details(), get_system_health(), get_workflow_analytics() (+44 more)

### Community 2 - "Integration Brand Icons"
Cohesion: 0.05
Nodes (42): AsanaIcon, BrandIconProps, ClickUpIcon, ConfluenceIcon(), CustomIntegrationIcon, DiscordIcon(), GitHubIcon(), GitLabIcon() (+34 more)

### Community 3 - "Briefing Orchestration Tests"
Cohesion: 0.09
Nodes (47): BriefingItem, SourceResult, When all 4 sources are connected and return data, briefing synthesizes all…, When 2 of 4 sources are disconnected, partial briefing completes and notes…, When 1 of 4 sources fails/times out, the other 3 return cleanly without hanging., Execution time of asyncio.gather across 4 mocked tool functions must be close…, test_briefing_orchestration_all_connected(), mock_cal() (+39 more)

### Community 4 - "Text Embedding Service"
Cohesion: 0.07
Nodes (42): embed_text(), embed_texts(), _embed_texts_gemini(), _embed_texts_ollama(), EmbeddingServiceError, RuntimeError, Embed a single text string using the configured EMBEDDING_PROVIDER., Batch-embed texts using the configured EMBEDDING_PROVIDER ('ollama' or… (+34 more)

### Community 5 - "Circuit Breaker Logic"
Cohesion: 0.06
Nodes (34): CircuitBreakerConfig, CircuitBreakerRegistry, CircuitState, ProviderCircuitBreaker, Any, BaseModel, str, Tracks adapter failures for a specific provider integration. Protects external… (+26 more)

### Community 6 - "UI Toggle & Card Components"
Cohesion: 0.10
Nodes (43): CustomIntegrationModal(), Card, ToggleSwitch(), ToggleSwitchProps, useInView(), useReducedMotion(), useScrollReveal(), buttonTapVariants (+35 more)

### Community 7 - "Protected Routes & Chat UI"
Cohesion: 0.10
Nodes (32): AdminRoute(), ProtectedRoute(), ACCEPTED_TYPES, FloatingChatAssistant(), formatFileSize(), ChatEntry, loadChats(), RecentChatsPanel() (+24 more)

### Community 8 - "Redis JWT Token Store"
Cohesion: 0.10
Nodes (42): add_active_jti(), clear_active_jtis(), get_active_jtis(), is_jti_revoked(), Store the issued JTI in the user's active set and set/refresh its TTL., Remove a specific JTI from the user's active set., Retrieve all currently active JTIs for a user., Clear all active JTIs for a user (e.g. on logout). (+34 more)

### Community 9 - "Chat Input & Logo Components"
Cohesion: 0.10
Nodes (30): ACCEPTED_TYPES, ChatInput(), ChatInputProps, formatFileSize(), UnifyLogoProps, CATEGORY_LABELS, CustomIntegrationModalProps, FormData (+22 more)

### Community 10 - "Integration Connector Specs"
Cohesion: 0.08
Nodes (26): ConnectorSpec, Base specification for UnifyAI Integration Connectors., Canonical specification for an integration connector in UnifyAI. Serves as the…, Connectors package — single source of truth for all integration providers., ConnectorRegistry, Connector Registry with filesystem auto-discovery and duplicate-name…, Registry managing all discovered integration connectors., Auto-discover all connectors in the connectors package directory. Scans all… (+18 more)

### Community 11 - "Chat Endpoint Test Fixtures"
Cohesion: 0.09
Nodes (40): get_password_hash(), Base, Chat queries the RAG pipeline couldn't confidently answer. Feeds the Admin…, UnansweredQuery, fake_generate_answer(), register_and_login(), fake_generate_greeting(), fake_generate_tool_response() (+32 more)

### Community 12 - "Briefing Item Detail Service"
Cohesion: 0.09
Nodes (40): BriefingItemDetail, Full item detail returned by the item-detail endpoint for in-app modal display., get_briefing_item_detail(), get_calendar_briefing(), get_calendar_item_detail(), get_calendar_recent(), get_decrypted_token(), get_drive_briefing() (+32 more)

### Community 13 - "Analytics & Audit Services"
Cohesion: 0.09
Nodes (25): AnalyticsEngine, BaseModel, Analytics & Monitoring Engine. Computes workflow metrics, success rates,…, WorkflowAnalyticsSummary, AuditService, Any, Audit Service for recording lifecycle events and querying audit logs. Does NOT…, EventStore (+17 more)

### Community 14 - "Workflow Planning Exceptions"
Cohesion: 0.10
Nodes (25): ParameterValidationError, Any, Exception, Raised when requested workflow ID is not registered., Raised when parameter input validation fails., Base exception for workflow planning errors., WorkflowNotFoundError, WorkflowPlanningError (+17 more)

### Community 15 - "Workflow Approval Policy Rules"
Cohesion: 0.13
Nodes (17): WorkflowDefinition, AdminRoleRule, BasePolicyRule, CriticalRiskRule, ExplicitConfirmationRule, HighRiskRule, ABC, Abstract base rule contract for Policy Engine. (+9 more)

### Community 16 - "Workflow Step Execution"
Cohesion: 0.14
Nodes (24): WorkflowRunStatus, Config, ExecutionResult, BaseModel, Any, Executes exactly one ExecutionPlanStep. Delegates to registered step handler.…, Execute a single step using its corresponding handler., WorkflowExecutor (+16 more)

### Community 17 - "Rate Limiting & Hardening"
Cohesion: 0.09
Nodes (17): HardeningService, BaseModel, Exception, RateLimiter, RateLimiterExceededError, Raised when workflow execution rate limit is exceeded., Sliding Window Rate Limiter for Workflow Executions., Production Hardening & Observability Service. (+9 more)

### Community 18 - "Chat Message UI Components"
Cohesion: 0.11
Nodes (22): ChatMessage(), ChatMessageProps, messageEnter, CitationCard(), CitationCardProps, Badge(), BadgeProps, ChatContext (+14 more)

### Community 19 - "Auth & RBAC Dependencies"
Cohesion: 0.11
Nodes (17): get_db(), Dependency factory for RBAC enforcement. Usage in any router:…, require_role(), Request, _rate_limit_key(), Rate-limit by authenticated user id; fall back to client IP. Reads the bearer…, get, root() (+9 more)

### Community 20 - "LLM Provider Service Tests"
Cohesion: 0.11
Nodes (24): generate_completion(), generate_tool_response(), Route completion request to the configured LLM_PROVIDER ('ollama' or 'gemini')., Generate a natural-language answer from tool execution results. This used to…, asyncio, Unit tests for the swappable LLM provider abstraction (Ollama vs Gemini google-…, When LLM_PROVIDER='ollama', generate_completion routes to Ollama API., If both the configured model AND the fallback model fail, the error surfaces —… (+16 more)

### Community 21 - "Connection & Service Picker Modals"
Cohesion: 0.14
Nodes (22): ConnectionCard(), ConnectionCardProps, ManualTokenModal(), ManualTokenModalProps, ServicePickerModal(), ServicePickerModalProps, PROVIDER_COLORS, PROVIDER_MAP (+14 more)

### Community 22 - "Workflow Trigger Scheduler"
Cohesion: 0.15
Nodes (19): str, ScheduleType, Any, Generic Trigger Engine. Receives trigger events from multiple sources (MANUAL,…, Trigger workflow invocation from any trigger source. Returns instance metadata…, TriggerEngine, Config, BaseModel (+11 more)

### Community 23 - "Integration Disconnect Tests"
Cohesion: 0.19
Nodes (25): create_access_token(), Any, OAuthToken, Base, _connect_provider(), _create_user(), asyncio, AsyncSession (+17 more)

### Community 24 - "Workflow Schemas"
Cohesion: 0.36
Nodes (14): Config, BaseModel, ValidationRules, WorkflowApprovalRead, WorkflowParameter, WorkflowRunRead, WorkflowStepDefinition, WorkflowStepRunRead (+6 more)

### Community 25 - "Chat Message Model & Schemas"
Cohesion: 0.15
Nodes (19): ChatMessage, Base, ChatMessage model — persists user chat queries for the activity feed. Stores…, Chat endpoint with greeting heuristic and tool-calling support. Flow: query →…, ChatRequest, ChatResponse, Citation, BaseModel (+11 more)

### Community 26 - "Drive Sync Tests"
Cohesion: 0.11
Nodes (11): asyncio, Regression test: the OAuth callback stores the connection under the canonical…, A Drive file named like a Google Meet transcript must be summarized as a…, A non-admin user cannot trigger Drive sync for another user's account., test_drive_sync_rbac_scoping(), test_drive_sync_routes_meet_transcripts_to_meeting_pipeline(), mock_ingest(), test_drive_sync_success() (+3 more)

### Community 27 - "Daily Briefing Schemas"
Cohesion: 0.13
Nodes (16): BriefingResponse, BaseModel, Schemas for Daily Briefing Agent tools and orchestration endpoint., SourceStatus, generate_daily_briefing(), get_jira_briefing(), Fetch Jira tickets assigned to the user that are overdue or due today., Execute all implemented connector briefing functions concurrently, aggregate… (+8 more)

### Community 28 - "Workflow Definition Registry"
Cohesion: 0.10
Nodes (12): Clear all registered workflow definitions., Registry-First Thread-Safe Workflow Registry. Acts as the primary source of…, Internal helper to populate builtin workflow definitions., Register a workflow definition in the registry. Fails fast if a workflow with…, Remove a workflow definition from the registry., Retrieve a workflow definition by ID and optional version. If version is…, Check if a workflow definition exists in the registry., Return all registered workflow definitions. (+4 more)

### Community 29 - "Frontend NPM Dependencies"
Cohesion: 0.09
Nodes (23): dependencies, axios, clsx, framer-motion, gsap, @gsap/react, lucide-react, meshline (+15 more)

### Community 30 - "Frontend Package Config"
Cohesion: 0.09
Nodes (21): name, private, type, version, clsx, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+13 more)

### Community 31 - "Workflow Frontend Types"
Cohesion: 0.13
Nodes (20): ApprovalLifecycleState, ApprovalRequestModel, CapabilityType, ExecutionPlanStep, ExecutionResult, FieldValidationError, IntegrationType, ParameterType (+12 more)

### Community 32 - "DB Models & Migrations Setup"
Cohesion: 0.19
Nodes (13): do_run_migrations(), run_async_migrations(), run_migrations_online(), Base, str, Workflow, WorkflowApproval, WorkflowApprovalStatus (+5 more)

### Community 33 - "OAuth State & Connect Flow"
Cohesion: 0.12
Nodes (21): Normalize provider name and return canonical name + config, or None if unknown., resolve_provider(), consume_oauth_state(), Store OAuth state JTI in Redis with a short TTL (10 minutes)., Retrieve and delete an OAuth state JTI atomically (single-use enforcement)., store_oauth_state(), connect_oauth_provider(), disconnect_integration() (+13 more)

### Community 34 - "Document Management Endpoints"
Cohesion: 0.19
Nodes (19): delete_document_endpoint(), ingest_document_endpoint(), list_documents_endpoint(), AsyncSession, delete, Depends, get, post (+11 more)

### Community 35 - "Notifications API"
Cohesion: 0.16
Nodes (19): get_current_user(), AsyncSession, Depends, get_notifications(), mark_all_notifications_read(), mark_notifications_read(), MarkReadRequest, NotificationRead (+11 more)

### Community 36 - "Workflow Execution Actions"
Cohesion: 0.11
Nodes (20): approve_workflow_request(), clone_workflow(), create_workflow_schedule(), execute_workflow_plan(), generate_execution_plan(), install_enterprise_template(), publish_workflow_version(), Any (+12 more)

### Community 37 - "Chat Tool Dispatch"
Cohesion: 0.17
Nodes (17): dispatch_tool_call(), _format_document_results(), _format_source_result(), AsyncSession, Chat Tool-Calling Service — tool schemas and dispatch for Gemini function-…, Format a SourceResult into a prompt-injection-safe data block for the LLM.…, Format retrieved document chunks into a prompt-injection-safe data block., Execute a tool call and return (formatted_result_text, source_label, chunks).… (+9 more)

### Community 38 - "Generic OAuth Integration Tests"
Cohesion: 0.15
Nodes (14): Integration, Base, Tracks OAuth-connected services per user (Google Drive, Gmail, Slack, etc.)., asyncio, Tests for the generic OAuth 2.0 Connect Engine across all 5 providers: Gmail,…, GET /api/v1/integrations/{provider}/connect builds a valid auth URL for each…, An unapproved/unknown provider name in the path must return 400 Bad Request., A callback with a missing or forged CSRF state token redirects with an error. (+6 more)

### Community 39 - "User Notification Model & Tests"
Cohesion: 0.20
Nodes (16): Base, UserNotification model — per-user dismissible notification with read state.…, UserNotification, Notification creation utility — called from actual event write paths.…, _create_test_user(), asyncio, User, Unit and isolation tests for notifications API (GET/POST… (+8 more)

### Community 40 - "LLM Service Core"
Cohesion: 0.15
Nodes (18): _build_gemini_tool_declarations(), _build_prompt(), generate_answer(), _generate_gemini_completion(), _generate_ollama_completion(), generate_with_tools(), _generate_with_tools_gemini(), LLMServiceError (+10 more)

### Community 41 - "Search Endpoint RBAC Tests"
Cohesion: 0.17
Nodes (18): RetrievedMeetingSummary, fake_semantic_search_meetings(), _patch_retrieval(), asyncio, fixture, Tests for GET /api/v1/search. See tests/rag_fixtures.py for why retrieval is…, Meeting summaries must be searchable via the same endpoint as documents., An employee searching for HR-restricted content must get no results. (+10 more)

### Community 42 - "RBAC Boundary Tests"
Cohesion: 0.15
Nodes (18): asyncio, RBAC boundary tests — prove require_role() enforcement works. These tests…, Register payload containing 'admin' or 'manager' role must still assign…, A request with no token to a protected route returns 401, not a crash., Helper: register a user and login, returning (access_token, user_data)., A garbage Bearer token returns 401, not a 500 or silent pass-through., An admin user can access GET /api/v1/admin/users., An employee (default role) must be rejected with 403 on admin routes. (+10 more)

### Community 43 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 44 - "Search Router & Schemas"
Cohesion: 0.15
Nodes (16): AsyncSession, Depends, get, Query, search(), BaseModel, SearchResponse, SearchResult (+8 more)

### Community 45 - "Workflow State Machine"
Cohesion: 0.20
Nodes (12): InvalidStateTransitionError, Exception, str, Raised when an invalid state transition is attempted., Explicit lifecycle state machine enforcing valid workflow state transitions., Attempt to transition to target_state. Raises InvalidStateTransitionError if…, WorkflowState, WorkflowStateMachine (+4 more)

### Community 46 - "Document Ingestion Tests"
Cohesion: 0.24
Nodes (17): fake_embed_texts(), _make_admin(), _patch_embedding(), asyncio, fixture, Tests for POST /api/v1/documents (manual Company Brain ingestion, admin-only),…, test_documents_delete_endpoint(), test_documents_ingest_missing_content_returns_422() (+9 more)

### Community 47 - "Token Encryption & Drive Sync"
Cohesion: 0.21
Nodes (15): decrypt_token(), encrypt_token(), DriveSyncError, _is_meet_transcript(), AsyncSession, RuntimeError, Base error for Google Drive sync flow., Refresh the expired Google access token using the refresh token. (+7 more)

### Community 48 - "Meeting Summary Extraction Tests"
Cohesion: 0.18
Nodes (15): _extract_json_object(), Best-effort extraction of a JSON object from an LLM completion. Models…, fake_embed_text(), fake_generate_completion(), _patch_llm_and_embedding(), asyncio, fixture, Tests for POST /api/v1/meeting/summarize and the extraction service. LLM calls… (+7 more)

### Community 49 - "Jira Token & Briefing Tests"
Cohesion: 0.12
Nodes (6): When an expired Jira token is refreshed, the new encrypted token and expiration…, Regression: get_jira_recent() (chat tool) must NOT filter out Done tickets the…, test_jira_briefing_success(), mock_post(), test_jira_recent_includes_done_tickets(), test_jira_token_refresh_persists_to_db()

### Community 50 - "App Layout & Sidebar"
Cohesion: 0.19
Nodes (13): AppLogo(), AppLogoProps, logoVariants, DashboardLayout(), ICON_MAP, Sidebar(), SidebarProps, Topbar() (+5 more)

### Community 51 - "Document Chunking & Ingestion"
Cohesion: 0.23
Nodes (12): Chunk, Base, Document, Base, ingest_document(), AsyncSession, Chunk, embed, and store a document's content as searchable vector chunks., create_notification() (+4 more)

### Community 52 - "Adapter Error Exceptions"
Cohesion: 0.23
Nodes (13): AdapterAuthenticationError, AdapterError, AdapterPermissionError, AdapterRateLimitError, AdapterResourceNotFoundError, AdapterTemporaryFailure, Exception, Raised when authentication credentials or OAuth tokens are missing/invalid. (+5 more)

### Community 53 - "Dashboard Page UI"
Cohesion: 0.22
Nodes (14): DashboardPage(), decodeEntities(), formatRelativeTime(), getActivityIconComponent(), getCurrentDate(), getGreeting(), getSourceIcon(), DashboardPage (+6 more)

### Community 54 - "Workflow Run Audit & Dashboard"
Cohesion: 0.21
Nodes (14): Base, Immutable audit trail for agent workflow executions. Each row records one…, WorkflowRun, ActivityItem, get_pending_approvals(), get_recent_user_activity(), PendingApprovalItem, AsyncSession (+6 more)

### Community 55 - "Base Integration Adapter"
Cohesion: 0.27
Nodes (5): BaseIntegrationAdapter, ABC, Name of the integration provider., Validate if required credentials and tokens exist., Abstract Base Adapter for all EAIOS Workflow Integrations. Ensures provider-…

### Community 56 - "Auth Login/Refresh Tests"
Cohesion: 0.20
Nodes (14): asyncio, An access token must not be accepted at the /refresh endpoint., A refresh token must not be accepted as a Bearer token on /me., Sending 6 rapid login requests triggers the 5/minute rate limit on the 6th…, Login → use refresh token → get new access token → verify it works., Login → logout → confirm old refresh token is rejected., test_login_rate_limit_returns_429(), test_logout_revokes_refresh() (+6 more)

### Community 57 - "App Context Providers"
Cohesion: 0.20
Nodes (10): App(), AuthProvider(), ChatProvider(), getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider() (+2 more)

### Community 58 - "Meeting Summary Model & Service"
Cohesion: 0.22
Nodes (11): Meeting, Base, MeetingSummary, Base, extract_meeting_intelligence(), AsyncSession, Call the LLM to extract a title, summary, decisions, and action items., Extract intelligence from a transcript, embed the summary, and persist both… (+3 more)

### Community 59 - "Chat Greeting Handling"
Cohesion: 0.15
Nodes (13): chat(), _is_greeting(), AsyncSession, Depends, limit, post, Request, Build a user-facing answer directly from the already-fetched tool data, used… (+5 more)

### Community 60 - "Meeting Summarize Router"
Cohesion: 0.29
Nodes (11): AsyncSession, Depends, limit, post, Request, summarize_meeting_endpoint(), ActionItem, Decision (+3 more)

### Community 61 - "Slack Briefing Tests"
Cohesion: 0.15
Nodes (6): get_slack_briefing(), Fetch recent messages from the user's most active Slack channels. Slack's Web…, Slack returns HTTP 200 with ok: false on failure — must be treated as a real…, test_slack_briefing_api_error_returns_error_not_raised(), test_slack_briefing_not_connected(), test_slack_briefing_success()

### Community 62 - "Test Fixture Mocks"
Cohesion: 0.15
Nodes (4): client_fixture(), db_session_fixture(), mock_redis_helpers(), fixture

### Community 63 - "Auth Context & Types"
Cohesion: 0.31
Nodes (10): AuthContext, AuthContextType, MOCK_USER, AuthState, LoginPayload, NOTE: Backend expects `username` field (not `email`) per OAuth2 spec., RefreshRequest, RegisterPayload (+2 more)

### Community 64 - "Documents Page UI"
Cohesion: 0.23
Nodes (11): ACCEPTED_EXTENSIONS, ACCEPTED_TYPES, DisplayFile, DocumentsPage(), formatFileSize(), getFileExtension(), getFileIcon(), getStatusBadge() (+3 more)

### Community 65 - "Meeting Page UI"
Cohesion: 0.24
Nodes (9): MeetingPage, meetingService, ActionItem, Decision, MeetingErrorResponse, MeetingState, MeetingStatus, MeetingSummarizeRequest (+1 more)

### Community 66 - "Briefing & Connector Routes"
Cohesion: 0.23
Nodes (12): get_briefing_item_detail_endpoint(), get_daily_briefing_endpoint(), list_connectors_endpoint(), AsyncSession, Depends, get, limit, post (+4 more)

### Community 67 - "Briefing/Meeting Adapter Interfaces"
Cohesion: 0.22
Nodes (3): BriefingAdapter, MeetingAdapter, Any

### Community 68 - "API Client Services"
Cohesion: 0.24
Nodes (7): apiClient, HealthCheckResponse, healthService, NotificationItem, notificationService, storage, axios

### Community 69 - "Jira Adapter Tests"
Cohesion: 0.27
Nodes (4): JiraAdapter, Any, test_adapter_connection_validation(), test_adapter_registry_resolution()

### Community 70 - "Background Execution Runner"
Cohesion: 0.22
Nodes (6): BaseBackgroundRunner, ABC, Any, Abstract interface for background execution runners (Celery, Redis Queue,…, Queue plan for asynchronous background execution. Returns task_id., Get status of queued background execution.

### Community 71 - "Workflow Scheduler Interface"
Cohesion: 0.22
Nodes (6): Config, Any, BaseModel, Abstract Scheduler interface for workflow automation schedules. Decoupled from…, ScheduledJob, WorkflowScheduler

### Community 72 - "Text Chunking Service"
Cohesion: 0.39
Nodes (7): chunk_text(), Split text into overlapping, sentence-aware chunks for embedding., test_consecutive_chunks_share_overlap(), test_empty_text_returns_no_chunks(), test_long_text_splits_into_multiple_chunks_within_size(), test_oversized_single_sentence_is_hard_split(), test_short_text_returns_single_chunk()

### Community 73 - "Adapter Registry"
Cohesion: 0.33
Nodes (4): AdapterRegistry, Any, Adapter Registry resolving integration adapters by IntegrationType. Decouples…, Validate connections for a list of integrations.

### Community 74 - "Frontend Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @types/node, @types/react, @types/react-dom, @typescript-eslint/eslint-plugin (+1 more)

### Community 75 - "Search Overlay Mocks"
Cohesion: 0.25
Nodes (6): MOCK_ICONS, SearchOverlayProps, RECENT_CHATS, RECENT_DOCUMENTS, SEARCH_ALL_MOCKS, SearchMockItem

### Community 76 - "React Error Boundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, Props, State

### Community 77 - "App Settings & CORS Config"
Cohesion: 0.25
Nodes (7): Config, Any, Settings, startup_security_checks(), BaseSettings, field_validator, on_event

### Community 78 - "Document Text Extraction"
Cohesion: 0.50
Nodes (7): DocumentParserError, _extract_from_docx(), _extract_from_pdf(), _extract_from_plaintext(), extract_text_from_file(), Extract plain text from uploaded file bytes based on file extension. Supports:…, Raised when text extraction from a file fails or produces no usable content.

### Community 79 - "Drive Integration Adapter"
Cohesion: 0.32
Nodes (4): DriveAdapter, Any, AdapterConfigurationError, Raised when integration settings are misconfigured.

### Community 80 - "Execution History Service"
Cohesion: 0.36
Nodes (5): Config, ExecutionHistorySummary, BaseModel, HistoryService, Service for building and deriving summarized execution histories directly from…

### Community 81 - "Frontend Role Hierarchy"
Cohesion: 0.29
Nodes (5): ROLE_HIERARCHY, ROLE_META, RoleMeta, ROLES, Role

### Community 82 - "Search Hook & Service"
Cohesion: 0.52
Nodes (4): searchService, SearchParams, SearchResponse, SearchState

### Community 87 - "Enterprise Template Library"
Cohesion: 0.33
Nodes (4): EnterpriseTemplate, BaseModel, Enterprise Template Library Service., TemplateLibraryService

### Community 88 - "Global Exception Handler"
Cohesion: 0.40
Nodes (5): global_exception_handler(), Exception, Request, Ensure any unhandled server error returns clean JSON and includes CORS headers,…, exception_handler

### Community 89 - "Adapter Action Interface"
Cohesion: 0.40
Nodes (3): Any, Execute a workflow-safe operation through existing EAIOS services., Return health status dictionary.

### Community 90 - "Workflow Execution Engine"
Cohesion: 0.50
Nodes (3): Resume workflow execution after approval decision., Execute all steps in an ExecutionPlan sequentially unless paused by policy., ExecutionResult

### Community 91 - "Refresh Token Rotation Tests"
Cohesion: 0.60
Nodes (4): asyncio, test_rtr_logout_revokes_current_refresh(), test_rtr_replay_fails(), test_rtr_rotated_token_works()

### Community 92 - "NPM Build Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 93 - "Split Text Animation"
Cohesion: 0.40
Nodes (3): SplitTextProps, gsap, @gsap/react

### Community 94 - "Admin Service & Types"
Cohesion: 0.50
Nodes (3): adminService, AdminState, AdminUser

### Community 96 - "Sub-Workflow Composition Engine"
Cohesion: 0.50
Nodes (3): Any, Sub-Workflow & Workflow Composition Engine. Enables workflow steps to invoke…, SubWorkflowEngine

### Community 97 - "Health/Root Endpoint Tests"
Cohesion: 0.67
Nodes (3): asyncio, test_health_endpoint(), test_root_endpoint()

### Community 107 - "Build Tool Dependencies"
Cohesion: 0.67
Nodes (3): overrides, brace-expansion, esbuild

## Knowledge Gaps
- **177 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 828 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Redis JWT Token Store` to `Briefing & Chat API Tests`, `Workflow Approval API Routes`, `Integration Connector Specs`, `Chat Endpoint Test Fixtures`, `Briefing Item Detail Service`, `Auth & RBAC Dependencies`, `Integration Disconnect Tests`, `Chat Message Model & Schemas`, `Drive Sync Tests`, `Daily Briefing Schemas`, `DB Models & Migrations Setup`, `OAuth State & Connect Flow`, `Document Management Endpoints`, `Notifications API`, `Workflow Execution Actions`, `Chat Tool Dispatch`, `User Notification Model & Tests`, `Search Endpoint RBAC Tests`, `RBAC Boundary Tests`, `Search Router & Schemas`, `Document Ingestion Tests`, `Workflow Run Audit & Dashboard`, `Chat Greeting Handling`, `Meeting Summarize Router`, `Slack Briefing Tests`, `Briefing & Connector Routes`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `WorkflowRunStatus` connect `Workflow Step Execution` to `DB Models & Migrations Setup`, `Workflow Approval API Routes`, `Jira Adapter Tests`, `Analytics & Audit Services`, `Workflow State Machine`, `Execution History Service`, `Workflow Trigger Scheduler`, `Workflow Schemas`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `ExecutionPlan` connect `Workflow Approval Policy Rules` to `Sub-Workflow Composition Engine`, `Workflow Approval API Routes`, `Workflow Execution Actions`, `Background Execution Runner`, `Analytics & Audit Services`, `Workflow Planning Exceptions`, `Workflow Step Execution`, `Workflow Trigger Scheduler`, `Workflow Schemas`, `Workflow Execution Engine`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 84 inferred relationships involving `User` (e.g. with `ConnectorSpec` and `get_current_user()`) actually correct?**
  _`User` has 84 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `SourceResult` (e.g. with `ConnectorSpec` and `generate_daily_briefing()`) actually correct?**
  _`SourceResult` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `BriefingItem` (e.g. with `generate_daily_briefing()` and `test_briefing_orchestration_all_connected()`) actually correct?**
  _`BriefingItem` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `Config`, `Config` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._