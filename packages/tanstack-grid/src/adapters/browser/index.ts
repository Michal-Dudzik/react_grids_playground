import {
  buildCsvContent,
  buildPrintableMarkup,
} from '../../core/tableUtils';

export interface GridStateAdapter<TState = unknown> {
  read: () => TState | undefined;
  write: (state: TState) => void;
  clear?: () => void;
}

export interface LocalStorageGridStateAdapterOptions<TState = unknown> {
  key: string;
  fallback?: TState;
  normalize?: (state: unknown) => TState;
  storage?: Storage;
}

export function createLocalStorageGridStateAdapter<TState = unknown>({
  fallback,
  key,
  normalize,
  storage,
}: LocalStorageGridStateAdapterOptions<TState>): GridStateAdapter<TState> {
  const getStorage = () => {
    if (storage) return storage;
    return typeof window === 'undefined' ? undefined : window.localStorage;
  };

  return {
    read() {
      const currentStorage = getStorage();
      if (!currentStorage) return fallback;

      try {
        const rawValue = currentStorage.getItem(key);
        if (rawValue === null) return fallback;
        const parsedValue = JSON.parse(rawValue);
        return normalize ? normalize(parsedValue) : parsedValue;
      } catch {
        return fallback;
      }
    },
    write(state) {
      const currentStorage = getStorage();
      if (!currentStorage) return;
      currentStorage.setItem(key, JSON.stringify(state));
    },
    clear() {
      getStorage()?.removeItem(key);
    },
  };
}

export interface HttpColumnPreferencesAdapterOptions {
  endpoint: string | ((context: Record<string, unknown>) => string);
  request?: typeof fetch;
  headers?: HeadersInit | ((context: Record<string, unknown>) => HeadersInit);
  method?: string;
}

export function createHttpColumnPreferencesAdapter({
  endpoint,
  headers,
  method = 'PUT',
  request = fetch,
}: HttpColumnPreferencesAdapterOptions) {
  const resolveEndpoint = (context: Record<string, unknown>) =>
    typeof endpoint === 'function' ? endpoint(context) : endpoint;
  const resolveHeaders = (context: Record<string, unknown>) =>
    typeof headers === 'function' ? headers(context) : headers;

  return {
    async load(context: Record<string, unknown> = {}) {
      const response = await request(resolveEndpoint(context), {
        headers: {
          Accept: 'application/json',
          ...(resolveHeaders(context) ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load column preferences (${response.status})`);
      }

      return response.json();
    },
    async save({ payload, ...context }: { payload: unknown } & Record<string, unknown>) {
      const response = await request(resolveEndpoint(context), {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(resolveHeaders(context) ?? {}),
        },
        method,
      });

      if (!response.ok) {
        throw new Error(`Failed to save column preferences (${response.status})`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      return contentType.includes('application/json') ? response.json() : { success: true };
    },
  };
}

export function copyText(value: unknown) {
  const text = String(value ?? '');

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    return;
  }

  console.warn(
    '[tanstack-grid] navigator.clipboard is unavailable; using legacy copy fallback (document.execCommand).',
  );

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

export function downloadCsvFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function openPrintWindow({ columns, rows, title }: { columns: unknown[]; rows: unknown[]; title: string }) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.border = '0';

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 0);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.onafterprint = cleanup;
    frameWindow.focus();
    window.setTimeout(() => {
      frameWindow.print();
    }, 50);
  };

  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;

  if (!frameDocument) {
    cleanup();
    return;
  }

  frameDocument.open();
  frameDocument.write(buildPrintableMarkup({ columns, rows, title }));
  frameDocument.close();
}

export function downloadRowsAsCsv({ columns, fileName, rows }: { columns: unknown[]; fileName: string; rows: unknown[] }) {
  downloadCsvFile(fileName, buildCsvContent(columns, rows));
}
