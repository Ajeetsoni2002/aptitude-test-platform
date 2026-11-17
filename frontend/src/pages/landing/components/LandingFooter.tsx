import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { LogoMark } from './LandingNav';
import { scrollToId } from '../data';

const LandingFooter = ({ isAuthed, onOpenTerminal }: { isAuthed: boolean; onOpenTerminal: () => void }) => (
  <footer className="nx-footer">
    <div className="nx-container">
      <div className="nx-footer-top">
        <div style={{ maxWidth: 340 }}>
          <div className="nx-logo" style={{ cursor: 'default' }}>
            <LogoMark />
            <span className="nx-logo-word">NEXUS</span>
          </div>
          <p className="nx-body-text" style={{ marginTop: 16 }}>
            The aptitude intelligence platform. Adaptive tests, an AI tutor, exam-grade proctoring and analytics, all in your browser.
          </p>
          <button type="button" className="nx-btn nx-btn-ghost nx-btn-sm" style={{ marginTop: 8 }} onClick={onOpenTerminal}>
            <Terminal size={15} /> Open terminal
            <span className="nx-kbd" style={{ marginLeft: 4 }}>Ctrl</span>
            <span className="nx-kbd">K</span>
          </button>
        </div>

        <div className="nx-footer-cols">
          <div className="nx-footer-col">
            <h5>Explore</h5>
            <button type="button" onClick={() => scrollToId('scan')}>Neural Scan</button>
            <button type="button" onClick={() => scrollToId('features')}>Features</button>
            <button type="button" onClick={() => scrollToId('shield')}>Proctor Shield</button>
            <button type="button" onClick={() => scrollToId('analytics')}>Analytics</button>
          </div>
          <div className="nx-footer-col">
            <h5>Account</h5>
            {isAuthed ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/test-setup">Start a test</Link>
                <Link to="/leaderboard">Leaderboard</Link>
              </>
            ) : (
              <>
                <Link to="/register">Create account</Link>
                <Link to="/login">Sign in</Link>
              </>
            )}
          </div>
          <div className="nx-footer-col">
            <h5>Domains</h5>
            <span className="nx-body-text" style={{ display: 'block', padding: '5px 0' }}>Quantitative</span>
            <span className="nx-body-text" style={{ display: 'block', padding: '5px 0' }}>Logical</span>
            <span className="nx-body-text" style={{ display: 'block', padding: '5px 0' }}>Verbal</span>
          </div>
        </div>
      </div>

      <div className="nx-wordmark" aria-hidden="true">
        NEXUS
      </div>

      <div className="nx-hairline" style={{ marginTop: 24 }} />
      <div className="nx-footer-bottom">
        <span>© {new Date().getFullYear()} NEXUS · Aptitude Intelligence Platform</span>
        <span className="nx-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
          <i className="nx-dot" /> all systems operational
        </span>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
