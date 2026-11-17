import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { NAV_LINKS, scrollToId } from '../data';

export const LogoMark = () => (
  <span className="nx-logo-mark" aria-hidden="true">
    <svg viewBox="0 0 30 30" className="nx-logo-spin">
      <defs>
        <linearGradient id="nx-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="55%" stopColor="#A970FF" />
          <stop offset="100%" stopColor="#FF3DBB" />
        </linearGradient>
      </defs>
      <circle cx="15" cy="15" r="13" fill="none" stroke="url(#nx-logo-g)" strokeWidth="1.4" strokeDasharray="5 3" />
    </svg>
    <svg viewBox="0 0 30 30">
      <path d="M15 7 L22 11 L22 19 L15 23 L8 19 L8 11 Z" fill="none" stroke="url(#nx-logo-g)" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="2.6" fill="#00F5FF" style={{ filter: 'drop-shadow(0 0 4px #00F5FF)' }} />
    </svg>
  </span>
);

const LandingNav = ({ isAuthed, ready }: { isAuthed: boolean; ready: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <motion.div
        className="nx-nav-wrap"
        initial={{ y: -90, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <nav className={`nx-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Main">
          <button type="button" className="nx-logo" onClick={() => go('top')} aria-label="NEXUS, back to top">
            <LogoMark />
            <span className="nx-logo-word">NEXUS</span>
          </button>

          <span className="nx-nav-status">
            <i className="nx-dot" /> SYS ONLINE
          </span>

          <div className="nx-nav-links">
            {NAV_LINKS.map((l) => (
              <button key={l.id} type="button" className="nx-nav-link" onClick={() => go(l.id)}>
                {l.label}
              </button>
            ))}
          </div>

          {isAuthed ? (
            <Link to="/dashboard" className="nx-btn nx-btn-primary nx-btn-sm nx-nav-cta">
              Dashboard <ArrowRight size={15} className="nx-btn-arrow" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="nx-nav-signin">
                Sign in
              </Link>
              <Link to="/register" className="nx-btn nx-btn-primary nx-btn-sm nx-nav-cta">
                Get started <ArrowRight size={15} className="nx-btn-arrow" />
              </Link>
            </>
          )}

          <button type="button" className="nx-menu-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nx-mobile-menu"
            initial={{ opacity: 0, clipPath: 'circle(0% at 92% 6%)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at 92% 6%)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at 92% 6%)' }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {NAV_LINKS.map((l, i) => (
              <motion.button
                key={l.id}
                type="button"
                className="nx-mobile-link"
                onClick={() => go(l.id)}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <span>0{i + 1}</span>
                {l.label}
              </motion.button>
            ))}
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isAuthed ? (
                <Link to="/dashboard" className="nx-btn nx-btn-primary">
                  Open dashboard <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="nx-btn nx-btn-primary">
                    Get started <ArrowRight size={17} />
                  </Link>
                  <Link to="/login" className="nx-btn nx-btn-ghost">
                    Sign in
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNav;
