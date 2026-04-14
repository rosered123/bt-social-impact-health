/**
 * Simple in-session saved-events store.
 * Shares state across view_event and profile without external packages.
 */

export type SavedEvent = {
  id: number;
  event_name: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  business_name: string;
};

type Listener = () => void;

const savedMap = new Map<number, SavedEvent>();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export function saveEvent(event: SavedEvent) {
  savedMap.set(event.id, event);
  notify();
}

export function unsaveEvent(id: number) {
  savedMap.delete(id);
  notify();
}

export function isEventSaved(id: number): boolean {
  return savedMap.has(id);
}

export function getSavedEvents(): SavedEvent[] {
  return Array.from(savedMap.values());
}

export function onSavedEventsChanged(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
