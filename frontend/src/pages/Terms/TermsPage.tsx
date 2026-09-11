import { motion } from 'framer-motion';
import {
  FileText,
  Shield,
  UserCheck,
  Plug,
  Brain,
  AlertTriangle,
  Lock,
  Server,
  Ban,
} from 'lucide-react';

import { staggerContainer, staggerItem } from '@/lib/motion';
import '../Privacy/legal.css';

/* ─────────────────────────────────────────────
   Quick-overview cards (top of page)
───────────────────────────────────────────── */
const overviewCards = [
  {
    icon: Shield,
    title: 'Platform Use',
    description: 'Guidelines for accessing and using the UnifyAI platform.',
  },
  {
    icon: UserCheck,
    title: 'Account Responsibility',
    description:
      'You are responsible for maintaining the security and accuracy of your account.',
  },
  {
    icon: Plug,
    title: 'Connected Services',
    description:
      'Connected integrations operate according to their permissions and provider terms.',
  },
  {
    icon: Ban,
    title: 'Acceptable Use',
    description:
      'Use the platform responsibly and only for authorized business purposes.',
  },
];

/* ─────────────────────────────────────────────
   Account responsibility items
───────────────────────────────────────────── */
const accountItems = [
  {
    icon: UserCheck,
    title: 'Account Security',
    description:
      'You are responsible for maintaining the security of your account credentials.',
  },
  {
    icon: Lock,
    title: 'Accurate Information',
    description: 'Provide accurate and up-to-date registration information.',
  },
  {
    icon: Shield,
    title: 'Credential Protection',
    description:
      'Do not share credentials or allow unauthorized access to your account.',
  },
  {
    icon: AlertTriangle,
    title: 'Breach Notification',
    description:
      'Notify UnifyAI immediately of any suspected unauthorized use of your account.',
  },
];

/* ─────────────────────────────────────────────
   Acceptable use list
───────────────────────────────────────────── */
const acceptableUseItems = [
  { icon: Shield, title: 'Authorized Access', description: 'Access only data and systems you are authorized to access.' },
  { icon: Ban, title: 'No Abuse', description: 'Do not attempt to disrupt, overload, or impair platform services.' },
  { icon: Lock, title: 'No Unauthorized Data Access', description: 'Do not attempt to access, retrieve or export data beyond your permissions.' },
  { icon: AlertTriangle, title: 'No Malicious Activity', description: 'Do not introduce malware, spam, or other harmful content.' },
];

const integrations = ['Gmail', 'Google Drive', 'GitHub', 'Slack', 'Jira'];

const thirdPartyServices = [
  'Google',
  'GitHub',
  'Slack',
  'Atlassian / Jira',
  'Vercel',
  'Render',
  'Supabase',
  'Upstash',
];

/* ─────────────────────────────────────────────
   Usage items (numbered list)
───────────────────────────────────────────── */
const platformUseItems = [
  'Provide, operate and maintain the UnifyAI platform',
  'Enable AI-powered search, retrieval and workflow automation',
  'Retrieve information from connected integrations',
  'Generate AI-powered insights and briefings',
  'Maintain secure authentication and session management',
  'Monitor rate limits and detect misuse',
  'Enforce role-based access controls',
  'Maintain audit logs for accountability',
  'Provide technical support and respond to inquiries',
  'Improve platform reliability and security',
];

