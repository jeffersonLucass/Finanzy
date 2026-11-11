import { useCallback, useRef, useState } from 'react';

export function useAsyncAction<Arguments extends unknown[], Result>(action: (...arguments_: Arguments) => Promise<Result>, onSuccess?: (result: Result) => void | Promise<void>) {
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const execute = useCallback(async (...arguments_: Arguments) => {
    if (pending.current) throw new Error('Operação em andamento.');
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await action(...arguments_);
      await onSuccess?.(result);
      return result;
    } catch (failure) {
      const normalized = failure instanceof Error ? failure : new Error('Não foi possível concluir a operação.');
      setError(normalized);
      throw normalized;
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, [action, onSuccess]);
  return { execute, loading, error, clearError: () => setError(null) };
}
