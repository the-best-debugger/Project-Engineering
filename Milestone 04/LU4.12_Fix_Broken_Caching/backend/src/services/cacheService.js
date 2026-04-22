class CacheService {
  constructor(defaultTTLSeconds = 60) {
    this.defaultTTLSeconds = defaultTTLSeconds;
    this.cache = new Map();
  }

  createTaskKey(id) {
    return `task:${id}`;
  }

  createTaskListKey() {
    return "tasks:list";
  }

  set(key, value, ttlSeconds = this.defaultTTLSeconds) {
    if (value === null || value === undefined) {
      return;
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  invalidateTask(taskId) {
    this.delete(this.createTaskKey(taskId));
    this.delete(this.createTaskListKey());
  }
}

module.exports = new CacheService();
