// This component must run in the browser because it listens for SDK events.
"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_PROMPT =
  "We store hashed identity data locally so conversions line up. Accept to enable auto-tracking once consent is required.";

const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [description, setDescription] = useState(DEFAULT_PROMPT);
  const [consentRequired, setConsentRequired] = useState(false);

  const applyBannerState = useCallback((required: boolean, hasConsent: boolean) => {
    setConsentRequired(required);
    if (!required) { 
      setVisible(false);
      setDescription(DEFAULT_PROMPT);
      return;
    }

    setVisible(!hasConsent);
    setDescription(
      hasConsent ? "Thanks! Tracking is enabled for this session." : "We need your permission before EventSync can store identity data or send events."
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleReady = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const required = Boolean(detail?.config?.consentRequired);
      const hasConsent = required ? window.EventSync?.isConsented?.() ?? false : true;
      applyBannerState(required, hasConsent);
    };

    const handleConsent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const hasConsent = Boolean(detail?.hasConsent);
      applyBannerState(true, hasConsent);
    };

    window.addEventListener("eventsync:ready", handleReady);
    window.addEventListener("eventsync:consent", handleConsent);

    return () => {
      window.removeEventListener("eventsync:ready", handleReady);
      window.removeEventListener("eventsync:consent", handleConsent);
    };
  }, [applyBannerState]);

  const handleConsentSelection = useCallback(
    (hasConsent: boolean) => {
      if (typeof window === "undefined" || !window.EventSync?.setConsent) {
        return;
      }

      window.EventSync.setConsent({
        hasConsent,
        advertising: hasConsent,
        analytics: hasConsent,
      });
      applyBannerState(consentRequired, hasConsent);
    },
    [applyBannerState, consentRequired]
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="consent-banner" role="dialog" aria-live="polite" aria-label="Tracking consent banner">
      <div>
        <h3>Allow EventSync tracking?</h3>
        <p>{description}</p>
      </div>
      <div className="consent-actions">
        <button onClick={() => handleConsentSelection(true)}>Allow tracking</button>
        <button className="button-secondary" onClick={() => handleConsentSelection(false)}>
          Decline
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;

