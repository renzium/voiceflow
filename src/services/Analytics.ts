type EventName =
  | "listen_started"
  | "listen_finished"
  | "listen_cancelled"
  | "assistant_reply"
  | "speech_started"
  | "speech_finished"
  | "error";

type Event = { name: EventName; ts: number; data?: Record<string, unknown> };

/** In-memory event log. Swap `log` for a real sink (Amplitude, PostHog…) in production. */
class Analytics {
  private events: Event[] = [];

  log(name: EventName, data?: Record<string, unknown>) {
    const evt: Event = { name, ts: Date.now(), data };
    this.events.push(evt);
    if (__DEV__) console.log("[analytics]", evt);
  }

  getEvents() {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

export const analytics = new Analytics();
