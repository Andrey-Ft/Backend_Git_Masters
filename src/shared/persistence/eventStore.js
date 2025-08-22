import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve('.data/github_events.json');

class FileEventStore {
  constructor() {
    this.file = DB_PATH;
    this.cache = null; // lazy load
  }

  async _load() {
    if (!this.cache) {
      this.cache = await readJson(this.file, { events: [], byDelivery: {} });
    }
    return this.cache;
  }

  async _save() {
    await writeJson(this.file, this.cache);
  }

  async save(event) {
    const db = await this._load();
    if (event.delivery_id && db.byDelivery[event.delivery_id]) {
      return db.byDelivery[event.delivery_id]; // idempotencia
    }
    const id = event.id || crypto.randomUUID();
    const record = { ...event, id };
    db.events.push(record);
    if (record.delivery_id) db.byDelivery[record.delivery_id] = record;
    await this._save();
    return record;
  }

  async findById(id) {
    const db = await this._load();
    return db.events.find(e => e.id === id) || null;
  }

  async findByDeliveryId(deliveryId) {
    const db = await this._load();
    return db.byDelivery[deliveryId] || null;
  }

  async search(filters = {}, pagination = {}) {
    const db = await this._load();
    let list = db.events;

    if (filters.user) {
      const v = String(filters.user).toLowerCase();
      list = list.filter(e => (e.sender_login || '').toLowerCase().includes(v));
    }
    if (filters.repo) {
      const v = String(filters.repo).toLowerCase();
      list = list.filter(e => (e.repo_full_name || '').toLowerCase() === v);
    }
    // ... (resto de los filtros)

    const sort = pagination.sort || 'received_at:desc';
    const [field, dir] = sort.split(':');
    list = list.slice().sort((a, b) => {
      const av = a[field] || '';
      const bv = b[field] || '';
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const page = Math.max(parseInt(pagination.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(pagination.limit || '20', 10), 1), 100);
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { total, page, limit, items };
  }
}

export default new FileEventStore();