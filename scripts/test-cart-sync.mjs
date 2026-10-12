// Browser-free behavior tests for the website cart sync queue and its remote reconciliation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const uid = '00000000-0000-4000-8000-0000000000a1';
const storage = new Map([['ve_cart_user_id', uid]]);
const server = new Map();
const handlers = [];
let failNextWrite = true;
const localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
const query = (operation, payload) => {
  const filters = {};
  const q = {
    eq: (key, value) => (filters[key] = value, q),
    is: (key, value) => (filters[key] = value, q),
    in: (key, values) => (filters[key] = values, q),
    then(resolve, reject) {
      try {
        if (operation === 'select') return Promise.resolve({ data: [...server.values()].filter(row => row.user_id === filters.user_id && row.deleted_at == null), error: null }).then(resolve, reject);
        if (failNextWrite) { failNextWrite = false; return Promise.resolve({ error: new Error('simulated offline write') }).then(resolve, reject); }
        if (operation === 'upsert') for (const row of payload) server.set(`${row.user_id}:${row.product_id}`, { ...server.get(`${row.user_id}:${row.product_id}`), ...row });
        if (operation === 'update') for (const [key, row] of server) if (row.user_id === filters.user_id && filters.product_id.includes(row.product_id) && row.deleted_at == null) server.set(key, { ...row, ...payload });
        return Promise.resolve({ error: null }).then(resolve, reject);
      } catch (error) { return Promise.reject(error).then(resolve, reject); }
    },
  };
  return q;
};
const SB = {
  from: () => ({ select: () => query('select'), upsert: rows => query('upsert', rows), update: values => query('update', values) }),
  rpc: async () => ({ error: null }),
  channel: () => {
    const channel = { on(_type, filter, callback) { handlers.push({ type: filter, callback }); return channel; }, subscribe(callback) { callback('SUBSCRIBED'); return channel; } };
    return channel;
  },
  removeChannel: async () => {},
};
const window = { SB, Store: { cart: {}, save() { localStorage.setItem('ve_cart', JSON.stringify(this.cart)); window.CartSync.localChanged({}, { ...this.cart }); } } };
const context = { window, localStorage, navigator: {}, document: { getElementById: () => null }, setTimeout, clearTimeout, console };
runInNewContext(readFileSync(new URL('../js/cart-sync.js', import.meta.url), 'utf8'), context);
await window.CartSync.setUser(uid);
assert.equal(window.CartSync.ready, true, 'initial shared-cart load completes');

window.Store.cart = { '101': 1 };
window.Store.save();
await window.CartSync.writeQueue;
assert.equal(JSON.parse(localStorage.getItem('ve_cart_pending_writes'))[uid]['101'], 1, 'failed writes stay in the per-user journal');
assert.equal(window.Store.cart['101'], 1, 'failed writes do not discard the visible local edit');

await window.CartSync.setUser(uid, true);
await window.CartSync.writeQueue;
assert.equal(server.get(`${uid}:101`)?.quantity, 1, 'retry writes the retained target quantity');
assert.equal(localStorage.getItem('ve_cart_pending_writes'), '{}', 'journal entry clears only after server confirmation');

const emit = event => handlers.filter(handler => handler.type.event === event).forEach(handler => handler.callback({ eventType: event }));
const waitFor = async (predicate, description) => {
  const deadline = Date.now() + 3000;
  while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(predicate(), `timed out: ${description}; sync state: ${window.CartSync.message}`);
};
server.set(`${uid}:102`, { user_id: uid, product_id: 102, quantity: 2, deleted_at: null });
emit('INSERT');
await waitFor(() => window.Store.cart['102'] === 2, 'Realtime addition is reflected in the local cart');
server.set(`${uid}:102`, { ...server.get(`${uid}:102`), quantity: 3 });
emit('UPDATE');
await waitFor(() => window.Store.cart['102'] === 3, 'Realtime quantity update is reflected');
server.set(`${uid}:102`, { ...server.get(`${uid}:102`), deleted_at: new Date().toISOString() });
emit('UPDATE');
await waitFor(() => window.Store.cart['102'] === undefined, 'Realtime soft removal is reflected');
assert.ok(handlers.some(handler => handler.type.event === 'INSERT') && handlers.some(handler => handler.type.event === 'UPDATE'), 'client subscribes to additions and updates');
assert.ok(!handlers.some(handler => handler.type.event === 'DELETE' || handler.type.event === '*'), 'client does not subscribe to DELETE events');
console.log('PASS website sync behavior: failed-write retry, pending journal, and Realtime add/update/removal.');
