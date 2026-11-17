// Hidden command terminal (Ctrl/⌘ + K or the ` key).
// A small easter egg for the curious, and a fast way to navigate.

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { scrollToId } from '../data';

type Line = { kind: 'cmd' | 'out' | 'err' | 'ok'; text: string };

const HELP = `available commands
  scan        jump to the 90-second neural scan
  features    see the arsenal
  shield      try to cheat (you won't get far)
  analytics   the holographic dashboard
  journey     the five phases
  start       create your account
  login       sign in
  whoami      identify yourself
  date        system time
  clear       clear the screen
  exit        close the terminal`;

const SECTIONS = ['scan', 'features', 'shield', 'analytics', 'journey'];

const NexusTerminal = ({ onClose, onNavigate, isAuthed }: { onClose: () => void; onNavigate: (path: string) => void; isAuthed: boolean }) => {
  const [lines, setLines] = useState<Line[]>([
    { kind: 'ok', text: 'NEXUS terminal v3.0 · secure shell established' },
    { kind: 'out', text: 'type `help` to list commands' },
  ]);
  const [value, setValue] = useState('');
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    const out: Line[] = [{ kind: 'cmd', text: raw }];
    const closeAnd = (fn: () => void) => {
      setTimeout(() => {
        onClose();
        fn();
      }, 350);
    };

    if (!cmd) {
      setLines((l) => [...l, ...out]);
      return;
    }
    history.current.unshift(raw);
    hIdx.current = -1;

    if (cmd === 'help' || cmd === '?') out.push({ kind: 'out', text: HELP });
    else if (cmd === 'clear' || cmd === 'cls') {
      setLines([]);
      return;
    } else if (cmd === 'exit' || cmd === 'quit') {
      onClose();
      return;
    } else if (SECTIONS.includes(cmd)) {
      out.push({ kind: 'ok', text: `→ routing to #${cmd}…` });
      closeAnd(() => scrollToId(cmd));
    } else if (['start', 'register', 'signup'].includes(cmd)) {
      out.push({ kind: 'ok', text: isAuthed ? '→ already authenticated · opening dashboard…' : '→ opening registration…' });
      closeAnd(() => onNavigate(isAuthed ? '/dashboard' : '/register'));
    } else if (cmd === 'login' || cmd === 'signin') {
      out.push({ kind: 'ok', text: '→ opening secure sign-in…' });
      closeAnd(() => onNavigate(isAuthed ? '/dashboard' : '/login'));
    } else if (cmd === 'whoami') {
      out.push({ kind: 'out', text: isAuthed ? 'operator · authenticated. your dashboard misses you.' : 'guest@nexus · rank: unranked. run `start` to fix that.' });
    } else if (cmd === 'date') {
      out.push({ kind: 'out', text: new Date().toString() });
    } else if (cmd.startsWith('sudo')) {
      out.push({ kind: 'err', text: 'permission denied. the integrity shield has logged this attempt. 😏' });
    } else if (cmd === 'hack' || cmd === 'cheat') {
      out.push({ kind: 'err', text: 'nice try. 3-strike auto-submit says hello.' });
    } else if (cmd === 'ls') {
      out.push({ kind: 'out', text: 'quant/  logic/  verbal/  mocks/  leaderboard/  .secrets (access denied)' });
    } else {
      out.push({ kind: 'err', text: `command not found: ${cmd} · try \`help\`` });
    }
    setLines((l) => [...l, ...out]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(value);
    setValue('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(history.current.length - 1, hIdx.current + 1);
      if (next >= 0) {
        hIdx.current = next;
        setValue(history.current[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = hIdx.current - 1;
      hIdx.current = Math.max(-1, next);
      setValue(next >= 0 ? history.current[next] : '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const all = ['help', 'scan', 'features', 'shield', 'analytics', 'journey', 'start', 'login', 'whoami', 'date', 'clear', 'exit'];
      const hit = all.find((c) => c.startsWith(value.trim().toLowerCase()));
      if (hit) setValue(hit);
    }
  };

  return (
    <motion.div
      className="nx-term-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="nx-term"
        role="dialog"
        aria-modal="true"
        aria-label="NEXUS terminal"
        initial={{ y: -20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -12, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="nx-term-bar">
          <span>NEXUS://TERMINAL</span>
          <span>ESC TO CLOSE</span>
        </div>
        <div className="nx-term-out" ref={outRef}>
          {lines.map((l, i) => (
            <div key={i} className={`is-${l.kind}`}>
              {l.text}
            </div>
          ))}
        </div>
        <form className="nx-term-in" onSubmit={submit}>
          <span>guest@nexus:~$</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal command"
          />
        </form>
      </motion.div>
    </motion.div>
  );
};

export default NexusTerminal;