/* ─────────────────────────────────────────────
   IP items
───────────────────────────────────────────── */
const ipItems = [
  { icon: FileText, title: 'Platform IP', description: 'All software, code, designs and branding of UnifyAI are owned by UnifyAI.' },
  { icon: Shield, title: 'Your Content', description: 'You retain ownership of content you provide to the platform.' },
  { icon: Brain, title: 'AI Outputs', description: 'AI-generated responses are provided for your use but remain subject to these Terms.' },
  { icon: Server, title: 'Feedback', description: 'Any feedback you submit may be used to improve UnifyAI without obligation.' },
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export const TermsPage = () => {
  return (
    <motion.div
      className="legal-page"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ── HERO ── */}
      <motion.section className="legal-hero" variants={staggerItem}>


        <h1 className="legal-title">Terms &amp; Conditions</h1>

        <p className="legal-subtitle">
          Terms governing your use of the UnifyAI platform and services.
        </p>


      </motion.section>

      {/* ── 01 QUICK OVERVIEW ── */}
      <motion.section className="legal-overview" variants={staggerItem}>
        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>Terms at a Glance</h2>
            <p>The key principles governing your use of UnifyAI.</p>
          </div>
        </div>

        <div className="privacy-card-grid">
          {overviewCards.map((card) => {
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

      {/* ── 02 INTRODUCTION ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Introduction</h2>
            <p>Our agreement with you as a user of UnifyAI.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            These Terms &amp; Conditions govern your access to and use of the
            UnifyAI platform. By using UnifyAI you agree to be bound by these
            Terms. If you do not agree, please do not use the platform.
            UnifyAI is an enterprise AI assistant platform designed to help
            organizations access information across connected services using
            AI-powered search, retrieval and workflow automation.
          </p>
        </div>
      </motion.section>

      {/* ── 03 ELIGIBILITY ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Eligibility</h2>
            <p>Who may use the UnifyAI platform.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            UnifyAI is intended for authorized business and organizational
            users. You must be at least 18 years of age or the age of majority
            in your jurisdiction to use the platform. Access is granted through
            organizational accounts and subject to the permissions assigned by
            your organization's administrators.
          </p>
        </div>
      </motion.section>

      {/* ── 04 ACCOUNT REGISTRATION ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>Account Registration</h2>
            <p>Your responsibilities when creating and maintaining an account.</p>
          </div>
        </div>

        <div className="data-grid">
          {accountItems.map((item) => {
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

      {/* ── 05 USE OF THE PLATFORM ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>05</span>
          <div>
            <h2>Use of the Platform</h2>
            <p>Permitted purposes for using UnifyAI.</p>
          </div>
        </div>

        <div className="usage-grid">
          {platformUseItems.map((item, index) => (
            <div className="usage-item" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 06 CONNECTED INTEGRATIONS ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>06</span>
          <div>
            <h2>Connected Integrations</h2>
            <p>
              Terms applicable to external services connected to your account.
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

              <span className="integration-status">Connected service</span>
            </div>
          ))}
        </div>

        <div className="legal-text-card">
          <p>
            When you connect services such as Gmail, Google Drive, GitHub,
            Slack, or Jira, UnifyAI accesses those services according to the
            permissions you grant during OAuth setup. Connected integrations
            operate under the terms and privacy policies of their respective
            providers. UnifyAI is not responsible for third-party service
            availability or policy changes.
          </p>
        </div>
      </motion.section>

      {/* ── 07 AI-GENERATED CONTENT ── */}
      <motion.section className="ai-section" variants={staggerItem}>
        <div className="ai-icon">
          <Brain size={28} />
        </div>

        <div>
          <span className="eyebrow">AI &amp; ENTERPRISE DATA</span>

          <h2>AI-Generated Content</h2>

          <p>
            UnifyAI uses AI models (Google Gemini in production, Ollama for
            local development) to generate responses based on enterprise
            information. AI-generated responses are provided for informational
            purposes and should be reviewed before being acted upon. UnifyAI
            applies permission-aware filtering before enterprise content reaches
            the AI system.
          </p>

          <div className="ai-points">
            <span>✓ Permission-aware retrieval</span>
            <span>✓ Human override tracking</span>
            <span>✓ Confidence monitoring</span>
            <span>✓ Audit visibility</span>
          </div>
        </div>
      </motion.section>

      {/* ── 08 ENTERPRISE DATA & SECURITY ── */}
      <motion.section
        className="legal-section security-section"
        variants={staggerItem}
      >
        <div className="section-heading">
          <span>08</span>
          <div>
            <h2>Enterprise Data &amp; Security</h2>
            <p>Security controls protecting enterprise information.</p>
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
            <Shield size={22} />
            <h3>Role-Based Access</h3>
            <p>
              Access to enterprise information is controlled according to user
              roles and permissions.
            </p>
          </div>

          <div className="security-feature">
            <Server size={22} />
            <h3>Protected Retrieval</h3>
            <p>
              Document retrieval is filtered according to permissions before
              content reaches the AI system.
            </p>
          </div>

          <div className="security-feature">
            <FileText size={22} />
            <h3>Audit Logging</h3>
            <p>
              State-changing actions are recorded for monitoring and
              accountability.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── IMPORTANT TERMS HIGHLIGHT ── */}
      <motion.section className="legal-highlight" variants={staggerItem}>
        <div className="highlight-icon">
          <FileText size={25} />
        </div>

        <div>
          <h3>Important</h3>
          <p>
            By using UnifyAI, users agree to comply with these Terms and use
            the platform only for authorized business and organizational
            purposes. Unauthorized use, misuse, or violation of these Terms may
            result in suspension or termination of access.
          </p>
        </div>
      </motion.section>

      {/* ── 09 ACCEPTABLE USE ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>09</span>
          <div>
            <h2>Acceptable Use</h2>
            <p>
              Conduct required of all users when accessing the platform.
            </p>
          </div>
        </div>

        <div className="data-grid">
          {acceptableUseItems.map((item) => {
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

      {/* ── 10 INTELLECTUAL PROPERTY ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>10</span>
          <div>
            <h2>Intellectual Property</h2>
            <p>Ownership of platform components and content.</p>
          </div>
        </div>

        <div className="data-grid">
          {ipItems.map((item) => {
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

      {/* ── 11 AVAILABILITY AND CHANGES ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>11</span>
          <div>
            <h2>Availability &amp; Changes</h2>
            <p>Platform availability and our right to make changes.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            UnifyAI aims to maintain high availability but does not guarantee
            uninterrupted access. We may update, modify or discontinue features
            of the platform at any time. We will make reasonable efforts to
            communicate significant changes in advance.
          </p>
        </div>
      </motion.section>

      {/* ── 12 LIMITATION OF LIABILITY ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>12</span>
          <div>
            <h2>Limitation of Liability</h2>
            <p>Scope of UnifyAI's responsibility.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            To the extent permitted by applicable law, UnifyAI is not liable
            for indirect, incidental or consequential damages arising from use
            of the platform. AI-generated responses are provided for
            informational purposes only. Users are responsible for verifying
            information before taking action based on AI outputs.
          </p>
        </div>
      </motion.section>

      {/* ── 13 TERMINATION ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>13</span>
          <div>
            <h2>Termination</h2>
            <p>Conditions under which access may be suspended or terminated.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            UnifyAI reserves the right to suspend or terminate access to the
            platform for violations of these Terms, unauthorized use, or other
            conduct that harms the platform or other users. Users may
            discontinue use by disconnecting integrations and requesting account
            deletion through support channels.
          </p>
        </div>
      </motion.section>

      {/* ── 14 THIRD-PARTY SERVICES ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>14</span>
          <div>
            <h2>Third-Party Services</h2>
            <p>External services used by or integrated with the platform.</p>
          </div>
        </div>

        <div className="third-party-list">
          {thirdPartyServices.map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>

        <div className="legal-text-card">
          <p>
            These services operate under their own terms and privacy policies.
            UnifyAI is not responsible for the practices of third-party
            providers. By connecting third-party services, you agree to their
            respective terms.
          </p>
        </div>
      </motion.section>

      {/* ── 15 CHANGES TO TERMS ── */}
      <motion.section className="legal-section" variants={staggerItem}>
        <div className="section-heading">
          <span>15</span>
          <div>
            <h2>Changes to Terms</h2>
            <p>How we communicate updates to these Terms.</p>
          </div>
        </div>

        <div className="legal-text-card">
          <p>
            UnifyAI may update these Terms from time to time. Continued use of
            the platform after changes are posted constitutes acceptance of the
            revised Terms. We recommend reviewing these Terms periodically.
            The "Last Updated" date at the top of this page reflects the most
            recent revision.
          </p>
        </div>
      </motion.section>

      {/* ── FOOTER CTA ── */}

    </motion.div>
  );
};

export default TermsPage;
