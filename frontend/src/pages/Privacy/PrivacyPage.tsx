import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Database,
  UserCheck,
  Plug,
  Brain,
  FileText,
  Eye,
  KeyRound,
  Server,
  Mail,
} from 'lucide-react';

import { staggerContainer, staggerItem } from '@/lib/motion';
import './legal.css';

const privacyCards = [
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    description:
      'Your personal and organizational information is handled with privacy and security in mind.',
  },
  {
    icon: Lock,
    title: 'Secure by Design',
    description:
      'Role-based access control, encryption, authentication and audit logging help protect your data.',
  },
  {
    icon: UserCheck,
    title: 'You Stay in Control',
    description:
      'You control connected services and can disconnect integrations when supported.',
  },
  {
    icon: Eye,
    title: 'Transparent AI',
    description:
      'AI-powered decisions and workflow activity can be monitored through transparency and audit features.',
  },
];

const collectedData = [
  {
    icon: UserCheck,
    title: 'Account Information',
    description: 'Name, email and role information provided during registration.',
  },
  {
    icon: KeyRound,
    title: 'Authentication Data',
    description: 'Credentials and session information used to maintain secure access.',
  },
  {
    icon: Database,
    title: 'Organization Information',
    description: 'Organization details, roles and permission information.',
  },
  {
    icon: Plug,
    title: 'Integration Data',
    description: 'Information accessed from connected services according to granted permissions.',
  },
  {
    icon: Brain,
    title: 'User-Generated Content',
    description: 'Queries submitted to the AI assistant and generated responses.',
  },
  {
    icon: FileText,
    title: 'Usage Information',
    description: 'Feature usage, query patterns and interaction information.',
  },
  {
    icon: Server,
    title: 'Technical Information',
    description: 'Browser, operating system, IP address and device information.',
  },
  {
    icon: Mail,
    title: 'Support Information',
    description: 'Information you provide when contacting support.',
  },
];

const integrations = ['Gmail', 'Google Drive', 'GitHub', 'Slack', 'Jira'];

const rights = [
  {
    title: 'Access',
    description: 'Request access to information associated with your account.',
  },
  {
    title: 'Correction',
    description: 'Request correction of inaccurate information.',
  },
  {
    title: 'Deletion',
    description: 'Request deletion of your account information where applicable.',
  },
  {
    title: 'Data Portability',
    description: 'Request portability of your information where applicable.',
  },
];

