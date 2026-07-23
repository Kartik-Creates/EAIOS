import React from 'react';

export default function App() {
  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-badge">EAIOS</div>
        <div className="title-group">
          <h1>Enterprise AI Operating System</h1>
          <p className="subtitle">Unified RAG Knowledge Search & Agentic Workflow Automation</p>
        </div>
      </header>

      <main className="content-grid">
        <section className="card">
          <div className="card-header">
            <span className="icon">🔍</span>
            <h2>Unified RAG Search</h2>
          </div>
          <p>Connect and query enterprise knowledge bases across Gmail, Slack, Drive, GitHub, and Jira with pgvector support.</p>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="icon">⚡</span>
            <h2>Agentic Workflows</h2>
          </div>
          <p>Automate multi-step tasks and cross-platform actions with intelligent event-driven agents.</p>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="icon">🔒</span>
            <h2>Enterprise Security</h2>
          </div>
          <p>Role-based access controls, code ownership enforcement, and isolated tenant vector search.</p>
        </section>
      </main>

      <footer className="footer">
        <p>EAIOS Platform Skeleton • React + FastAPI + PostgreSQL (pgvector) + Redis</p>
      </footer>
    </div>
  );
}
