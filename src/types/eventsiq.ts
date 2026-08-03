export type EventsIQAdditionalData = Record<string, unknown>;

export interface EventsIQSendPayload {
  eventName: string;
  eventType?: "interaction" | "nonInteraction";
  /**
   * Restrict this event to specific pixel providers
   * ("facebook" | "google" | "tiktok" | "snapchat" | "applovin").
   * Omit to fire to every configured provider.
   */
  providers?: string[];
  additionalData?: EventsIQAdditionalData;
  eventId?: string;
}

export interface EventsIQAPI {
  sendEvent?: (payload: EventsIQSendPayload) => void;
  setConsent?: (state: { hasConsent: boolean; advertising?: boolean; analytics?: boolean }) => void;
  isConsented?: () => boolean;
  isInitialized?: boolean;
}

declare global {
  interface Window {
    EventsIQ?: EventsIQAPI;
  }
}

export {};

