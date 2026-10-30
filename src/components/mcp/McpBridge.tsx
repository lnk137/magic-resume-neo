import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useResumeStore, restoreMcpStoreSnapshot } from '@/store/useResumeStore';
import { blankResumeState } from '@/config/initialResumeData';
import { DEFAULT_TEMPLATES } from '@/config';
import type { ResumeData } from '@/types/resume';
import { sanitizeResumeRichText } from './sanitize';
import { applyOperation, publicResumes } from '../../../mcp/operations.mjs';

type Pair = { session_id: string; browser_token: string };
type Command = { id: string; action: string; args: Record<string, any>; expected_revision: string };

const PREFERENCE_KEY = 'magic-resume-mcp-enabled';
const SESSION_KEY = 'magic-resume-mcp-session';
const McpContext = createContext<{ enabled: boolean | null; status: string; setEnabled: (enabled: boolean) => void }>({ enabled: null, status: '连接中', setEnabled: () => {} });
export const useMcp = () => useContext(McpContext);

class McpRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }

export function McpProvider({ children }: { children: ReactNode }) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [enabled, setEnabledState] = useState<boolean | null>(null);
  const enabledRef = useRef(false);
  const cleanedPrevious = useRef(false);
  const [status, setStatus] = useState('未连接');
  const revision = useRef(0);
  const generation = useRef('');
  const history = useRef<{ state: ReturnType<typeof useResumeStore.getState>; after: string }[]>([]);
  const liveRevision = () => `${generation.current}:${revision.current}`;

  useEffect(() => useResumeStore.subscribe((state, previous) => {
    if (state.resumes !== previous.resumes) revision.current += 1;
  }), []);

  async function request(path: string, data: unknown, current = pair) {
    const response = await fetch(`/api/mcp/browser/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Magic-Mcp': 'browser', ...(current ? { 'X-Mcp-Browser-Token': current.browser_token } : {}) },
      body: JSON.stringify(data), signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    if (!response.ok) throw new McpRequestError(body.error || '连接失败', response.status);
    return body;
  }

  const setEnabled = (next: boolean) => {
    try { localStorage.setItem(PREFERENCE_KEY, String(next)); } catch { /* Keep the current tab usable if storage is unavailable. */ }
    enabledRef.current = next;
    setEnabledState(next);
  };

  useEffect(() => {
    let initial = true;
    try { initial = localStorage.getItem(PREFERENCE_KEY) !== 'false'; } catch { /* Default to enabled. */ }
    enabledRef.current = initial;
    setEnabledState(initial);
    const onStorage = (event: StorageEvent) => {
      if (event.key === PREFERENCE_KEY) {
        enabledRef.current = event.newValue !== 'false';
        setEnabledState(enabledRef.current);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (enabled !== false) return;
    setStatus('未连接');
    history.current = [];
    if (pair) {
      setPair(null);
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* session storage is optional */ }
      void request('disconnect', { session_id: pair.session_id }, pair).catch(() => {});
    }
  }, [enabled, pair]);

  useEffect(() => {
    if (enabled !== true || pair) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    async function attempt() {
      setStatus('连接中');
      try {
        if (!cleanedPrevious.current) {
          cleanedPrevious.current = true;
          try {
            const previous: Pair | null = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
            sessionStorage.removeItem(SESSION_KEY);
            if (previous?.session_id && previous.browser_token) await request('disconnect', { session_id: previous.session_id }, previous).catch(() => {});
          } catch { /* Ignore invalid or unavailable session storage. */ }
        }
        const connected: Pair = await request('pair', { label: `${navigator.platform || 'Browser'} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` }, null);
        if (disposed) { void request('disconnect', { session_id: connected.session_id }, connected).catch(() => {}); return; }
        generation.current = connected.session_id; revision.current = 0; history.current = [];
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(connected)); } catch { /* session storage is optional */ }
        setPair(connected);
      } catch (error) {
        if (!disposed) { setStatus(error instanceof Error ? error.message : '连接失败'); timer = setTimeout(attempt, 3000); }
      }
    }
    void attempt();
    return () => { disposed = true; clearTimeout(timer); };
  }, [enabled, pair]);

  useEffect(() => {
    if (!pair) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let published = '';
    let ack: { id: string; error?: string; result?: unknown } | null = null;
    const templates = DEFAULT_TEMPLATES.map(t => ({ id: t.id, name: t.name }));
    function apply(command: Command) {
      const before = useResumeStore.getState();
      const persisted = JSON.parse(localStorage.getItem('resume-storage') || '{}');
      if (persisted.state && JSON.stringify(persisted.state.resumes) !== JSON.stringify(before.resumes)) throw new Error('Another browser tab changed local storage. Reload this tab, reconnect MCP and read before editing.');
      if (command.expected_revision !== liveRevision()) throw new Error('Revision conflict: browser changed after the AI read it. Read and retry.');
      const restore = (saved: typeof before) => {
        // A single synchronous store write keeps UI, persistence and cross-module data atomic.
        restoreMcpStoreSnapshot(saved);
      };
      if (command.action === 'undo') {
        const entry = history.current.at(-1);
        if (!entry) throw new Error('No MCP change to undo in this connection');
        if (entry.after !== liveRevision()) throw new Error('Manual edits followed this MCP change; undo would overwrite them. Use editor undo or a targeted edit.');
        try {
          restore(entry.state);
          localStorage.setItem('resume-storage', JSON.stringify({ state: { resumes: entry.state.resumes, activeResumeId: entry.state.activeResumeId }, version: 0 }));
        } catch (error) { restore(before); throw error; }
        history.current.pop();
        const previous = history.current.at(-1); if (previous) previous.after = liveRevision();
        return { undone: true };
      }
      const result = applyOperation(publicResumes(before.resumes), command.action, command.args, blankResumeState, templates.map(t => t.id));
      const newResumes = result.resumes as Record<string, ResumeData>;
      // GitHub credentials never cross the MCP bridge and cannot be changed by AI.
      for (const [id, resume] of Object.entries(newResumes)) resume.basic.githubKey = before.resumes[id]?.basic.githubKey || '';
      const targetId = result.resume_id as string;
      try {
        if (result.deleted) {
          const resumes = { ...before.resumes }; delete resumes[targetId];
          const activeResumeId = before.activeResumeId === targetId ? null : before.activeResumeId;
          useResumeStore.setState({ resumes, activeResumeId, activeResume: activeResumeId ? resumes[activeResumeId] : null });
        } else if (before.resumes[targetId]) before.updateResume(targetId, sanitizeResumeRichText(newResumes[targetId], before.resumes[targetId]));
        else before.addResume(sanitizeResumeRichText(newResumes[targetId], command.action === 'resume_duplicate' ? before.resumes[command.args.resume_id] : undefined));
        const state = useResumeStore.getState();
        // Persist middleware deliberately catches quota errors; MCP must acknowledge durability explicitly.
        localStorage.setItem('resume-storage', JSON.stringify({ state: { resumes: state.resumes, activeResumeId: state.activeResumeId }, version: 0 }));
        history.current.push({ state: before, after: liveRevision() }); history.current = history.current.slice(-30);
        return { resume_id: targetId, result_id: result.result_id, deleted: !!result.deleted, persisted: true };
      } catch (error) { restore(before); throw error; }
    }
    async function tick() {
      try {
        const state = useResumeStore.getState();
        const signature = `${liveRevision()}:${state.activeResumeId}`;
        const snapshot = signature !== published ? { revision: liveRevision(), active_resume_id: state.activeResumeId, resumes: publicResumes(state.resumes), templates } : undefined;
        const result = await request('sync', { session_id: pair!.session_id, snapshot, ack }, pair);
        if (disposed) return;
        published = signature;
        ack = null; setStatus('已连接');
        if (result.command) {
          try {
            if (!enabledRef.current) throw new Error('MCP has been disabled');
            ack = { id: result.command.id, result: apply(result.command) };
          }
          catch (error) { ack = { id: result.command.id, error: error instanceof Error ? error.message : 'Edit failed' }; }
        }
      } catch (error) {
        if (!disposed) {
          if (error instanceof McpRequestError && error.status === 401) {
            history.current = []; setPair(null);
            try { sessionStorage.removeItem(SESSION_KEY); } catch { /* session storage is optional */ }
          }
          setStatus(error instanceof Error ? error.message : '连接中断');
        }
      }
      if (!disposed) timer = setTimeout(tick, ack ? 0 : 900);
    }
    void tick();
    return () => { disposed = true; clearTimeout(timer); };
  }, [pair]);

  return <McpContext.Provider value={{ enabled, status, setEnabled }}>{children}</McpContext.Provider>;
}
