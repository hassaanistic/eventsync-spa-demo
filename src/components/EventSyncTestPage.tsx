"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EventSyncAdditionalData } from "@/types/eventsync";
import {
  identityFormSchema,
  manualLeadFormSchema,
  type IdentityFormData,
  type ManualLeadFormData,
} from "@/lib/validations";

type LogLevel = "info" | "success" | "error";

interface LogEntry {
  id: number;
  type: LogLevel;
  message: string;
}

const standardEventPayloads: Record<string, EventSyncAdditionalData> = {
  ViewContent: {
    content_type: "product",
    contents: [{ id: "prod_demo", quantity: 1, item_price: 129.99, name: "Demo Sneaker" }],
    value: 129.99,
    currency: "USD",
    content_category: "Footwear",
  },
  Search: {
    search_string: "best running shoes",
    content_category: "Footwear",
    source: "site_search",
  },
  AddToWishlist: {
    contents: [{ id: "prod_demo", quantity: 1, item_price: 89.99, name: "Demo Hoodie" }],
    content_type: "product",
    currency: "USD",
    value: 89.99,
    list_name: "Holiday wishlist",
  },
  InitiateCheckout: {
    contents: [
      { id: "prod_demo", quantity: 1, item_price: 129.99, name: "Demo Sneaker" },
      { id: "prod_socks", quantity: 2, item_price: 12.5, name: "Running Socks" },
    ],
    num_items: 3,
    currency: "USD",
    value: 154.99,
    checkout_step: 1,
  },
  AddPaymentInfo: {
    contents: [{ id: "prod_demo", quantity: 1, item_price: 129.99, name: "Demo Sneaker" }],
    currency: "USD",
    value: 129.99,
    payment_method_type: "credit_card",
  },
  CompleteRegistration: {
    registration_method: "email",
    status: "Completed",
    plan: "Pro Annual",
  },
  Contact: {
    contact_method: "Live Chat",
    channel: "Web",
    reason: "Product question",
  },
  Subscribe: {
    subscription_plan: "Weekly Newsletter",
    channel: "Blog CTA",
    consent: true,
  },
  StartTrial: {
    trial_plan: "Growth",
    value: 0,
    currency: "USD",
    trial_length: 14,
  },
  Donate: {
    value: 25,
    currency: "USD",
    campaign: "Winter relief fund",
  },
};

const demoProducts = [
  {
    id: "prod_headphones",
    name: "Noise-cancelling Headphones",
    price: 199,
  },
  {
    id: "prod_shoes",
    name: "Running Shoes",
    price: 129.99,
  },
];

const EventSyncTestPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [consentRequired, setConsentRequired] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Identity form with React Hook Form + Zod
  const identityForm = useForm<IdentityFormData>({
    resolver: zodResolver(identityFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      first_name: "",
      last_name: "",
      city: "",
      state: "",
      country: "",
      zip: "",
    },
  });

  // Manual lead form with React Hook Form + Zod
  const manualLeadForm = useForm<ManualLeadFormData>({
    resolver: zodResolver(manualLeadFormSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      city: "",
      stateCode: "",
      countryCode: "",
      zipCode: "",
      stageInSalesProcess: "",
      preferredPlan: "",
    },
  });

  const addLog = useCallback((message: string, type: LogLevel = "info") => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), message, type }]);
  }, []);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const sdkReady = useCallback(() => {
    if (typeof window === "undefined" || !window.EventSync?.sendEvent) {
      addLog("SDK not ready. Wait a moment and try again.", "error");
      return false;
    }
    return true;
  }, [addLog]);

  const sendPageView = useCallback(() => {
    if (!sdkReady()) return;
    window.EventSync!.sendEvent!({
      eventName: "PageView",
      eventType: "nonInteraction",
      additionalData: { pageVariant: "demo" },
    });
    addLog("Manual PageView event sent", "success");
  }, [addLog, sdkReady]);

  const sendAddToCart = useCallback(
    (product: { id: string; name: string; price: number; quantity?: number }) => {
      if (!sdkReady()) return;
      const quantity = product.quantity ?? 1;
      window.EventSync!.sendEvent!({
        eventName: "AddToCart",
        eventType: "interaction",
        additionalData: {
          contents: [
            {
              id: product.id,
              quantity,
              item_price: product.price,
              name: product.name,
            },
          ],
          num_items: quantity,
          value: product.price * quantity,
          currency: "USD",
          product_category: "Demo",
        },
      });
      addLog(`AddToCart sent for ${product.name}`, "success");
    },
    [addLog, sdkReady]
  );

  const sendPurchase = useCallback(
    (product: { id: string; name: string; price: number; quantity?: number }) => {
      if (!sdkReady()) return;
      const quantity = product.quantity ?? 1;
      window.EventSync!.sendEvent!({
        eventName: "Purchase",
        eventType: "interaction",
        additionalData: {
          value: product.price * quantity,
          currency: "USD",
          orderId: `order_${Date.now()}`,
          contents: [
            {
              id: product.id,
              quantity,
              item_price: product.price,
              name: product.name,
            },
          ],
          num_items: quantity,
          product_category: "Demo",
        },
      });
      addLog(`Purchase sent for ${product.name}`, "success");
    },
    [addLog, sdkReady]
  );

  const sendLead = useCallback(
    (additionalData: EventSyncAdditionalData) => {
      if (!sdkReady()) return;
      window.EventSync!.sendEvent!({
        eventName: "Lead",
        eventType: "interaction",
        additionalData,
      });
      addLog("Lead event sent", "success");
    },
    [addLog, sdkReady]
  );

  const sendSubscribe = useCallback(
    (additionalData: EventSyncAdditionalData) => {
      if (!sdkReady()) return;
      window.EventSync!.sendEvent!({
        eventName: "Subscribe",
        eventType: "interaction",
        additionalData,
      });
      addLog("Subscribe event sent", "success");
    },
    [addLog, sdkReady]
  );

  const triggerStandardEvent = useCallback(
    (eventName: string) => {
      if (!sdkReady()) return;
      const payload = standardEventPayloads[eventName] || {};
      window.EventSync!.sendEvent!({
        eventName,
        eventType: "interaction",
        additionalData: payload,
      });
      addLog(`${eventName} event sent`, "success");
    },
    [addLog, sdkReady]
  );

  const handleManualLeadSubmit = useCallback(
    (data: ManualLeadFormData) => {
      if (!sdkReady()) return;

      // Convert form data to payload, removing empty strings
      const payload: Record<string, string> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === "string" && value.trim()) {
          payload[key] = value.trim();
        }
      });

      sendLead(payload);
      manualLeadForm.reset();
      addLog("Manual lead form sent via sendEvent", "success");
    },
    [sendLead, sdkReady, addLog, manualLeadForm]
  );

  const handleIdentitySubmit = useCallback(
    (data: IdentityFormData) => {
      // Identity form is auto-tracked by SDK via data-es-* attributes
      // React Hook Form just handles validation
      addLog("Identity form submitted. SDK will auto-fire the Lead event with cached identity data.", "success");
      identityForm.reset();
    },
    [addLog, identityForm]
  );

  const checkSDKStatus = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.EventSync?.sendEvent) {
      addLog("EventSync SDK is loaded and available", "success");
      addLog(`SDK initialized: ${Boolean(window.EventSync.isInitialized)}`, "info");
    } else {
      addLog("EventSync SDK not found. Make sure the script loaded correctly.", "error");
    }
  }, [addLog]);

  const clearLog = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readyHandler = (event: Event) => {
      addLog("EventSync SDK initialized successfully!", "success");
      addLog(`Config: ${JSON.stringify((event as CustomEvent).detail, null, 2)}`, "info");
      const required = Boolean((event as CustomEvent).detail?.config?.consentRequired);
      setConsentRequired(required);
    };

    const beforeSendHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail?.payload;
      addLog(
        `beforeSend (${detail?.eventName ?? "unknown"}) -> ${JSON.stringify(detail?.additionalData || {}, null, 2)}`,
        "info"
      );
    };

    const errorHandler = (event: Event) => {
      addLog(`SDK Error: ${JSON.stringify((event as CustomEvent).detail)}`, "error");
    };

    window.addEventListener("eventsync:ready", readyHandler);
    window.addEventListener("eventsync:beforeSend", beforeSendHandler);
    window.addEventListener("eventsync:error", errorHandler);

    const timeout = setTimeout(() => checkSDKStatus(), 1200);

    return () => {
      window.removeEventListener("eventsync:ready", readyHandler);
      window.removeEventListener("eventsync:beforeSend", beforeSendHandler);
      window.removeEventListener("eventsync:error", errorHandler);
      clearTimeout(timeout);
    };
  }, [addLog, checkSDKStatus]);

  return (
    <div className="page">
      <h1 className="page-heading">EventSync SDK Test Page</h1>
      <p className="page-description">
        Use the sections below to try both auto-tracked experiences (data attributes) and manual sendEvent() calls inside a
        Next.js SPA.
      </p>

      <div className="info">
        <strong>How to test:</strong>
        <ol>
          <li>
            <strong>Auto-tracked:</strong> Submit the identity form (uses <code>data-es-collect</code>/<code>data-es-identity</code>)
            to see how the SDK caches identity data and auto-fires the configured form event.
          </li>
          <li>
            <strong>Manual triggers:</strong> Use the buttons in the manual section to call <code>EventSync.sendEvent()</code>{" "}
            directly for PageView, Lead, AddToCart, Purchase, etc.
          </li>
          <li>Watch the log panel to confirm enrichment and delivery for both auto-tracked and manual events.</li>
        </ol>
      </div>

      <section className="identity-form">
        <h3>Auto-Tracked Identity Form</h3>
        <p className="description">
          This card is wired with <code>data-es-collect</code> and emits a <code>Lead</code> event automatically on submit.
          Fill it out to test SDK enrichment plus auto-send behaviour—no manual <code>sendEvent()</code> calls needed.
        </p>
        <form
          onSubmit={identityForm.handleSubmit(handleIdentitySubmit)}
          name="leadCapture"
          data-es-collect="true"
          data-es-event="true"
          data-es-event-name="Lead"
          data-es-event-type="interaction"
          data-es-event-payload='{"source":"identity_form"}'
        >
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="identity-email">Email</label>
              <input
                id="identity-email"
                type="email"
                data-es-identity="email"
                placeholder="jane.doe@example.com"
                className={identityForm.formState.errors.email ? "error" : ""}
                {...identityForm.register("email")}
              />
              {identityForm.formState.errors.email && (
                <span className="error-message">{identityForm.formState.errors.email.message}</span>
              )}
            </div>
            <div className="input-field">
              <label htmlFor="identity-phone">Phone</label>
              <input
                id="identity-phone"
                type="tel"
                data-es-identity="phoneNumber"
                placeholder="+1 415 555 1234"
                className={identityForm.formState.errors.phone ? "error" : ""}
                {...identityForm.register("phone")}
              />
              {identityForm.formState.errors.phone && (
                <span className="error-message">{identityForm.formState.errors.phone.message}</span>
              )}
            </div>
            <div className="input-field">
              <label htmlFor="identity-first-name">First name</label>
              <input
                id="identity-first-name"
                type="text"
                data-es-identity="firstName"
                placeholder="Jane"
                {...identityForm.register("first_name")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="identity-last-name">Last name</label>
              <input
                id="identity-last-name"
                type="text"
                data-es-identity="lastName"
                placeholder="Doe"
                {...identityForm.register("last_name")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="identity-city">City</label>
              <input
                id="identity-city"
                type="text"
                data-es-identity="city"
                placeholder="San Francisco"
                {...identityForm.register("city")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="identity-state">State</label>
              <input
                id="identity-state"
                type="text"
                data-es-identity="stateCode"
                placeholder="CA"
                {...identityForm.register("state")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="identity-country">Country</label>
              <input
                id="identity-country"
                type="text"
                data-es-identity="countryCode"
                placeholder="US"
                {...identityForm.register("country")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="identity-zip">Zip</label>
              <input
                id="identity-zip"
                type="text"
                data-es-identity="zipCode"
                placeholder="94105"
                {...identityForm.register("zip")}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={identityForm.formState.isSubmitting}>
              {identityForm.formState.isSubmitting ? "Submitting..." : "Submit Identity Form"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Auto-Tracked Click Demo</h2>
        <p>
          These buttons have no <code>onClick</code> handlers. The SDK picks them up via <code>data-es-event</code> and fires
          events when clicked.
        </p>
        <div className="events-row">
          <button
            className="auto-track-btn"
            data-es-event="AddToWishlist"
            data-es-event-name="AddToWishlist"
            data-es-event-type="interaction"
            data-es-event-payload='{"cta":"auto_track_button","productId":"auto_demo"}'
          >
            Auto-Tracked CTA (AddToWishlist)
          </button>
          <button
            className="auto-track-btn"
            data-es-event="AddToCart"
            data-es-event-name="AddToCart"
            data-es-event-type="interaction"
            data-es-event-payload='{"productId":"auto_cart_demo","value":59.99,"currency":"USD"}'
          >
            Auto-Tracked CTA (AddToCart)
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Products (Manual Event Helpers)</h2>
        <p>These quick helpers call EventSync.sendEvent() for common commerce events.</p>
        <div className="product-grid">
          {demoProducts.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>${product.price.toFixed(2)}</p>
              <div className="events-row">
                <button onClick={() => sendAddToCart(product)}>Add To Cart</button>
                <button onClick={() => sendPurchase(product)}>Purchase</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Manual Event Buttons</h2>
        <p>Dispatch events via EventSync.sendEvent().</p>
        <div className="events-row">
          <button onClick={sendPageView}>Send PageView Event</button>
          <button onClick={() => sendAddToCart({ id: "test-product-123", name: "Sample Product", price: 49.99 })}>
            Send AddToCart Event
          </button>
          <button onClick={() => sendLead({ stageInSalesProcess: "Consultation Booked", crmYouUse: "HubSpot", preferredPlan: "Growth" })}>
            Send Lead Event
          </button>
          <button onClick={() => sendSubscribe({ newsletter: "Weekly Product Updates", channel: "Organic" })}>
            Send Subscribe Event
          </button>
        </div>
        <div className="events-row">
          <button onClick={checkSDKStatus}>Check SDK Status</button>
          <button onClick={clearLog}>Clear Log</button>
        </div>
      </section>

      <section className="card">
        <h3>Manual Lead Form (sendEvent)</h3>
        <p>
          This form uses <code>EventSync.sendEvent()</code> directly—no <code>data-es-*</code> attributes.
        </p>
        <form onSubmit={manualLeadForm.handleSubmit(handleManualLeadSubmit)}>
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="manual-email">Email</label>
              <input
                id="manual-email"
                type="email"
                placeholder="alex@example.com"
                className={manualLeadForm.formState.errors.email ? "error" : ""}
                {...manualLeadForm.register("email")}
              />
              {manualLeadForm.formState.errors.email && (
                <span className="error-message">{manualLeadForm.formState.errors.email.message}</span>
              )}
            </div>
            <div className="input-field">
              <label htmlFor="manual-phoneNumber">Phone</label>
              <input
                id="manual-phoneNumber"
                type="tel"
                placeholder="+1 555 555 5555"
                {...manualLeadForm.register("phoneNumber")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-firstName">First name</label>
              <input
                id="manual-firstName"
                type="text"
                placeholder="Alex"
                {...manualLeadForm.register("firstName")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-lastName">Last name</label>
              <input
                id="manual-lastName"
                type="text"
                placeholder="Morgan"
                {...manualLeadForm.register("lastName")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-city">City</label>
              <input
                id="manual-city"
                type="text"
                placeholder="San Francisco"
                {...manualLeadForm.register("city")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-stateCode">State</label>
              <input
                id="manual-stateCode"
                type="text"
                placeholder="CA"
                {...manualLeadForm.register("stateCode")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-countryCode">Country</label>
              <input
                id="manual-countryCode"
                type="text"
                placeholder="US"
                {...manualLeadForm.register("countryCode")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-zipCode">Zip</label>
              <input
                id="manual-zipCode"
                type="text"
                placeholder="94105"
                {...manualLeadForm.register("zipCode")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-stageInSalesProcess">Pipeline stage</label>
              <input
                id="manual-stageInSalesProcess"
                type="text"
                placeholder="Discovery Call Booked"
                {...manualLeadForm.register("stageInSalesProcess")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="manual-preferredPlan">Preferred plan</label>
                <input
                id="manual-preferredPlan"
                type="text"
                placeholder="Growth"
                {...manualLeadForm.register("preferredPlan")}
                />
              </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={manualLeadForm.formState.isSubmitting}>
              {manualLeadForm.formState.isSubmitting ? "Sending..." : "Send Lead via sendEvent"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Standard Facebook Event Templates</h2>
        <p>Quick triggers for the most common Meta standard events.</p>
        <div className="standard-event-grid">
          {Object.entries(standardEventPayloads).map(([name, description]) => (
            <div key={name} className="standard-event-card">
              <h4>{name}</h4>
              <p>Payload keys: {Object.keys(description).join(", ")}</p>
              <button onClick={() => triggerStandardEvent(name)}>Trigger {name}</button>
            </div>
          ))}
        </div>
      </section>

      <div className="card">
        <h3>SDK Log</h3>
        <div className="log-panel" ref={logRef}>
          {logs.length === 0 && <p>No log entries yet.</p>}
          {logs.map((entry) => (
            <div key={entry.id} className={`log-entry log-${entry.type}`}>
              [{new Date(entry.id).toLocaleTimeString()}] {entry.message}
            </div>
          ))}
        </div>
      </div>

      {consentRequired && (
        <p className="page-description">
          Consent gating is enabled in the dashboard. Events remain paused until the global banner is accepted.
        </p>
      )}
    </div>
  );
};

export default EventSyncTestPage;

