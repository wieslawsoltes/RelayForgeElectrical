/** Browser-only persistence for the static demo. No network calls or shared accounts. */
import {clone, uid, validateProject} from '../packages/core/index.js';
import {applyChanges, documentIdentities, pathLabel} from '../packages/collaboration/operations.js';
import {LiveCollaborationClient} from '../packages/collaboration/live.js';

const user = Object.freeze({id: 'browser-local', name: 'Local engineer', email: 'Browser-local workspace'});
const fail = (message, status = 400, data = {}) => Object.assign(new Error(message), {
  status, data: {error: message, ...data}
});
const snapshot = record => ({project: clone(record.project), revision: record.revision, role: 'owner', presence: []});

export function makeLocalRecord(project, now = Date.now()) {
  validateProject(project);
  return {
    id: project.id, project: clone(project), revision: 1, updated_at: now,
    history: [{revision: 1, project: clone(project), created_at: now, author: user.name}],
    receipts: [], tombstones: [], comments: []
  };
}

/** Pure operation commit, also used by the regression suite. Does not mutate its input. */
export function commitLocalOperation(record, packet, now = Date.now()) {
  if (!packet || typeof packet.operationId !== 'string' || !packet.operationId.length ||
      packet.operationId.length > 100 || !Number.isInteger(packet.baseRevision) ||
      packet.baseRevision < 1 || !Array.isArray(packet.changes)) throw fail('Invalid operation packet');
  const payload = JSON.stringify({baseRevision: packet.baseRevision, changes: packet.changes});
  if (new TextEncoder().encode(payload).length > 1_500_000) throw fail('Operation packet exceeds 1.5 MB', 413);
  const receipt = record.receipts.find(r => r.id === packet.operationId);
  if (receipt) {
    if (receipt.payload !== payload) throw fail('Operation ID reused with different content', 409);
    return {record, result: {...snapshot(record), duplicate: true, acknowledgedRevision: receipt.revision}};
  }
  if (packet.baseRevision > record.revision) throw fail('Future base revision', 409, snapshot(record));
  const merged = applyChanges(record.project, packet.changes);
  if (merged.conflicts.length) throw fail('Concurrent fields require review', 409, {
    ...snapshot(record), conflicts: merged.conflicts.map(pathLabel)
  });
  const before = documentIdentities(record.project), after = documentIdentities(merged.project);
  const dead = new Set(record.tombstones);
  if ([...after].some(id => !before.has(id) && dead.has(id))) throw fail('Deleted identities cannot be reused', 409, {
    ...snapshot(record), conflicts: ['deleted object']
  });
  validateProject(merged.project);
  if (merged.project.id !== record.id) throw fail('Project ID cannot change');
  if (new TextEncoder().encode(JSON.stringify(merged.project)).length > 1_800_000) throw fail('Project exceeds 1.8 MB', 413);
  const next = clone(record);
  next.project = merged.project;
  next.revision++;
  next.updated_at = now;
  next.receipts.push({id: packet.operationId, payload, revision: next.revision});
  next.tombstones = [...new Set([...record.tombstones, ...[...before].filter(id => !after.has(id))])];
  next.history.push({revision: next.revision, project: clone(next.project), created_at: now, author: user.name});
  next.history = next.history.slice(-100);
  return {record: next, result: snapshot(next)};
}

