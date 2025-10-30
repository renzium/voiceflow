type EventName =
  | 'recording_started'
  | 'recording_stopped'
  | 'api_result'
  | 'playback_started'
  | 'playback_finished'
  | 'error';

type Event = { name: EventName; ts: number; data?: Record<string, any> };

class Analytics {
  private events: Event[] = [];
  log(name: EventName, data?: Record<string, any>) {
    const evt = { name, ts: Date.now(), data } as Event;
    this.events.push(evt);
    // eslint-disable-next-line no-console
    console.log('[analytics]', evt);
  }
  getEvents() {
    return [...this.events];
  }
  clear() {
    this.events = [];
  }
}

export const analytics = new Analytics();


