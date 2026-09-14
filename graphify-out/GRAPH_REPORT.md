# Graph Report - EAIOS  (2026-09-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2058 nodes · 4932 edges · 118 communities (85 shown, 15 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 510 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f1464c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routers/workflow.py
- _create_test_user
- Document
- ExecutionPlan
- SourceResult
- react
- AdapterConfigurationError
- LoginPage.tsx
- embed_texts
- generate_completion
- models/__init__.py
- briefing_service.py
- index.ts
- ConnectorSpec
- AppRoutes.tsx
- framer-motion
- retrieval_service.py
- WorkflowEventType
- orchestrator.py
- auth.py
- User
- WorkflowDefinition
- register_and_login
- WorkflowOrchestrator
- AdapterRegistry
- trigger_drive_sync
- test_dashboard_and_disconnect.py
- WorkflowPlanner
- Workflow Definition Registry
- Frontend NPM Dependencies
- workflow.types.ts
- models/user.py
- test_meeting.py
- test_drive_sync_routes_meet_transcripts_to_meeting_pipeline
- package.json
- WorkflowPage.tsx
- get_password_hash
- WorkflowRunStatus
- ConnectionCard.tsx
- test_briefing.py
- test_rbac.py
- compilerOptions
- routers/chat.py
- decrypt_token
- test_workflow_productization.py
- notifications.py
- DAGGraph
- DashboardPage.tsx
- hardening.py
- AdminPage.tsx
- Topbar.tsx
- schemas/__init__.py
- InMemoryBackgroundRunner
- OAuthToken
- mock_redis_helpers
- test_oauth_callback_success_stores_encrypted_tokens
- test_notifications.py
- AuthContext.tsx
- DocumentsPage.tsx
- get_briefing_item_detail_endpoint
- circuit_breaker.py
- rag_fixtures.py
- test_google_token_refresh_persists_to_db
- axios.ts
- sync_drive_documents
- ScheduledJob
- meeting.types.ts
- test_workflow_dag_advanced.py
- validator.py
- devDependencies
- ErrorBoundary
- Settings
- resilience.py
- test_jira_recent_includes_done_tickets
- test_gmail_recent_does_not_filter_to_unread_only
- roles.ts
- useSearch.ts
- list_users
- CompanyBrainAdapter
- DriveAdapter
- CircuitBreakerRegistry
- EnterpriseTemplate
- test_gmail_automated_email_filtering
- test_gmail_briefing_success
- global_exception_handler
- .execute_action
- test_rtr.py
- scripts
- SplitText.tsx
- TokenEncryption
- test_main.py
- overrides
- api.ts
- vercel.json
- @vitejs/plugin-react
- delete
- Depends
- get
- post
- Query

