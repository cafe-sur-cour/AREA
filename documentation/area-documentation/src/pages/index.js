import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro" style={{ margin: '1rem', fontSize: '1.2rem' }}>
            🌇 Project overview
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/How to contribute/_category_.json" style={{ margin: '1rem', fontSize: '1.2rem' }}>
            🧱 How to contribute
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/building" style={{ margin: '1rem', fontSize: '1.2rem' }}>
            🏗️ Project Architecture
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/projectcomunication" style={{ margin: '1rem', fontSize: '1.2rem' }}>
            📲 Project Communication
          </Link>
        </div>
        <div style={{ marginTop: '3rem' }}>
          <Link className="button button--secondary button--lg" to="/docs/accessibility" style={{ margin: '1rem', fontSize: '1.2rem' }}>
            🪪 Accessibility and Security
          </Link>
          <a
            href="/Area-project-plan-1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="button button--secondary button--lg"
            style={{ fontSize: '1.1rem', color: '#0078e7', textDecoration: 'underline' }}
          >
            🗺️ Link to project plan
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
