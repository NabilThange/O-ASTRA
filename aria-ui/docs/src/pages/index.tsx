import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Aria Documentation
        </Heading>
        <p className="hero__subtitle">
          Open-source AI Desktop Agent — An AI that has its own computer to complete tasks for you
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/docs/prd"
            style={{marginRight: '1rem'}}>
            Get Started (PRD)
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/docs/docs/frontend">
            Quick Start (Frontend)
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Internal documentation for the Aria project - AI Desktop Agent">
      <HomepageHeader />
      <main>
        <div className="container" style={{marginTop: '3rem', marginBottom: '3rem'}}>
          <div className="row">
            <div className="col col--4">
              <h3>🚀 Quick Start</h3>
              <p>Get Aria running locally in 3 terminals with Docker, PostgreSQL, and the desktop environment.</p>
              <Link to="/docs/docs/frontend">Frontend Setup →</Link>
            </div>
            <div className="col col--4">
              <h3>🏗️ Architecture</h3>
              <p>Understand how Aria's components work together: Next.js UI, NestJS backend, AI engine, and Ubuntu desktop.</p>
              <Link to="/docs/docs/architecture">View Architecture →</Link>
            </div>
            <div className="col col--4">
              <h3>📊 Progress</h3>
              <p>Track what's completed, in progress, and planned for the project submission.</p>
              <Link to="/docs/docs/progress">View Progress →</Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