## God Nodes (most connected - your core abstractions)
1. `User` - 95 edges
2. `SourceResult` - 60 edges
3. `react` - 52 edges
4. `BriefingItem` - 45 edges
5. `register_and_login()` - 45 edges
6. `WorkflowDefinition` - 44 edges
7. `ExecutionPlan` - 43 edges
8. `WorkflowRunStatus` - 38 edges
9. `get_db()` - 37 edges
10. `cn()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `test_adapter_connection_validation()` --uses--> `IntegrationType`  [INFERRED]
  backend/tests/test_workflow_adapters.py → backend/app/workflows/enums.py
- `test_scheduler_job_creation_and_deletion()` --uses--> `ScheduleType`  [INFERRED]
  backend/tests/test_workflow_triggers_scheduler.py → backend/app/workflows/scheduler.py
- `test_scheduler_validation_errors()` --uses--> `ScheduleType`  [INFERRED]
  backend/tests/test_workflow_triggers_scheduler.py → backend/app/workflows/scheduler.py
- `TriggerEngine` --uses--> `WorkflowRunStatus`  [INFERRED]
  backend/app/workflows/trigger_engine.py → backend/app/models/workflow.py
- `WorkflowInstance` --uses--> `WorkflowRunStatus`  [INFERRED]
  backend/app/workflows/workflow_instance.py → backend/app/models/workflow.py

## Import Cycles
- None detected.

## Communities (118 total, 15 thin omitted)

### Community 0 - "routers/workflow.py"
Cohesion: 0.04
Nodes (75): approve_workflow_request(), clone_workflow(), create_workflow_schedule(), delete_workflow_schedule(), execute_workflow_plan(), generate_execution_plan(), get_approval_request(), get_circuit_breaker_status() (+67 more)

### Community 1 - "_create_test_user"
Cohesion: 0.04
Nodes (35): _add_mock_oauth_token(), _create_test_user(), asyncio, User, Stat card verification: confirm Open Tickets and Pending Reviews show non-zero…, HTML entities in email subject/snippet (like &#39;) must be decoded cleanly., Test GET /api/v1/briefing/{source}/{item_id} and prove server-side cross-user…, Test that GET /api/v1/briefing/{source}/{item_id} enforces rate limits and… (+27 more)

### Community 2 - "Document"
Cohesion: 0.07
Nodes (59): Chunk, Base, Document, Base, delete_document_endpoint(), ingest_document_endpoint(), list_documents_endpoint(), AsyncSession (+51 more)

### Community 3 - "ExecutionPlan"
Cohesion: 0.08
Nodes (33): ApprovalRequestModel, ApprovalEngine, Approval Engine responsible for managing approval request lifecycles. Handles…, Create a new pending approval request., Approve a pending request., Reject a pending request., Retrieve an approval request by ID., List approval requests with optional status filter. (+25 more)

### Community 4 - "SourceResult"
Cohesion: 0.08
Nodes (50): BriefingItem, SourceResult, When all 4 sources are connected and return data, briefing synthesizes all…, When 2 of 4 sources are disconnected, partial briefing completes and notes…, When 1 of 4 sources fails/times out, the other 3 return cleanly without hanging., Execution time of asyncio.gather across 4 mocked tool functions must be close…, test_briefing_orchestration_all_connected(), mock_cal() (+42 more)

### Community 5 - "react"
Cohesion: 0.08
Nodes (38): ACCEPTED_TYPES, ChatInput(), ChatInputProps, formatFileSize(), UnifyLogoProps, CATEGORY_LABELS, CustomIntegrationModalProps, FormData (+30 more)

### Community 6 - "AdapterConfigurationError"
Cohesion: 0.09
Nodes (26): BaseIntegrationAdapter, ABC, Name of the integration provider., Validate if required credentials and tokens exist., Abstract Base Adapter for all EAIOS Workflow Integrations. Ensures provider-…, AdapterAuthenticationError, AdapterConfigurationError, AdapterError (+18 more)

### Community 7 - "LoginPage.tsx"
Cohesion: 0.05
Nodes (41): AsanaIcon, BrandIconProps, ClickUpIcon, ConfluenceIcon(), CustomIntegrationIcon, DiscordIcon(), GitHubIcon(), GitLabIcon() (+33 more)

### Community 8 - "embed_texts"
Cohesion: 0.07
Nodes (42): embed_text(), embed_texts(), _embed_texts_gemini(), _embed_texts_ollama(), EmbeddingServiceError, RuntimeError, Embed a single text string using the configured EMBEDDING_PROVIDER., Batch-embed texts using the configured EMBEDDING_PROVIDER ('ollama' or… (+34 more)

### Community 9 - "generate_completion"
Cohesion: 0.07
Nodes (44): _build_gemini_tool_declarations(), _build_prompt(), generate_answer(), generate_completion(), _generate_gemini_completion(), generate_greeting(), _generate_ollama_completion(), generate_tool_response() (+36 more)

### Community 10 - "models/__init__.py"
Cohesion: 0.07
Nodes (37): do_run_migrations(), run_async_migrations(), run_migrations_online(), ChatMessage, Base, ChatMessage model — persists user chat queries for the activity feed. Stores…, Meeting, Base (+29 more)

### Community 11 - "briefing_service.py"
Cohesion: 0.09
Nodes (49): _as_utc(), get_briefing_item_detail(), get_calendar_briefing(), get_calendar_item_detail(), get_calendar_recent(), get_decrypted_token(), _get_decrypted_token_unlocked(), get_drive_briefing() (+41 more)

### Community 12 - "index.ts"
Cohesion: 0.10
Nodes (43): CustomIntegrationModal(), Card, ToggleSwitch(), ToggleSwitchProps, useInView(), useReducedMotion(), useScrollReveal(), buttonTapVariants (+35 more)

### Community 13 - "ConnectorSpec"
Cohesion: 0.08
Nodes (28): ConnectorSpec, Base specification for UnifyAI Integration Connectors., Canonical specification for an integration connector in UnifyAI. Serves as the…, Connectors package — single source of truth for all integration providers., ConnectorRegistry, Connector Registry with filesystem auto-discovery and duplicate-name…, Registry managing all discovered integration connectors., Auto-discover all connectors in the connectors package directory. Scans all… (+20 more)

### Community 14 - "AppRoutes.tsx"
Cohesion: 0.13
Nodes (24): AdminRoute(), ProtectedRoute(), ACCEPTED_TYPES, FloatingChatAssistant(), formatFileSize(), DashboardLayout(), ICON_MAP, Sidebar() (+16 more)

### Community 15 - "framer-motion"
Cohesion: 0.10
Nodes (27): ChatMessage(), ChatMessageProps, messageEnter, CitationCard(), CitationCardProps, ChatEntry, loadChats(), RecentChatsPanel() (+19 more)

### Community 16 - "retrieval_service.py"
Cohesion: 0.10
Nodes (31): AsyncSession, Depends, get, Query, search(), BaseModel, SearchResponse, SearchResult (+23 more)

### Community 17 - "WorkflowEventType"
Cohesion: 0.11
Nodes (21): AnalyticsEngine, BaseModel, Analytics & Monitoring Engine. Computes workflow metrics, success rates,…, WorkflowAnalyticsSummary, AuditService, Any, Audit Service for recording lifecycle events and querying audit logs. Does NOT…, EventStore (+13 more)

### Community 18 - "orchestrator.py"
Cohesion: 0.12
Nodes (25): AdapterTemporaryFailure, Raised when temporary network/timeout error occurs., Config, ExecutionResult, BaseModel, Any, Executes exactly one ExecutionPlanStep. Delegates to registered step handler.…, Execute a single step using its corresponding handler. (+17 more)

### Community 19 - "auth.py"
Cohesion: 0.11
Nodes (28): add_active_jti(), clear_active_jtis(), get_active_jtis(), is_jti_revoked(), Store the issued JTI in the user's active set and set/refresh its TTL., Remove a specific JTI from the user's active set., Retrieve all currently active JTIs for a user., Clear all active JTIs for a user (e.g. on logout). (+20 more)

### Community 20 - "User"
Cohesion: 0.16
Nodes (30): get_current_user(), get_db(), AsyncSession, Depends, verify_password(), Base, User, change_password() (+22 more)

### Community 21 - "WorkflowDefinition"
Cohesion: 0.32
Nodes (16): Config, BaseModel, ValidationRules, WorkflowApprovalRead, WorkflowDefinition, WorkflowParameter, WorkflowRunRead, WorkflowStepDefinition (+8 more)

### Community 22 - "register_and_login"
Cohesion: 0.15
Nodes (28): Base, Chat queries the RAG pipeline couldn't confidently answer. Feeds the Admin…, UnansweredQuery, register_and_login(), asyncio, Tests for POST /api/v1/chat — greeting heuristic, tool-calling, and RAG…, A narrow, single-app question must still route to that app's own tool, not the…, When a provider is not connected, chat tells the user clearly without flagging… (+20 more)

### Community 23 - "WorkflowOrchestrator"
Cohesion: 0.13
Nodes (19): Manages workflow lifecycle, policy evaluation, step execution sequence, and…, Resume workflow execution after approval decision., Execute all steps in an ExecutionPlan sequentially unless paused by policy., WorkflowOrchestrator, InvalidStateTransitionError, Exception, str, Raised when an invalid state transition is attempted. (+11 more)

### Community 24 - "AdapterRegistry"
Cohesion: 0.11
Nodes (9): BriefingAdapter, MeetingAdapter, Any, AdapterRegistry, Any, Adapter Registry resolving integration adapters by IntegrationType. Decouples…, Validate connections for a list of integrations., Any (+1 more)

### Community 25 - "trigger_drive_sync"
Cohesion: 0.13
Nodes (24): Normalize provider name and return canonical name + config, or None if unknown., resolve_provider(), consume_oauth_state(), Store OAuth state JTI in Redis with a short TTL (10 minutes)., Retrieve and delete an OAuth state JTI atomically (single-use enforcement)., store_oauth_state(), connect_oauth_provider(), disconnect_integration() (+16 more)

### Community 26 - "test_dashboard_and_disconnect.py"
Cohesion: 0.20
Nodes (23): create_access_token(), Any, _connect_provider(), _create_user(), asyncio, AsyncSession, User, Unit & Integration tests for Dashboard endpoints and Integrations Disconnect… (+15 more)

### Community 27 - "WorkflowPlanner"
Cohesion: 0.15
Nodes (17): ParameterValidationError, Any, Exception, Raised when requested workflow ID is not registered., Raised when parameter input validation fails., Base exception for workflow planning errors., WorkflowNotFoundError, WorkflowPlanningError (+9 more)

### Community 28 - "Workflow Definition Registry"
Cohesion: 0.10
Nodes (12): Clear all registered workflow definitions., Registry-First Thread-Safe Workflow Registry. Acts as the primary source of…, Internal helper to populate builtin workflow definitions., Register a workflow definition in the registry. Fails fast if a workflow with…, Remove a workflow definition from the registry., Retrieve a workflow definition by ID and optional version. If version is…, Check if a workflow definition exists in the registry., Return all registered workflow definitions. (+4 more)

### Community 29 - "Frontend NPM Dependencies"
Cohesion: 0.09
Nodes (23): dependencies, axios, clsx, framer-motion, gsap, @gsap/react, lucide-react, meshline (+15 more)

### Community 30 - "workflow.types.ts"
Cohesion: 0.13
Nodes (21): ApprovalLifecycleState, ApprovalRequestModel, CapabilityType, ExecutionPlan, ExecutionPlanStep, ExecutionResult, FieldValidationError, IntegrationType (+13 more)

### Community 31 - "models/user.py"
Cohesion: 0.13
Nodes (10): Dependency factory for RBAC enforcement. Usage in any router:…, require_role(), Request, _rate_limit_key(), Rate-limit by authenticated user id; fall back to client IP. Reads the bearer…, get, root(), Daily Briefing API Router. Exposes POST /api/v1/briefing for triggering the… (+2 more)

### Community 32 - "test_meeting.py"
Cohesion: 0.14
Nodes (20): _extract_json_object(), extract_meeting_intelligence(), MeetingIntelligenceError, RuntimeError, Raised when transcript extraction fails or returns an unusable shape., Best-effort extraction of a JSON object from an LLM completion. Models…, Call the LLM to extract a title, summary, decisions, and action items., fake_embed_text() (+12 more)

### Community 33 - "test_drive_sync_routes_meet_transcripts_to_meeting_pipeline"
Cohesion: 0.10
Nodes (11): asyncio, Regression test: the OAuth callback stores the connection under the canonical…, A Drive file named like a Google Meet transcript must be summarized as a…, A non-admin user cannot trigger Drive sync for another user's account., test_drive_sync_rbac_scoping(), test_drive_sync_routes_meet_transcripts_to_meeting_pipeline(), mock_ingest(), test_drive_sync_success() (+3 more)

### Community 34 - "package.json"
Cohesion: 0.09
Nodes (21): name, private, type, version, clsx, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+13 more)

### Community 35 - "WorkflowPage.tsx"
Cohesion: 0.11
Nodes (14): MOCK_ICONS, SearchOverlayProps, RECENT_CHATS, RECENT_DOCUMENTS, SEARCH_ALL_MOCKS, SearchMockItem, staggerContainer, staggerItem (+6 more)

### Community 36 - "get_password_hash"
Cohesion: 0.16
Nodes (19): get_password_hash(), RetrievedMeetingSummary, fake_semantic_search_meetings(), _patch_retrieval(), asyncio, fixture, Tests for GET /api/v1/search. See tests/rag_fixtures.py for why retrieval is…, Meeting summaries must be searchable via the same endpoint as documents. (+11 more)

### Community 37 - "WorkflowRunStatus"
Cohesion: 0.19
Nodes (15): Base, str, Workflow, WorkflowApproval, WorkflowApprovalStatus, WorkflowRunStatus, WorkflowRunV2, WorkflowStatus (+7 more)

### Community 38 - "ConnectionCard.tsx"
Cohesion: 0.19
Nodes (15): ConnectionCard(), ConnectionCardProps, ICON_MAP, ManualTokenModal(), ManualTokenModalProps, PROVIDER_COLORS, PROVIDER_MAP, integrationsService (+7 more)

### Community 39 - "test_briefing.py"
Cohesion: 0.15
Nodes (12): BriefingResponse, BaseModel, Schemas for Daily Briefing Agent tools and orchestration endpoint., SourceStatus, generate_daily_briefing(), Execute all implemented connector briefing functions concurrently, aggregate…, Comprehensive unit and orchestration tests for Daily Briefing Agent. Tests…, Regression: Gmail can return a Subject header with an explicit empty string… (+4 more)

### Community 40 - "test_rbac.py"
Cohesion: 0.15
Nodes (18): asyncio, RBAC boundary tests — prove require_role() enforcement works. These tests…, Register payload containing 'admin' or 'manager' role must still assign…, A request with no token to a protected route returns 401, not a crash., Helper: register a user and login, returning (access_token, user_data)., A garbage Bearer token returns 401, not a 500 or silent pass-through., An admin user can access GET /api/v1/admin/users., An employee (default role) must be rejected with 403 on admin routes. (+10 more)

### Community 41 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 42 - "routers/chat.py"
Cohesion: 0.18
Nodes (16): chat(), _is_greeting(), AsyncSession, Depends, limit, post, Request, Chat endpoint with greeting heuristic and tool-calling support. Flow: query →… (+8 more)

### Community 43 - "decrypt_token"
Cohesion: 0.18
Nodes (16): decrypt_token(), asyncio, An access token must not be accepted at the /refresh endpoint., A refresh token must not be accepted as a Bearer token on /me., Sending 6 rapid login requests triggers the 5/minute rate limit on the 6th…, Login → use refresh token → get new access token → verify it works., Login → logout → confirm old refresh token is rejected., test_login_rate_limit_returns_429() (+8 more)

### Community 44 - "test_workflow_productization.py"
Cohesion: 0.16
Nodes (7): BaseModel, str, Manages DRAFT, PUBLISHED, and ARCHIVED workflow versions, version cloning,…, VersionState, WorkflowVersionManager, WorkflowVersionRecord, test_versioning_draft_and_publish()

### Community 45 - "notifications.py"
Cohesion: 0.20
Nodes (15): get_notifications(), mark_all_notifications_read(), mark_notifications_read(), MarkReadRequest, NotificationRead, AsyncSession, BaseModel, Depends (+7 more)

### Community 46 - "DAGGraph"
Cohesion: 0.17
Nodes (12): Config, DAGCycleError, DAGGraph, DAGNode, BaseModel, Exception, Directed Acyclic Graph (DAG) for Workflow Step Orchestration. Validates graph…, Validate dependencies and check for cyclic dependencies. (+4 more)

### Community 47 - "DashboardPage.tsx"
Cohesion: 0.22
Nodes (14): DashboardPage(), decodeEntities(), formatRelativeTime(), getActivityIconComponent(), getCurrentDate(), getGreeting(), getSourceIcon(), DashboardPage (+6 more)

### Community 48 - "hardening.py"
Cohesion: 0.17
Nodes (10): HardeningService, BaseModel, Exception, RateLimiter, RateLimiterExceededError, Raised when workflow execution rate limit is exceeded., Sliding Window Rate Limiter for Workflow Executions., Production Hardening & Observability Service. (+2 more)

### Community 49 - "AdminPage.tsx"
Cohesion: 0.18
Nodes (10): App(), AuthProvider(), ChatProvider(), AdminPage(), AdminPage, AppRoutes(), adminService, AdminState (+2 more)

### Community 50 - "Topbar.tsx"
Cohesion: 0.20
Nodes (11): AppLogo(), AppLogoProps, logoVariants, Topbar(), TopbarProps, getInitialTheme(), Theme, ThemeContext (+3 more)

### Community 51 - "schemas/__init__.py"
Cohesion: 0.31
Nodes (11): AsyncSession, Depends, limit, post, Request, summarize_meeting_endpoint(), ActionItem, Decision (+3 more)

### Community 52 - "InMemoryBackgroundRunner"
Cohesion: 0.15
Nodes (8): BaseBackgroundRunner, InMemoryBackgroundRunner, ABC, Any, Abstract interface for background execution runners (Celery, Redis Queue,…, Queue plan for asynchronous background execution. Returns task_id., Get status of queued background execution., Default thread/async background runner.

### Community 53 - "OAuthToken"
Cohesion: 0.31
Nodes (7): encrypt_token(), Integration, Base, Tracks OAuth-connected services per user (Google Drive, Gmail, Slack, etc.)., OAuthToken, Base, Tests for the generic OAuth 2.0 Connect Engine across all 5 providers: Gmail,…

### Community 54 - "mock_redis_helpers"
Cohesion: 0.15
Nodes (4): client_fixture(), db_session_fixture(), mock_redis_helpers(), fixture

### Community 55 - "test_oauth_callback_success_stores_encrypted_tokens"
Cohesion: 0.18
Nodes (10): asyncio, GET /api/v1/integrations/{provider}/connect builds a valid auth URL for each…, An unapproved/unknown provider name in the path must return 400 Bad Request., A callback with a missing or forged CSRF state token redirects with an error., A valid OAuth authorization code exchange creates encrypted OAuthToken &…, test_oauth_callback_rejects_forged_or_missing_state(), test_oauth_callback_success_stores_encrypted_tokens(), test_oauth_connect_builds_valid_url() (+2 more)

### Community 56 - "test_notifications.py"
Cohesion: 0.32
Nodes (12): _create_test_user(), asyncio, User, Unit and isolation tests for notifications API (GET/POST…, User A must NEVER see User B's notifications, nor be able to mark User B's…, _seed_notification(), test_get_notifications_empty(), test_get_notifications_returns_user_items() (+4 more)

### Community 57 - "AuthContext.tsx"
Cohesion: 0.31
Nodes (10): AuthContext, AuthContextType, MOCK_USER, AuthState, LoginPayload, NOTE: Backend expects `username` field (not `email`) per OAuth2 spec., RefreshRequest, RegisterPayload (+2 more)

### Community 58 - "DocumentsPage.tsx"
Cohesion: 0.23
Nodes (11): ACCEPTED_EXTENSIONS, ACCEPTED_TYPES, DisplayFile, DocumentsPage(), formatFileSize(), getFileExtension(), getFileIcon(), getStatusBadge() (+3 more)

### Community 59 - "get_briefing_item_detail_endpoint"
Cohesion: 0.23
Nodes (12): get_briefing_item_detail_endpoint(), get_daily_briefing_endpoint(), list_connectors_endpoint(), AsyncSession, Depends, get, limit, post (+4 more)

### Community 60 - "circuit_breaker.py"
Cohesion: 0.21
Nodes (7): CircuitBreakerConfig, ProviderCircuitBreaker, BaseModel, Tracks adapter failures for a specific provider integration. Protects external…, CircuitBreakerOpenError, Exception, Raised when an API call is blocked by an open Circuit Breaker.

### Community 61 - "rag_fixtures.py"
Cohesion: 0.18
Nodes (10): fake_generate_answer(), fake_semantic_search(), Shared fake retrieval index for tests that can't hit a real pgvector DB.…, fake_generate_greeting(), fake_generate_tool_response(), fake_generate_with_tools(), _patch_pipeline(), fixture (+2 more)

### Community 62 - "test_google_token_refresh_persists_to_db"
Cohesion: 0.18
Nodes (5): When an expired Jira token is refreshed, the new encrypted token and expiration…, When an expired Google token is refreshed, the new encrypted token and…, test_google_token_refresh_persists_to_db(), mock_post(), test_jira_token_refresh_persists_to_db()

### Community 63 - "axios.ts"
Cohesion: 0.24
Nodes (7): apiClient, HealthCheckResponse, healthService, NotificationItem, notificationService, storage, axios

### Community 64 - "sync_drive_documents"
Cohesion: 0.27
Nodes (10): DriveSyncError, _is_meet_transcript(), AsyncSession, RuntimeError, Base error for Google Drive sync flow., Refresh the expired Google access token using the refresh token., Sync all text files and Google Docs accessible via user's Google Drive OAuth…, _refresh_google_token() (+2 more)

### Community 65 - "ScheduledJob"
Cohesion: 0.22
Nodes (6): Config, Any, BaseModel, Abstract Scheduler interface for workflow automation schedules. Decoupled from…, ScheduledJob, WorkflowScheduler

### Community 66 - "meeting.types.ts"
Cohesion: 0.24
Nodes (8): meetingService, ActionItem, Decision, MeetingErrorResponse, MeetingState, MeetingStatus, MeetingSummarizeRequest, MeetingSummary

### Community 67 - "test_workflow_dag_advanced.py"
Cohesion: 0.28
Nodes (7): CircuitState, str, CircularSubWorkflowError, Exception, Raised when a sub-workflow causes a circular reference chain., test_circuit_breaker_tripping_and_recovery(), test_circular_sub_workflow_prevention()

### Community 68 - "validator.py"
Cohesion: 0.36
Nodes (7): FieldValidationError, BaseModel, ValidationSummary, ParameterValidator, Any, Reusable parameter validation engine. Validates input dictionary against a…, ValidationSummary

### Community 69 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @types/node, @types/react, @types/react-dom, @typescript-eslint/eslint-plugin (+1 more)

### Community 70 - "ErrorBoundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, Props, State

### Community 71 - "Settings"
Cohesion: 0.25
Nodes (7): Config, Any, Settings, startup_security_checks(), BaseSettings, field_validator, on_event

### Community 72 - "resilience.py"
Cohesion: 0.33
Nodes (5): CompensationStep, BaseModel, Calculate exponential backoff delay., RetryPolicy, test_retry_policy_exponential_backoff()

### Community 75 - "roles.ts"
Cohesion: 0.29
Nodes (5): ROLE_HIERARCHY, ROLE_META, RoleMeta, ROLES, Role

### Community 76 - "useSearch.ts"
Cohesion: 0.52
Nodes (4): searchService, SearchParams, SearchResponse, SearchState

### Community 77 - "list_users"
Cohesion: 0.33
Nodes (6): list_users(), AsyncSession, Depends, get, require_admin_access, List all users — admin only. Proof-of-concept for the require_role() RBAC…

### Community 80 - "CircuitBreakerRegistry"
Cohesion: 0.33
Nodes (3): CircuitBreakerRegistry, Any, Registry for managing CircuitBreakers across all provider integrations.

### Community 81 - "EnterpriseTemplate"
Cohesion: 0.33
Nodes (4): EnterpriseTemplate, BaseModel, Enterprise Template Library Service., TemplateLibraryService

### Community 84 - "global_exception_handler"
Cohesion: 0.40
Nodes (5): global_exception_handler(), Exception, Request, Ensure any unhandled server error returns clean JSON and includes CORS headers,…, exception_handler

### Community 85 - ".execute_action"
Cohesion: 0.40
Nodes (3): Any, Execute a workflow-safe operation through existing EAIOS services., Return health status dictionary.

### Community 86 - "test_rtr.py"
Cohesion: 0.60
Nodes (4): asyncio, test_rtr_logout_revokes_current_refresh(), test_rtr_replay_fails(), test_rtr_rotated_token_works()

### Community 87 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 88 - "SplitText.tsx"
Cohesion: 0.40
Nodes (3): SplitTextProps, gsap, @gsap/react

### Community 90 - "test_main.py"
Cohesion: 0.67
Nodes (3): asyncio, test_health_endpoint(), test_root_endpoint()

### Community 100 - "overrides"
Cohesion: 0.67
Nodes (3): overrides, brace-expansion, esbuild

## Knowledge Gaps
- **177 isolated node(s):** `Config`, `Config`, `ToggleSwitchProps`, `SidebarProps`, `SpinnerProps` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 835 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `routers/workflow.py`, `_create_test_user`, `Document`, `models/__init__.py`, `ConnectorSpec`, `retrieval_service.py`, `auth.py`, `register_and_login`, `test_dashboard_and_disconnect.py`, `models/user.py`, `test_drive_sync_routes_meet_transcripts_to_meeting_pipeline`, `get_password_hash`, `test_briefing.py`, `test_rbac.py`, `routers/chat.py`, `notifications.py`, `schemas/__init__.py`, `OAuthToken`, `test_notifications.py`, `get_briefing_item_detail_endpoint`, `list_users`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `ExecutionPlan` connect `ExecutionPlan` to `routers/workflow.py`, `validator.py`, `orchestrator.py`, `InMemoryBackgroundRunner`, `WorkflowDefinition`, `WorkflowOrchestrator`, `WorkflowPlanner`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `WorkflowRunStatus` connect `WorkflowRunStatus` to `routers/workflow.py`, `ExecutionPlan`, `AdapterConfigurationError`, `models/__init__.py`, `WorkflowEventType`, `orchestrator.py`, `WorkflowDefinition`, `WorkflowOrchestrator`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 66 inferred relationships involving `User` (e.g. with `ConnectorSpec` and `get_current_user()`) actually correct?**
  _`User` has 66 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `SourceResult` (e.g. with `ConnectorSpec` and `dispatch_tool_call()`) actually correct?**
  _`SourceResult` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `BriefingItem` (e.g. with `get_calendar_briefing()` and `get_calendar_recent()`) actually correct?**
  _`BriefingItem` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `Config`, `ToggleSwitchProps` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._