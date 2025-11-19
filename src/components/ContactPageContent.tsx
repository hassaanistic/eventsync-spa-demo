"use client";

import { FormEvent, useCallback } from "react";
import type { EventSyncAdditionalData } from "@/types/eventsync";

const ContactPageContent = () => {
  const sendContactEvent = useCallback((additionalData: EventSyncAdditionalData) => {
    if (typeof window === "undefined" || !window.EventSync?.sendEvent) {
      console.warn("[EventSync] SDK not ready yet—unable to send Contact event.");
      return;
    }

    window.EventSync.sendEvent({
      eventName: "Contact",
      eventType: "interaction",
      additionalData,
    });
  }, []);

  const handleManualContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: EventSyncAdditionalData = {};
    formData.forEach((value, key) => {
      if (typeof value === "string" && value.trim()) {
        payload[key] = value.trim();
      }
    });
    sendContactEvent(payload);
    event.currentTarget.reset();
  };

  return (
    <div className="page">
      <h1 className="page-heading">Contact & Consent Playground</h1>
      <p className="page-description">
        Flip the consent toggle in the dashboard, refresh, and make sure banner/auto-track behaviour works across routes.
      </p>

      <section className="card">
        <h3>Auto-Tracked Contact Form</h3>
        <p>
          Uses <code>data-es-collect</code> to cache identity and emits a <code>Lead</code> event automatically when submitted.
        </p>
        <form
          data-es-collect="true"
          data-es-event="true"
          data-es-event-name="Lead"
          data-es-event-type="interaction"
          data-es-event-payload='{"source":"contact_auto"}'
          onSubmit={(event) => {
            event.preventDefault();
            console.log("[EventSync] Contact auto form submitted");
          }}
        >
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="contact-email">Work Email</label>
              <input id="contact-email" name="email" type="email" data-es-identity="email" placeholder="team@example.com" required />
            </div>
            <div className="input-field">
              <label htmlFor="contact-phone">Phone</label>
              <input id="contact-phone" name="phoneNumber" type="tel" data-es-identity="phoneNumber" placeholder="+1 415 555 0000" />
            </div>
            <div className="input-field">
              <label htmlFor="contact-role">Role</label>
              <input id="contact-role" name="role" type="text" placeholder="Growth Lead" />
            </div>
            <div className="input-field">
              <label htmlFor="contact-company">Company</label>
              <input id="contact-company" name="company" type="text" placeholder="Acme Inc." />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Request Demo (auto)</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Manual Contact Event</h3>
        <p>Submit to call EventSync.sendEvent() yourself—mirrors webhooks you expect from the SDK.</p>
        <form onSubmit={handleManualContact}>
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="manual-topic">Topic</label>
              <input id="manual-topic" name="topic" type="text" placeholder="Integration help" required />
            </div>
            <div className="input-field">
              <label htmlFor="manual-channel">Channel</label>
              <input id="manual-channel" name="channel" type="text" placeholder="Chat" />
            </div>
            <div className="input-field">
              <label htmlFor="manual-notes">Notes</label>
              <input id="manual-notes" name="notes" type="text" placeholder="Need help sending Purchase events." />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Send Contact (manual)</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ContactPageContent;

