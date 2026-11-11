import { AppError } from '../../domain/core';
export type Fetcher = typeof fetch;
export class HttpClient {
  constructor(private readonly fetcher: Fetcher = fetch, private readonly timeoutMs = 10_000) {}
  async getJson(url: string, signal?: AbortSignal): Promise<unknown> {
    if (!url.startsWith('https://')) throw new AppError('VALIDATION_ERROR', 'A conexão deve usar HTTPS.');
    const controller = new AbortController(); let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    try {
      const response = await this.fetcher(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new AppError('NETWORK_ERROR', `Serviço indisponível (HTTP ${response.status}).`);
      const result: unknown = await response.json();
      if (controller.signal.aborted) throw new Error('Aborted');
      return result;
    } catch (error) {
      if (timedOut) throw new AppError('TIMEOUT', 'O serviço demorou para responder.');
      if (signal?.aborted) throw new AppError('NETWORK_ERROR', 'Requisição cancelada.');
      if (error instanceof AppError) throw error;
      throw new AppError('NETWORK_ERROR', 'Não foi possível consultar o serviço.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
}
