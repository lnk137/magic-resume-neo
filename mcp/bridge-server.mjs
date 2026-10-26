import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { actions, checkJson } from './operations.mjs';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const sameSecret = (a, b) => typeof a === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function createMcpBridge({ tokenFile = resolve('.cache/mcp-token'), timeoutMs = 12000 } = {}) {
  mkdirSync(dirname(tokenFile), { recursive: true, mode: 0o700 });
  let token = existsSync(tokenFile) ? readFileSync(tokenFile, 'utf8').trim() : '';
  if (!/^[a-f0-9]{64}$/.test(token)) { token = randomBytes(32).toString('hex'); writeFileSync(tokenFile, token, { mode: 0o600 }); }
  chmodSync(tokenFile, 0o600);
  const sessions = new Map();
  const online = s => Date.now() - s.lastSeen < 15000;
  function send(res, status, data) { res.writeHead(status, { 'Content-Type':'application/json', 'Cache-Control':'no-store' }); res.end(JSON.stringify(data)); }
  async function body(req) {
    let size = 0; const chunks = [];
    for await (const chunk of req) { size += chunk.length; if (size > 32_000_000) throw new Error('Payload too large'); chunks.push(chunk); }
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  }
  function snapshot(session) {
    return { session_id: session.id, label: session.label, revision: session.snapshot?.revision, active_resume_id: session.snapshot?.active_resume_id, resumes: session.snapshot?.resumes || {}, templates: session.snapshot?.templates || [] };
  }
  return async function handle(req, res, url) {
    if (!url.pathname.startsWith('/api/mcp/')) return false;
    try {
      if (!LOOPBACK.has(req.socket.remoteAddress) || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) { send(res,403,{error:'MCP is available on loopback only'}); return true; }
      const origin = req.headers.origin;
      if (origin && origin !== url.origin) { send(res,403,{error:'Cross-origin MCP requests rejected'}); return true; }
      if (req.method !== 'POST') { send(res,405,{error:'POST required'}); return true; }
      const data = await body(req);
      const browserRoute = url.pathname.startsWith('/api/mcp/browser/');
      if (browserRoute) {
        if (origin !== url.origin || req.headers['x-magic-mcp'] !== 'browser') { send(res,403,{error:'Same-origin browser request required'}); return true; }
        if (url.pathname === '/api/mcp/browser/pair') {
          for (const [key, entry] of sessions) if (Date.now()-entry.lastSeen > 3600000 && !entry.pending) sessions.delete(key);
          if (sessions.size >= 10) throw new Error('Too many paired browser sessions');
          const session = {id:randomUUID(), secret:randomBytes(32).toString('hex'), label:typeof data.label === 'string' ? data.label.slice(0,100) : 'Browser', lastSeen:Date.now(), snapshot:null, pending:null, audit:[]};
          sessions.set(session.id,session); send(res,200,{session_id:session.id, browser_token:session.secret}); return true;
        }
        const session = sessions.get(data.session_id);
        if (!session || !sameSecret(req.headers['x-mcp-browser-token'], session.secret)) { send(res,401,{error:'Browser pairing expired; reconnect'}); return true; }
        if (url.pathname === '/api/mcp/browser/disconnect') {
          if (session.pending) { clearTimeout(session.pending.timer); session.pending.resolve({error:'Browser disconnected'}); }
          sessions.delete(session.id); send(res,200,{disconnected:true}); return true;
        }
        if (url.pathname !== '/api/mcp/browser/sync') { send(res,404,{error:'Unknown route'}); return true; }
        if (data.snapshot) {
          if (typeof data.snapshot.revision !== 'string' || !data.snapshot.resumes || typeof data.snapshot.resumes !== 'object') throw new Error('Invalid snapshot');
          checkJson(data.snapshot); session.snapshot = data.snapshot;
        } else if (!session.snapshot) throw new Error('Initial snapshot required');
        session.lastSeen = Date.now();
        if (data.ack && session.pending?.id === data.ack.id) {
          const pending = session.pending; clearTimeout(pending.timer); session.pending = null;
          session.audit.push({id:pending.id, action:pending.action, resume_id:pending.args.resume_id, at:new Date().toISOString(), success:!data.ack.error}); session.audit = session.audit.slice(-100);
          pending.resolve({ ...data.ack, ...snapshot(session) });
        }
        const pending = session.pending;
        const command = pending && !pending.delivered ? {id:pending.id, action:pending.action, args:pending.args, expected_revision:pending.expected_revision} : null;
        if (command) pending.delivered = true;
        send(res,200,{command}); return true;
      }
      if (!sameSecret(req.headers.authorization, `Bearer ${token}`)) { send(res,401,{error:'Invalid MCP client token'}); return true; }
      if (url.pathname === '/api/mcp/sessions') { send(res,200,{sessions:[...sessions.values()].map(s=>({session_id:s.id,label:s.label,online:online(s),revision:s.snapshot?.revision,active_resume_id:s.snapshot?.active_resume_id}))}); return true; }
      const candidates = [...sessions.values()].filter(s=>online(s) && s.snapshot);
      const session = data.session_id ? sessions.get(data.session_id) : candidates.length === 1 ? candidates[0] : null;
      if (!session || !online(session) || !session.snapshot) { send(res,409,{error:candidates.length > 1 ? 'Multiple browsers connected; provide session_id' : 'Browser offline. Open the local app and enable MCP.'}); return true; }
      if (url.pathname === '/api/mcp/read') { send(res,200,snapshot(session)); return true; }
      if (url.pathname === '/api/mcp/audit') { send(res,200,{session_id:session.id,audit:session.audit}); return true; }
      if (url.pathname !== '/api/mcp/command') { send(res,404,{error:'Unknown route'}); return true; }
      if (![...actions,'undo'].includes(data.action)) throw new Error('Unknown action');
      checkJson(data.args || {});
      if (data.expected_revision !== session.snapshot.revision) { send(res,409,{error:'Revision conflict. Read current resume and retry with its revision.',revision:session.snapshot.revision}); return true; }
      if (session.pending) { send(res,409,{error:'Another edit is pending'}); return true; }
      const result = await new Promise(resolveResult => {
        const pending = {id:randomUUID(),action:data.action,args:data.args || {},expected_revision:data.expected_revision,resolve:resolveResult,delivered:false,timer:null};
        pending.timer = setTimeout(()=>{if(session.pending === pending) session.pending=null; resolveResult({error:pending.delivered ? 'Browser acknowledgement timed out; result is uncertain. Read current data before retrying.' : 'Browser did not receive command; no change applied.'});},timeoutMs);
        session.pending = pending;
      });
      send(res,result.error ? 409 : 200,result); return true;
    } catch (error) { send(res,400,{error:error.message}); return true; }
  };
}
