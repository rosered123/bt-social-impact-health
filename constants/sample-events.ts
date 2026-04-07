// Shared sample/placeholder event data so different screens stay in sync.
// Replace with real data from the API when wiring up the backend.

export interface SampleEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  rsvps: number;
  views: number;
  isLive?: boolean;
}

export const LIVE_EVENT: SampleEvent = {
  id: '1',
  name: 'Pop-up name',
  date: 'mm - dd - yyyy',
  time: '1 PM–4 PM',
  location: 'Location',
  rsvps: 0,
  views: 0,
  isLive: true,
};

export const LIVE_EVENTS: SampleEvent[] = [LIVE_EVENT];
