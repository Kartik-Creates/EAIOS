import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './legal.css';

export const TermsPage = () => {
  return (
    <motion.div
      className="legal-page"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.header className="legal-header" variants={staggerItem}>
        <h1 className="legal-title">Terms &amp; Conditions</h1>
        <p className="legal-subtitle">
          Terms governing your use of the UnifyAI platform and services.
        </p>
        <p className="legal-last-updated">Last Updated: September 2026</p>
      </motion.header>

      <motion.nav className="legal-nav" variants={staggerItem}>
        <Link to={ROUTES.ROOT} className="legal-back">
          ← Back to UnifyAI
        </Link>
      </motion.nav>

      <motion.div className="legal-content" variants={staggerContainer}>
        <motion.section className="legal-section" variants={staggerItem}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the UnifyAI platform, including all associated applications,
            websites, and services (collectively, the "Service"), you agree to be bound by these
            Terms and Conditions. If you do not agree to these terms, do not use the Service.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>2. Description of Service</h2>
          <p>
            UnifyAI is an AI-native enterprise platform that connects your existing workplace
            tools — Gmail, Slack, Google Drive, GitHub, and Jira — into a single intelligent interface.
            The Service provides AI-powered search, question answering with source citations, daily
            briefings, meeting intelligence, workflow automation, and an AI transparency dashboard,
            all built on a role-based access control system.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>3. User Responsibilities</h2>
          <p>You are responsible for:</p>
          <ul>
            <li>
              <strong>Maintaining the security</strong> of your account credentials and notifying
              UnifyAI immediately of any unauthorized use.
            </li>
            <li>
              <strong>Providing accurate information</strong> during registration and keeping it
              updated.
            </li>
            <li>
              <strong>Using the Service only</strong> in accordance with applicable laws and these
              Terms.
            </li>
            <li>
              <strong>Ensuring authorization</strong> before connecting any third-party service
              (e.g., Gmail, Google Drive, GitHub, Slack, Jira) and accessing data through those
              integrations.
            </li>
            <li>
              <strong>Reviewing AI-generated content</strong> before relying on it for important
              decisions.
            </li>
          </ul>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>4. Account and Authentication</h2>
          <p>
            Access to most features requires registration and authentication. UnifyAI uses
            secure authentication mechanisms to protect your account. You must be at least 18 years
            old to create an account. Organizations may control user access, roles, and permissions
            through administrative features.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>5. Acceptable Use</h2>
          <p>You must not:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
            <li>Attempt to gain unauthorized access to any portion of the Service or connected systems.</li>
            <li>Circumvent security controls, rate limits, or authentication mechanisms.</li>
            <li>Abuse or overload the Service or connected third-party integrations.</li>
            <li>Interfere with or disrupt the operation of the Service.</li>
            <li>Upload, access, or process information you are not authorized to use.</li>
            <li>Reverse engineer, decompile, or attempt to extract source code.</li>
            <li>Use the Service to generate content that is unlawful, harmful, or misleading.</li>
          </ul>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>6. Data and User Content</h2>
          <p>
            You retain ownership of your content. UnifyAI processes information only to provide the
            Service. Any data accessed through connected integrations (Gmail, Drive, GitHub, Slack,
            Jira) remains the property of your organization and is subject to the permissions you
            grant during the integration setup.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>7. Third-Party Integrations and Services</h2>
          <p>
            The Service integrates with Gmail, Google Drive, GitHub, Slack, and Jira through OAuth.
            These services are governed by their own terms and privacy policies. UnifyAI is not
            responsible for the availability, accuracy, or practices of third-party services. You are
            responsible for reviewing the permissions granted to each integration.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>8. Intellectual Property</h2>
          <p>
            The UnifyAI platform, branding, software, and related materials are owned by UnifyAI and
            its licensors. These Terms do not grant you any license or right to use UnifyAI
            trademarks without prior written consent.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>9. AI-Generated Content</h2>
          <div className="legal-highlight">
            <p>
              <strong>AI responses may contain inaccuracies.</strong> Before acting on any
              AI-generated content, including search results, summaries, or action items, you should
              verify the information is correct and appropriate for your situation. UnifyAI does not
              guarantee the accuracy, completeness, or reliability of AI-generated output.
            </p>
          </div>
          <p>
            The Service is designed with safety controls, including confidence thresholds and source
            citations, but AI-generated responses should be treated as assistive, not authoritative.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>10. Workflow Automation</h2>
          <p>
            Certain workflows may trigger actions in connected systems. UnifyAI requires explicit
            human confirmation for actions that can modify data or perform sensitive operations.
            You are responsible for reviewing and approving any automated actions before they execute.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>11. Service Availability</h2>
          <p>
            UnifyAI aims to provide reliable service, but the Service is provided "as is" and "as
            available." Scheduled maintenance, updates, integration limitations, and unforeseen
            incidents may affect availability and performance. There is no guarantee of uninterrupted
            service.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>12. Disclaimer</h2>
          <p>
            To the fullest extent permitted by law, UnifyAI disclaims all warranties, express or
            implied, including warranties of merchantability, fitness for a particular purpose, and
            non-infringement, to the extent permitted by applicable law. The Service is not a
            substitute for professional advice.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>13. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, UnifyAI shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of data,
            revenue, or business, arising from the use of the Service. The total liability of
            UnifyAI shall not exceed the greater of the amounts paid by you for the Service or one
            hundred dollars ($100). Nothing in these Terms excludes liability for gross negligence,
            willful misconduct, or fraud.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>14. Changes to Terms</h2>
          <p>
            These Terms may be updated from time to time. Changes are effective immediately upon
            posting. Your continued use of the Service after changes constitutes acceptance of the
            updated Terms.
          </p>
        </motion.section>

        <motion.section className="legal-section" variants={staggerItem}>
          <h2>15. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us through the UnifyAI platform support
            channels or use the contact mechanisms available within the application.
          </p>
        </motion.section>
      </motion.div>

      <motion.nav className="legal-nav" variants={staggerItem}>
        <Link to={ROUTES.ROOT} className="legal-back">
          ← Back to UnifyAI
        </Link>
      </motion.nav>
    </motion.div>
  );
};

export default TermsPage;
