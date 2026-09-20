import {LiveCollaborationClient} from '../packages/collaboration/live.js';
import {BrowserCollaborationClient} from './browser-storage.js';
export const browserLocal = document.querySelector('meta[name="relayforge-storage"]')?.content === 'browser';
const namespace = 'relayforge-pages:' + new URL('../', import.meta.url).pathname;
export const preferences = {
  getItem(key) { try { return localStorage.getItem(browserLocal ? namespace + ':' + key : key); } catch { return null; } },
  setItem(key, value) { localStorage.setItem(browserLocal ? namespace + ':' + key : key, value); },
  removeItem(key) { localStorage.removeItem(browserLocal ? namespace + ':' + key : key); }
};
export function createCollaborationClient(options) {
  return browserLocal ? new BrowserCollaborationClient({...options, namespace}) : new LiveCollaborationClient(options);
}
