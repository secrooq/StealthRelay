import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

export function getEnv(key: string): string | undefined {
  try {
    const ctx = getOptionalRequestContext();
    const env = ctx?.env as any;
    if (env && env[key] !== undefined) {
      return String(env[key]);
    }
  } catch {
    // Pages context not bound or throwing in non-edge runtime
  }

  const globalEnv = (globalThis as any).__cloudflare_env;
  if (globalEnv && globalEnv[key] !== undefined) {
    return String(globalEnv[key]);
  }

  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }

  return undefined;
}

// Dynamically retrieve Node.js native require and cwd via global index properties to bypass Next.js Edge static analysis
const getNativeRequire = () => {
  if (typeof window === "undefined" && typeof globalThis !== "undefined") {
    try {
      const g = globalThis as any;
      return g["require"];
    } catch {
      return null;
    }
  }
  return null;
};

const getCwd = () => {
  try {
    const g = globalThis as any;
    const proc = g["process"];
    return proc ? proc["cwd"]() : "";
  } catch {
    return "";
  }
};

export function getDb() {
  try {
    const ctx = getOptionalRequestContext();
    if (ctx?.env?.DB) {
      return ctx.env.DB;
    }
  } catch {
    // Pages context not bound or throwing in non-edge runtime
  }

  const globalEnv = (globalThis as any).__cloudflare_env;
  if (globalEnv?.DB) {
    return globalEnv.DB;
  }

  // Fallback to local D1 SQLite file directly in Node dev!
  if (process.env.NODE_ENV === "development") {
    try {
      const req = getNativeRequire();
      if (req) {
        const fs = req("fs");
        const path = req("path");
        const { DatabaseSync } = req("node:sqlite");

        const cwd = getCwd();
        const d1Dir = path.join(cwd, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
        if (fs.existsSync(d1Dir)) {
          const files = fs.readdirSync(d1Dir);
          const sqliteFile = files.find((f: string) => f.endsWith(".sqlite"));
          if (sqliteFile) {
            const dbPath = path.join(d1Dir, sqliteFile);
            const sqlDb = new DatabaseSync(dbPath);
            return {
              prepare(query: string) {
                const stmt = sqlDb.prepare(query);
                let boundParams: any[] = [];
                return {
                  bind(...params: any[]) {
                    boundParams = params.map(p => {
                      if (p === undefined) return null;
                      return p;
                    });
                    return this;
                  },
                  async first() {
                    const result = stmt.get(...boundParams);
                    return result || null;
                  },
                  async all() {
                    const results = stmt.all(...boundParams);
                    return { results };
                  },
                  async run() {
                    stmt.run(...boundParams);
                    return { success: true };
                  }
                };
              }
            } as any;
          }
        }
      }
    } catch (err) {
      console.error("[LOCAL_DB_FALLBACK_ERROR]", err);
    }
  }

  throw new Error("Security database offline. Please retry in clean runtime.");
}

export function getRequestContext() {
  try {
    const ctx = getOptionalRequestContext();
    if (ctx?.env?.DB) {
      return ctx;
    }
  } catch {
    // Fallback to mock dev context
  }

  // Return mock context for local development!
  return {
    env: {
      DB: getDb(),
      STEALTH_STORAGE: {
        // Mock R2 Storage in local development using direct Node.js filesystem
        async put(key: string, value: any) {
          try {
            const req = getNativeRequire();
            if (req) {
              const fs = req("fs");
              const path = req("path");
              const cwd = getCwd();
              const r2Dir = path.join(cwd, ".wrangler", "state", "v3", "r2", "stealth-vault-storage");
              if (!fs.existsSync(r2Dir)) {
                fs.mkdirSync(r2Dir, { recursive: true });
              }
              const filePath = path.join(r2Dir, encodeURIComponent(key));
              if (value instanceof ArrayBuffer) {
                fs.writeFileSync(filePath, Buffer.from(value));
              } else if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
                fs.writeFileSync(filePath, Buffer.from(value));
              } else if (typeof value === "string") {
                fs.writeFileSync(filePath, value);
              } else if (value?.arrayBuffer) {
                const buf = await value.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(buf));
              } else {
                fs.writeFileSync(filePath, value);
              }
            }
          } catch (err) {
            console.error("[MOCK_R2_PUT_ERROR]", err);
          }
          return {};
        },
        async get(key: string) {
          try {
            const req = getNativeRequire();
            if (req) {
              const fs = req("fs");
              const path = req("path");
              const cwd = getCwd();
              const r2Dir = path.join(cwd, ".wrangler", "state", "v3", "r2", "stealth-vault-storage");
              const filePath = path.join(r2Dir, encodeURIComponent(key));
              if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath);
                return {
                  arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
                  text: async () => data.toString("utf8"),
                  body: {
                    getReader() {
                      let done = false;
                      return {
                        async read() {
                          if (done) return { done: true, value: undefined };
                          done = true;
                          return { done: false, value: new Uint8Array(data) };
                        },
                        cancel() {}
                      };
                    },
                    pipeTo(writableStream: any) {
                      return Promise.resolve();
                    }
                  }
                };
              }
            }
          } catch (err) {
            console.error("[MOCK_R2_GET_ERROR]", err);
          }
          return null;
        },
        async delete(key: string) {
          try {
            const req = getNativeRequire();
            if (req) {
              const fs = req("fs");
              const path = req("path");
              const cwd = getCwd();
              const r2Dir = path.join(cwd, ".wrangler", "state", "v3", "r2", "stealth-vault-storage");
              const filePath = path.join(r2Dir, encodeURIComponent(key));
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          } catch (err) {
            console.error("[MOCK_R2_DELETE_ERROR]", err);
          }
          return {};
        }
      } as any
    },
    ctx: {
      waitUntil(promise: Promise<any>) {
        promise.catch(err => console.error("[MOCK_WAIT_UNTIL_ERROR]", err));
      }
    }
  } as any;
}
