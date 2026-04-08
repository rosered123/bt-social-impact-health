// Tiny module-level pub/sub so screens can signal "data changed, please refetch"
// without relying on navigation focus events, which are unreliable for hidden
// tab screens in expo-router.

type Listener = () => void;

const listeners = new Set<Listener>();

export function onEventsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyEventsChanged(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // ignore listener errors
    }
  });
}
