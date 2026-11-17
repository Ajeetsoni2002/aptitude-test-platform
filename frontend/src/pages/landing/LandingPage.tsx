// Public landing page for NEXUS. Lazy-loaded from AppRouter so the
// authenticated app bundle does not carry the landing visuals.

import '@fontsource-variable/geist/index.css';
import './landing.css';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

import AmbientCursor from './components/AmbientCursor';
import BootSequence from './components/BootSequence';
import FeatureBento from './components/FeatureBento';
import Hero from './components/Hero';
import HoloAnalytics from './components/HoloAnalytics';
import Journey from './components/Journey';
import LandingFooter from './components/LandingFooter';
import LandingNav from './components/LandingNav';
import Marquee from './components/Marquee';
import NeuralScan from './components/NeuralScan';
import NexusTerminal from './components/NexusTerminal';
import PortalCTA from './components/PortalCTA';
import ProctorShield from './components/ProctorShield';
import StatsBand from './components/StatsBand';
import WarpTransition from './components/WarpTransition';

const BOOT_KEY = 'nx_booted';

const shouldBoot = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(BOOT_KEY) !== '1';
  } catch {
    return false;
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const [booting, setBooting] = useState(shouldBoot);
  const [terminal, setTerminal] = useState(false);
  const [warpTo, setWarpTo] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  const ready = !booting;

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, '1');
    } catch {
      /* storage unavailable: boot will simply show again next time */
    }
    setBooting(false);
  }, []);

  // Page chrome: force the dark canvas + title while the landing is mounted.
  useEffect(() => {
    document.body.classList.add('nx-body');
    const prevTitle = document.title;
    document.title = 'NEXUS · Aptitude Intelligence Platform';
    return () => {
      document.body.classList.remove('nx-body');
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    if (!booting) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [booting]);

  // Ctrl/⌘ + K or ` toggles the terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setTerminal((t) => !t);
      } else if (e.key === '`' && !typing) {
        e.preventDefault();
        setTerminal((t) => !t);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeTerminal = useCallback(() => setTerminal(false), []);
  const enter = () => setWarpTo(isAuthed ? '/dashboard' : '/register');
  const onWarpDone = useCallback(() => {
    if (warpTo) navigate(warpTo);
  }, [navigate, warpTo]);

  return (
    <div className="nx-root">
      <motion.div className="nx-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <div className="nx-grain" aria-hidden="true" />
      <AmbientCursor />

      <LandingNav isAuthed={isAuthed} ready={ready} />

      <main>
        <Hero ready={ready} isAuthed={isAuthed} />
        <Marquee />
        <NeuralScan isAuthed={isAuthed} />
        <FeatureBento />
        <ProctorShield />
        <HoloAnalytics />
        <Journey />
        <StatsBand />
        <PortalCTA isAuthed={isAuthed} onEnter={enter} />
      </main>

      <LandingFooter isAuthed={isAuthed} onOpenTerminal={() => setTerminal(true)} />

      <AnimatePresence>
        {terminal && <NexusTerminal key="terminal" onClose={closeTerminal} onNavigate={(p) => navigate(p)} isAuthed={isAuthed} />}
      </AnimatePresence>

      <AnimatePresence>{booting && <BootSequence key="boot" onDone={finishBoot} />}</AnimatePresence>

      {warpTo && <WarpTransition onDone={onWarpDone} />}
    </div>
  );
};

export default LandingPage;