export const PrivacyPage = () => {
  return (
    <motion.div
      className="legal-page"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* HERO */}
      <motion.section className="legal-hero" variants={staggerItem}>

        <h1 className="legal-title">
          Privacy Policy
        </h1>

        <p className="legal-subtitle">
          Understand how UnifyAI collects, uses, protects and processes
          information across the platform.
        </p>


      </motion.section>

      {/* QUICK OVERVIEW */}
      <motion.section
        className="legal-overview"
        variants={staggerItem}
      >
        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>Privacy at a Glance</h2>
            <p>
              The key principles behind how UnifyAI handles information.
            </p>
          </div>
        </div>

        <div className="privacy-card-grid">
          {privacyCards.map((card) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                className="privacy-card"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="privacy-card-icon">
                  <Icon size={21} />
                </div>

                <h3>{card.title}</h3>
                <p>{card.description}</p>

              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* INTRO */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Introduction</h2>
            <p>Our commitment to responsible information handling.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            UnifyAI respects your privacy and is committed to protecting
            personal and organizational information. This Privacy Policy
            explains how we handle information when you use the UnifyAI
            platform.
          </p>
        </div>
      </motion.section>

      {/* DATA COLLECTION */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Information We Collect</h2>
            <p>
              Different categories of information may be processed to
              provide and secure the platform.
            </p>
          </div>
        </div>

        <div className="data-grid">
          {collectedData.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                className="data-card"
                key={item.title}
                whileHover={{ y: -4 }}
              >
                <div className="data-icon">
                  <Icon size={19} />
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* HOW WE USE DATA */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>How We Use Information</h2>
            <p>Information is used to operate and improve UnifyAI.</p>
          </div>
        </div>

        <div className="usage-grid">
          {[
            'Provide, operate and maintain the platform',
            'Process AI-powered queries and search requests',
            'Retrieve information from connected tools',
            'Generate daily briefings',
            'Analyze meeting transcripts',
            'Execute workflow automation with human confirmation',
            'Maintain secure authentication',
            'Monitor rate limits and detect abuse',
            'Maintain audit logs for state-changing actions',
            'Improve reliability, performance and security',
          ].map((item, index) => (
            <div className="usage-item" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* SECURITY */}
      <motion.section
        className="legal-section security-section"
        variants={staggerItem}
      >
        <div className="section-heading">
          <span>05</span>
          <div>
            <h2>Data Storage & Security</h2>
            <p>Security controls designed to protect enterprise information.</p>
          </div>
        </div>

        <div className="security-grid">
          <div className="security-feature">
            <Lock size={22} />
            <h3>Encryption</h3>
            <p>
              Integration credentials are protected using field-level
              AES-256-GCM encryption.
            </p>
          </div>

          <div className="security-feature">
            <ShieldCheck size={22} />
            <h3>Role-Based Access</h3>
            <p>
              Access to enterprise information is controlled according
              to user roles and permissions.
            </p>
          </div>

          <div className="security-feature">
            <Database size={22} />
            <h3>Protected Retrieval</h3>
            <p>
              Document retrieval is filtered according to permissions
              before content reaches the AI system.
            </p>
          </div>

          <div className="security-feature">
            <FileText size={22} />
            <h3>Audit Logging</h3>
            <p>
              State-changing actions can be recorded for monitoring and
              accountability.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECURITY HIGHLIGHT */}
      <motion.section
        className="legal-highlight"
        variants={staggerItem}
      >
        <div className="highlight-icon">
          <ShieldCheck size={25} />
        </div>

        <div>
          <h3>Security is built into the retrieval layer</h3>
          <p>
            UnifyAI applies permission-aware filtering before enterprise
            content reaches the AI, helping prevent unauthorized information
            from being included in responses.
          </p>
        </div>
      </motion.section>

      {/* INTEGRATIONS */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>06</span>
          <div>
            <h2>Connected Integrations</h2>
            <p>
              Connected services are accessed according to granted permissions.
            </p>
          </div>
        </div>

        <div className="integration-grid">
          {integrations.map((integration) => (
            <div className="integration-card" key={integration}>
              <div className="integration-icon">
                <Plug size={18} />
              </div>

              <span>{integration}</span>

              <span className="integration-status">
                Connected service
              </span>
            </div>
          ))}
        </div>

        <div className="legal-text-card">
          <p>
            When users connect services such as Gmail, Google Drive, GitHub,
            Slack, or Jira, UnifyAI accesses information according to the
            permissions granted during OAuth setup. Users control which
            services are connected and can disconnect them at any time.
          </p>
        </div>
      </motion.section>

      {/* AI */}
      <motion.section
        className="ai-section"
        variants={staggerItem}
      >
        <div className="ai-icon">
          <Brain size={28} />
        </div>

        <div>
          <span className="eyebrow">AI & ENTERPRISE DATA</span>

          <h2>Responsible AI Processing</h2>

          <p>
            UnifyAI processes enterprise information to provide AI-powered
            search, retrieval, summarization and workflow capabilities.
            Production uses Google Gemini for chat generation and embeddings,
            while Ollama is used for local development.
          </p>

          <div className="ai-points">
            <span>✓ AI-powered retrieval</span>
            <span>✓ Human override tracking</span>
            <span>✓ Confidence monitoring</span>
            <span>✓ Audit visibility</span>
          </div>
        </div>
      </motion.section>

      {/* RETENTION */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>07</span>
          <div>
            <h2>Data Retention</h2>
            <p>How long information may be retained.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            Information is retained only as necessary to provide the Service,
            maintain security, comply with applicable requirements and
            maintain audit logs for state-changing actions. Users may
            disconnect integrations or request account deletion through
            support channels.
          </p>
        </div>
      </motion.section>

      {/* THIRD PARTY */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>08</span>
          <div>
            <h2>Third-Party Services</h2>
            <p>External services used by the platform.</p>
          </div>
        </div>

        <div className="third-party-list">
          {[
            'Google',
            'GitHub',
            'Slack',
            'Atlassian / Jira',
            'Vercel',
            'Render',
            'Supabase',
            'Upstash',
          ].map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>

        <div className="legal-text-card">
          <p>
            These services operate under their own privacy policies and
            terms. Their handling of information is governed by their
            respective policies.
          </p>
        </div>
      </motion.section>

      {/* RIGHTS */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>09</span>
          <div>
            <h2>Your Rights & Choices</h2>
            <p>Depending on applicable law, you may have rights including:</p>
          </div>
        </div>

        <div className="rights-grid">
          {rights.map((right) => (
            <div className="right-card" key={right.title}>
              <UserCheck size={20} />
              <h3>{right.title}</h3>
              <p>{right.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* OTHER POLICIES */}


    </motion.div>
  );
};

export default PrivacyPage;