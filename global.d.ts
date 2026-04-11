interface Window {
  electronStore?: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, val: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  electronMedia?: {
    download: (id: string, url: string) => Promise<string | null>;
  };
}
