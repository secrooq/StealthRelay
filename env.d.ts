declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
  interface CloudflareEnv {
    DB: D1Database;
    STEALTH_STORAGE: R2Bucket;
    AI: any;
  }
}

export {};
