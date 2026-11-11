import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getRuntime } from '../application/runtime';

export function useRuntimeLifecycle(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let cleanupDestination = () => {};
    let cleanupStore = () => {};
    let cleanupSettings = () => {};
    let cleanupState = () => {};
    void getRuntime().then(runtime => {
      if (disposed) return;
      const reconcile = () => { void runtime.notifications.reconcile().catch(() => undefined); };
      cleanupDestination = runtime.notifications.adapter.listen(destination => {
        if (destination.screen === 'budgets') router.push('/budgets');
        if (destination.screen === 'occurrence') router.push(`/occurrences/${destination.id}`);
      });
      cleanupStore = runtime.store.subscribe(reconcile);
      cleanupSettings = runtime.settings.subscribe(reconcile);
      const subscription = AppState.addEventListener('change', state => {
        if (state === 'active') reconcile();
      });
      cleanupState = () => subscription.remove();
      reconcile();
    }).catch(() => undefined);
    return () => {
      disposed = true;
      cleanupDestination();
      cleanupStore();
      cleanupSettings();
      cleanupState();
    };
  }, [enabled]);
}
