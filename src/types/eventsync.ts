export type EventSyncAdditionalData = Record<string, unknown>;

export interface EventSyncSendPayload {
  eventName: string;
  eventType?: "interaction" | "nonInteraction";
  additionalData?: EventSyncAdditionalData;
  eventId?: string;
}

export interface EventSyncAPI {
  sendEvent?: (payload: EventSyncSendPayload) => void;
  setConsent?: (state: { hasConsent: boolean; advertising?: boolean; analytics?: boolean }) => void;
  isConsented?: () => boolean;
  isInitialized?: boolean;
}

declare global {
  interface Window {
    EventSync?: EventSyncAPI;
  }
}

export {};