export class BrowserCollaborationClient extends LiveCollaborationClient {
  constructor({namespace = 'relayforge-browser', ...options} = {}) {
    super(options);
    this.namespace = namespace;
    this.isBrowserLocal = true;
    this.dbPromise = null;
  }
  key(id = this.id) { return this.namespace + ':outbox:' + id; }
  database() {
    if (!this.dbPromise) this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(fail('Browser storage is unavailable'));
      const request = indexedDB.open(this.namespace, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('projects', {keyPath: 'id'});
      request.onerror = () => { this.dbPromise = null; reject(request.error); };
      request.onblocked = () => { this.dbPromise = null; reject(fail('Close older RelayForge tabs to upgrade browser storage')); };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); this.dbPromise = null; };
        resolve(db);
      };
    });
    return this.dbPromise;
  }
  async transaction(id, write, transform) {
    const db = await this.database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', write ? 'readwrite' : 'readonly');
      const store = tx.objectStore('projects');
      const request = id === null ? store.getAll() : store.get(id);
      let result, error;
      request.onsuccess = () => {
        try { result = transform(request.result, store); }
        catch (e) { error = e; tx.abort(); }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(error || tx.error || fail('Browser storage transaction failed'));
    });
  }
  async request(path, options = {}) {
    const url = new URL(path, 'https://browser-local.invalid');
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    if (parts[0] === 'me' && method === 'GET') return {...user};
    if (parts[0] === 'join' || parts[2] === 'invite') throw fail('Invitations require the server-backed app. GitHub Pages stores data only in this browser.', 501);
    if (parts[0] !== 'projects') throw fail('Unknown browser-local operation', 404);
    if (parts.length === 1) {
      if (method === 'GET') return this.transaction(null, false, rows => rows
        .sort((a, b) => b.updated_at - a.updated_at)
        .map(r => ({id: r.id, name: r.project.name, revision: r.revision, updated_at: r.updated_at, role: 'owner'})));
      if (method === 'POST') {
        const record = makeLocalRecord(body.project);
        if (new TextEncoder().encode(JSON.stringify(body.project)).length > 1_800_000) throw fail('Project exceeds 1.8 MB', 413);
        return this.transaction(record.id, true, (existing, store) => {
          if (existing) throw fail('A project with this ID already exists', 409);
          store.add(record);
          return {id: record.id, revision: record.revision};
        });
      }
    }
    const id = parts[1];
    if (!id) throw fail('Project ID is required');
    const result = await this.transaction(id, method !== 'GET', (record, store) => {
      if (!record) throw fail('Project not found in this browser', 404);
      if (parts.length === 2 && method === 'GET') return Number(url.searchParams.get('since')) === record.revision
        ? {unchanged: true, revision: record.revision, presence: []} : snapshot(record);
      if (parts[2] === 'operations' && method === 'POST') {
        const committed = commitLocalOperation(record, body);
        if (!committed.result.duplicate) store.put(committed.record);
        return committed.result;
      }
      if (parts[2] === 'history' && method === 'GET') {
        if (parts[3]) {
          const revision = record.history.find(r => r.revision === Number(parts[3]));
          if (!revision) throw fail('Revision is outside the latest 100 local revisions', 404);
          return clone(revision);
        }
        return record.history.map(({project, ...r}) => r).reverse();
      }
      if (parts[2] === 'members' && method === 'GET') return [{user_id: user.id, name: user.name, role: 'owner'}];
      if (parts[2] === 'comments') {
        if (method === 'GET') return clone(record.comments);
        if (method === 'POST') {
          if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 5000) throw fail('Comment must contain 1–5000 characters');
          const comment = {id: uid(), text: body.text.trim(), page_id: String(body.pageId || ''), entity_id: String(body.entityId || ''), author: user.name, created_at: Date.now(), resolved: false};
          record.comments.push(comment); store.put(record); return clone(comment);
        }
        if (method === 'PATCH') {
          const comment = record.comments.find(c => c.id === body.id);
          if (!comment) throw fail('Comment not found', 404);
          if (typeof body.resolved !== 'boolean') throw fail('Invalid comment state');
          comment.resolved = body.resolved; store.put(record); return clone(comment);
        }
      }
      throw fail('This operation requires the server-backed app', 501);
    });
    if (method !== 'GET') this.channel?.postMessage({id, revision: result.revision});
    return result;
  }
  connect() {
    this.channel?.close();
    this.transport = 'This browser';
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.namespace);
      this.channel.onmessage = e => {
        if (e.data?.id === this.id && e.data.revision > this.revision) {
          this.refreshAfter = true;
          this.poll().catch(error => this.status('error', error.message));
        }
      };
    }
    this.status(this.pending ? 'unsaved' : 'saved');
  }
  stop() { super.stop(); this.channel?.close(); }
  dispose() { this.stop(); this.dbPromise?.then(db => db.close()).catch(() => {}); }
}
