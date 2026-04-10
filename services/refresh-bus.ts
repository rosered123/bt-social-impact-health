// Tiny module-level pub/sub so screens can signal "data changed, please refetch"
// without relying on navigation focus events, which are unreliable for hidden
// tab screens in expo-router.

type Listener = () => void;

const eventsListeners = new Set<Listener>();
const profileListeners = new Set<Listener>();

function fire(set: Set<Listener>) {
  set.forEach((l) => {
    try {
      l();
    } catch {
      // ignore listener errors
    }
  });
}

export function onEventsChanged(listener: Listener): () => void {
  eventsListeners.add(listener);
  return () => {
    eventsListeners.delete(listener);
  };
}

export function notifyEventsChanged(): void {
  fire(eventsListeners);
}

export function onProfileChanged(listener: Listener): () => void {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

export function notifyProfileChanged(): void {
  fire(profileListeners);
}
