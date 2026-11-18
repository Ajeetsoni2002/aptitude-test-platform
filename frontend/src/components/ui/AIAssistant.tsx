// src/components/ui/AIAssistant.tsx
// Floating study-help chat: a round button that opens a small chat panel.

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Send, MessageCircle, RotateCcw, Copy, Check } from 'lucide-react';
import { chatWithAIApi, type ChatMessage } from '@/api/aiApi';

// ── Quick suggestion chips ────────────────────────────────────
const SUGGESTIONS = [
  'Solve: A train crosses a pole in 12 sec at 54 km/h. Find length.',
  'Explain permutations vs combinations with examples',
  'Give me a 14-day placement aptitude plan',
  'Solve a medium time & work problem step by step',
  'Write C++ code for binary search with complexity',
  'Explain SQL joins for interviews',
];

// ── Simple markdown-to-JSX renderer ──────────────────────────
const MarkdownText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const language = line.trim().replace(/```/, '').trim();
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      elements.push(
        <pre key={`code-${i}`} className="my-2 max-w-full overflow-x-auto rounded-lg border border-line bg-canvas p-2.5 font-mono text-[12px] leading-relaxed text-ink/85">
          {language && <div className="label-caps mb-1 !text-[10px]">{language}</div>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (/^\|.+\|$/.test(line.trim())) {
      const tableLines = [line];
      i++;

      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i]);
        i++;
      }
      i--;

      elements.push(
        <div key={`table-${i}`} className="my-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-[12px]">
            <tbody>
              {tableLines
                .filter((row) => !/^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(row))
                .map((row, rowIndex) => (
                  <tr key={`${row}-${rowIndex}`} className={rowIndex === 0 ? 'bg-ink/[0.04] text-ink font-medium' : 'border-t border-line'}>
                    {row.split('|').filter(Boolean).map((cell, cellIndex) => (
                      <td key={`${cell}-${cellIndex}`} className="px-2 py-1 align-top">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    } else if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-1" />);
    } else if (line.startsWith('### ')) {
      elements.push(
        <p key={i} className="font-semibold text-ink text-[13px] mt-2 mb-0.5">
          {line.replace('### ', '')}
        </p>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="font-semibold text-ink text-sm mt-3 mb-1">
          {line.replace('## ', '')}
        </p>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-semibold text-ink text-[13px]">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 text-[13px] leading-relaxed">
          <span className="text-ink/40 flex-shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 text-[13px] leading-relaxed">
          <span className="text-ink/55 flex-shrink-0 font-mono text-xs mt-px">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\. /, ''))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-[13px] leading-relaxed">{renderInline(line)}</p>
      );
    }
    i++;
  }
  return <div className="space-y-1">{elements}</div>;
};

const renderInline = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-ink">{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('`')) {
      parts.push(<code key={match.index} className="bg-ink/[0.06] text-ink px-1 py-0.5 rounded text-[12px] font-mono">{raw.slice(1, -1)}</code>);
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

// ── Copy button ───────────────────────────────────────────────
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title="Copy" aria-label="Copy reply" className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded bg-raised hover:bg-ink/[0.06] text-ink/40 hover:text-ink/70">
      {copied ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────
const AIAssistant = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role:    'ai',
      content: "Hi! Ask me about anything you're studying. For example:\n- **An aptitude question**, solved step by step\n- **A study plan** for the weeks before your exam\n- **A topic** explained in plain language\n- **Tips** for placement tests like TCS or Infosys\n\nWhat are you working on?",
    },
  ]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [error,   setError]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;
    setError('');

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await chatWithAIApi(text.trim(), messages);
      if (res.success && res.data?.reply) {
        setMessages((prev) => [...prev, { role: 'ai', content: res.data!.reply }]);
      } else {
        setError(res.message || 'AI response failed. Please try again.');
        // Remove user message on failure
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('[AI Chat Error]', error);
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      let errorMsg = responseMessage || 'Network error. Please check your connection.';
      
      // More detailed error reporting
      if (!responseMessage && error instanceof Error) {
        if (error.message.includes('401')) {
          errorMsg = 'You need to login to use the AI assistant.';
        } else if (error.message.includes('Network')) {
          errorMsg = 'Network error. Make sure the backend server is running.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Request timed out. Please try again.';
        } else {
          errorMsg = error.message || 'Network error. Please try again.';
        }
      }
      
      setError(errorMsg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role:    'ai',
      content: "Chat cleared. What would you like to work on next?",
    }]);
    setError('');
  };

  return (
    <>
      {/* ── Round toggle button ──────────────────────────────── */}
      <button
        id="ai-assistant-toggle"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full',
          'flex items-center justify-center',
          'bg-ink text-paper shadow-lift hover:bg-ink/85',
          'transition-colors duration-150',
        )}
        aria-label={isOpen ? 'Close study help' : 'Open study help'}
        aria-expanded={isOpen}
        title="Study help"
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* ── Chat Panel ───────────────────────────────────────── */}
      <div
        role="dialog"
        aria-label="Study help"
        className={cn(
          'fixed bottom-[88px] right-6 z-50 w-[min(calc(100vw-3rem),26rem)]',
          'bg-surface rounded-[14px] border border-line shadow-float',
          'flex flex-col overflow-hidden',
          'transition-[opacity,transform] duration-200 origin-bottom-right',
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Study help</p>
            <p className="text-xs text-ink/55">
              {typing ? 'Writing a reply…' : 'Ask about a question, topic or study plan'}
            </p>
          </div>
          <button onClick={clearChat} title="Clear chat" aria-label="Clear chat"
            className="p-1.5 rounded-lg text-ink/45 hover:text-ink hover:bg-ink/[0.05] transition-colors">
            <RotateCcw size={15} />
          </button>
          <button onClick={() => setIsOpen(false)} title="Close" aria-label="Close"
            className="p-1.5 rounded-lg text-ink/45 hover:text-ink hover:bg-ink/[0.05] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[60vh]" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={cn('flex', msg.role === 'user' && 'justify-end')}>
              <div className={cn(
                'max-w-[85%] px-3.5 py-2.5 rounded-[12px] group relative',
                msg.role === 'ai'
                  ? 'bg-raised border border-line text-ink/90 rounded-tl-[4px] pr-8'
                  : 'bg-brand text-on-brand rounded-tr-[4px]'
              )}>
                {msg.role === 'ai' ? (
                  <MarkdownText text={msg.content} />
                ) : (
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === 'ai' && (
                  <div className="absolute top-1.5 right-1.5">
                    <CopyButton text={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex animate-fade-in">
              <div className="bg-raised border border-line rounded-[12px] rounded-tl-[4px] px-3.5 py-3 flex gap-1" aria-label="Writing a reply">
                {[0, 0.15, 0.3].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-neon-pulse" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-bad/10 border border-bad/25 rounded-[10px] px-3 py-2.5 text-bad text-[13px]">
              {error}
              <button onClick={() => setError('')} className="ml-2 underline opacity-80 hover:opacity-100">Dismiss</button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full border border-line bg-surface text-ink/70 hover:text-ink hover:border-ink/30 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-line flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Type a question…"
            disabled={typing}
            className="flex-1 cyber-input h-10 text-sm px-3 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            aria-label="Send"
            className="w-10 h-10 rounded-[10px] bg-brand text-on-brand flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {typing ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
