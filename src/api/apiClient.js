class ApiClient {
  constructor() {
    this.cache = new Map();
  }

  async request(method, endpoint, body, options = {}) {
    const cacheKey = `${method}:${endpoint}`;

    if (method === 'GET' && options.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.createdAt < (options.cacheTTL ?? 0)) {
        return cached.value;
      }
    }

    const response = await fetch(endpoint, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      method,
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const value = contentType.includes('application/json') ? await response.json() : await response.text();

    if (method === 'GET' && options.cache) {
      this.cache.set(cacheKey, {
        createdAt: Date.now(),
        value,
      });
    }

    return value;
  }

  get(endpoint, options) {
    return this.request('GET', endpoint, undefined, options);
  }

  put(endpoint, body, options) {
    return this.request('PUT', endpoint, body, options);
  }

  delete(endpoint, options) {
    return this.request('DELETE', endpoint, undefined, options);
  }

  clearCache(partialKey) {
    for (const key of this.cache.keys()) {
      if (key.includes(partialKey)) {
        this.cache.delete(key);
      }
    }
  }
}

export default new ApiClient();
