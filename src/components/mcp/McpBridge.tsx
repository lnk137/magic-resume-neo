import { useEffect, useRef, useState } from 'react';
import { Plug, Unplug, X, Loader2 } from 'lucide-react';
import { useResumeStore, restoreMcpStoreSnapshot } from '@/store/useResumeStore';
import { blankResumeState } from '@/config/initialResumeData';
import { DEFAULT_TEMPLATES } from '@/config';
import type { ResumeData } from '@/types/resume';
import { sanitizeResumeRichText } from './sanitize';
import { applyOperation, publicResumes } from '../../../mcp/operations.mjs';

type Pair = { session_id: string; browser_token: string };
type Command = { id: string; action: string; args: Record<string, any>; expected_revision: string };

export function McpBridge() {
  const [pair, setPair] = useState<Pair | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
    if (!response.ok) throw new Error(body.error || '连接失败');
    return body;
  }

  async function connect() {
    setBusy(true);
    try {
      const connected: Pair = await request('pair', { label: `${navigator.platform || 'Browser'} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` });
      generation.current = connected.session_id; revision.current = 0; history.current = [];
      setPair(connected); setStatus('连接中');
    } catch (error) { setStatus(error instanceof Error ? error.message : '连接失败'); }
    finally { setBusy(false); }
  }

  async function disconnect() {
    if (!pair) return;
    setPair(null); history.current = []; setStatus('未连接');
    try { await request('disconnect', { session_id: pair.session_id }, pair); } catch { /* Server expires offline sessions automatically. */ }
  }

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
          try { ack = { id: result.command.id, result: apply(result.command) }; }
          catch (error) { ack = { id: result.command.id, error: error instanceof Error ? error.message : 'Edit failed' }; }
        }
      } catch (error) { if (!disposed) setStatus(error instanceof Error ? error.message : '连接中断'); }
      if (!disposed) timer = setTimeout(tick, ack ? 0 : 900);
    }
    void tick();
    return () => { disposed = true; clearTimeout(timer); };
  }, [pair]);

  return <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-[80] text-sm md:bottom-4">
    {open && <div className="mb-2 w-72 rounded-2xl border border-black/10 bg-[#faf9f6] p-4 text-[#292723] shadow-xl dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between"><span className="font-semibold">AI · MCP</span><button type="button" aria-label="关闭 MCP 面板" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-black/5"><X size={16}/></button></div>
      <p role="status" className="my-3 break-words text-xs text-zinc-500">{status}</p>
      <button type="button" disabled={busy} onClick={pair ? disconnect : connect} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#302e29] px-4 py-2.5 font-medium text-white transition hover:bg-[#4b4840] disabled:opacity-50">
        {busy ? <Loader2 size={16} className="animate-spin"/> : pair ? <Unplug size={16}/> : <Plug size={16}/>} {pair ? '断开 AI 访问' : '允许 AI 访问此浏览器'}
      </button>
      <a href="/mcp-guide.html" target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs text-zinc-500 underline underline-offset-4">连接说明</a>
    </div>}
    <button type="button" aria-label="MCP 连接" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-9 items-center gap-2 rounded-full border border-black/10 bg-[#faf9f6]/95 px-3 text-xs font-medium text-[#302e29] shadow-sm backdrop-blur transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"><span className={`h-1.5 w-1.5 rounded-full ${pair && status === '已连接' ? 'bg-emerald-500' : 'bg-zinc-400'}`}/><Plug size={13}/> MCP</button>
  </div>;
}
