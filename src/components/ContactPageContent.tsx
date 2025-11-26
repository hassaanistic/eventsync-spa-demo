"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EventSyncAdditionalData } from "@/types/eventsync";
import {
  contactFormSchema,
  manualContactFormSchema,
  type ContactFormData,
  type ManualContactFormData,
} from "@/lib/validations";

const ContactPageContent = () => {
  // Auto-tracked contact form with React Hook Form + Zod
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      role: "",
      company: "",
    },
  });

  // Manual contact form with React Hook Form + Zod
  const manualContactForm = useForm<ManualContactFormData>({
    resolver: zodResolver(manualContactFormSchema),
    defaultValues: {
      topic: "",
      channel: "",
      notes: "",
    },
  });

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

  const handleManualContact = useCallback(
    (data: ManualContactFormData) => {
      // Convert form data to payload, removing empty strings
    const payload: EventSyncAdditionalData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === "string" && value.trim()) {
        payload[key] = value.trim();
      }
    });
    sendContactEvent(payload);
      manualContactForm.reset();
    },
    [sendContactEvent, manualContactForm]
  );

  const handleContactSubmit = useCallback(
    (data: ContactFormData) => {
      // Contact form is auto-tracked by SDK via data-es-* attributes
      // React Hook Form just handles validation
      console.log("[EventSync] Contact auto form submitted");
      contactForm.reset();
    },
    [contactForm]
  );

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
          onSubmit={contactForm.handleSubmit(handleContactSubmit)}
        >
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="contact-email">Work Email</label>
              <input
                id="contact-email"
                type="email"
                data-es-identity="email"
                placeholder="team@example.com"
                className={contactForm.formState.errors.email ? "error" : ""}
                {...contactForm.register("email")}
              />
              {contactForm.formState.errors.email && (
                <span className="error-message">{contactForm.formState.errors.email.message}</span>
              )}
            </div>
            <div className="input-field">
              <label htmlFor="contact-phone">Phone</label>
              <input
                id="contact-phone"
                type="tel"
                data-es-identity="phoneNumber"
                placeholder="+1 415 555 0000"
                {...contactForm.register("phoneNumber")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="contact-role">Role</label>
              <input id="contact-role" type="text" placeholder="Growth Lead" {...contactForm.register("role")} />
            </div>
            <div className="input-field">
              <label htmlFor="contact-company">Company</label>
              <input id="contact-company" type="text" placeholder="Acme Inc." {...contactForm.register("company")} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={contactForm.formState.isSubmitting}>
              {contactForm.formState.isSubmitting ? "Submitting..." : "Request Demo (auto)"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Manual Contact Event</h3>
        <p>Submit to call EventSync.sendEvent() yourself—mirrors webhooks you expect from the SDK.</p>
        <form onSubmit={manualContactForm.handleSubmit(handleManualContact)}>
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="manual-topic">Topic</label>
              <input
                id="manual-topic"
                type="text"
                placeholder="Integration help"
                className={manualContactForm.formState.errors.topic ? "error" : ""}
                {...manualContactForm.register("topic")}
              />
              {manualContactForm.formState.errors.topic && (
                <span className="error-message">{manualContactForm.formState.errors.topic.message}</span>
              )}
            </div>
            <div className="input-field">
              <label htmlFor="manual-channel">Channel</label>
              <input
                id="manual-channel"
                type="text"
                placeholder="Chat"
                {...manualContactForm.register("channel")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-notes">Notes</label>
              <input
                id="manual-notes"
                type="text"
                placeholder="Need help sending Purchase events."
                {...manualContactForm.register("notes")}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={manualContactForm.formState.isSubmitting}>
              {manualContactForm.formState.isSubmitting ? "Sending..." : "Send Contact (manual)"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ContactPageContent;

