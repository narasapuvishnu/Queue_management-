const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

const DEFAULT_STATE = {
  managers: [],
  queues: [],
  tokens: [],
  activity_logs: []
};

class JsonDb {
  constructor() {
    this.data = { ...DEFAULT_STATE };
    this.isLoaded = false;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.save();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing JSON database:', err);
      this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.save();
      this.isLoaded = true;
    }
  }

  save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  findAll(collection, filterFn = null) {
    const list = this.data[collection] || [];
    if (!filterFn) return [...list];
    return list.filter(filterFn);
  }

  findById(collection, id) {
    const list = this.data[collection] || [];
    return list.find(item => item.id === id) || null;
  }

  findOne(collection, filterFn) {
    const list = this.data[collection] || [];
    return list.find(filterFn) || null;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const record = {
      ...item,
      id: item.id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: item.createdAt || new Date().toISOString()
    };
    this.data[collection].push(record);
    this.save();
    return record;
  }

  update(collection, id, updates) {
    const list = this.data[collection] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedRecord = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[index] = updatedRecord;
    this.save();
    return updatedRecord;
  }

  delete(collection, id) {
    const list = this.data[collection] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;

    list.splice(index, 1);
    this.save();
    return true;
  }

  deleteWhere(collection, filterFn) {
    const list = this.data[collection] || [];
    const remaining = list.filter(item => !filterFn(item));
    const deletedCount = list.length - remaining.length;
    this.data[collection] = remaining;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  logActivity(queueId, action, details = {}) {
    return this.insert('activity_logs', {
      queueId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }
}

const db = new JsonDb();
module.exports = db;
