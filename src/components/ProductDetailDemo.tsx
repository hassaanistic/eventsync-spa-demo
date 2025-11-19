"use client";

import Image from "next/image";
import { useCallback } from "react";
import type { EventSyncAdditionalData } from "@/types/eventsync";

const product = {
  id: "demo-runner",
  name: "Velocity Runner X",
  price: 149.99,
  description: "Breathable knit upper, responsive foam midsole, and traction outsole built for daily training.",
  heroImage: "https://images.unsplash.com/photo-1528701800489-20be3c10352c?auto=format&fit=crop&w=1200&q=80",
};

const ProductDetailDemo = () => {
  const notify = useCallback((message: string) => {
    if (typeof window === "undefined") return;
    console.log(message);
  }, []);

  const sendEvent = useCallback(
    (eventName: string, additionalData: EventSyncAdditionalData) => {
      if (typeof window === "undefined" || !window.EventSync?.sendEvent) {
        notify("[EventSync] SDK not ready yet.");
        return;
      }
      window.EventSync.sendEvent({
        eventName,
        eventType: "interaction",
        additionalData,
      });
    },
    [notify]
  );

  return (
    <div className="page">
      <h1 className="page-heading">{product.name}</h1>
      <p className="page-description">
        This PDP route lets you verify SPA navigation tracking, auto-tracked CTAs, and manual conversions outside the home
        page.
      </p>

      <div className="card" style={{ display: "grid", gap: "32px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <Image
          src={product.heroImage}
          alt={product.name}
          width={600}
          height={500}
          style={{ borderRadius: 16, width: "100%", height: "auto", objectFit: "cover" }}
        />
        <div>
          <p style={{ color: "#475569", fontSize: 16 }}>{product.description}</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "16px 0" }}>${product.price.toFixed(2)}</p>
          <div className="events-row" style={{ marginBottom: 24 }}>
            <button
              data-es-event="AddToCart"
              data-es-event-name="AddToCart"
              data-es-event-type="interaction"
              data-es-event-payload={`{"productId":"${product.id}","value":${product.price},"currency":"USD"}`}
            >
              Auto-Tracked Add To Cart
            </button>
            <button
              data-es-event="ViewContent"
              data-es-event-name="ViewContent"
              data-es-event-type="interaction"
              data-es-event-payload={`{"content_type":"product","contents":[{"id":"${product.id}"}]}`}
            >
              Auto-Tracked ViewContent
            </button>
          </div>
          <div className="events-row">
            <button
              onClick={() =>
                sendEvent("InitiateCheckout", {
                  contents: [{ id: product.id, quantity: 1, item_price: product.price, name: product.name }],
                  value: product.price,
                  currency: "USD",
                  checkout_step: 1,
                })
              }
            >
              Manual InitiateCheckout
            </button>
            <button
              onClick={() =>
                sendEvent("Purchase", {
                  contents: [{ id: product.id, quantity: 1, item_price: product.price, name: product.name }],
                  value: product.price,
                  currency: "USD",
                  orderId: `pdp_order_${Date.now()}`,
                })
              }
            >
              Manual Purchase
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Product Questions</h3>
        <p>
          Use the quick contact form to send a <code>Contact</code> event manually while we keep <code>data-es-collect</code>{" "}
          enabled for auto identity capture.
        </p>
        <form
          data-es-collect="true"
          data-es-event="true"
          data-es-event-name="Lead"
          data-es-event-type="interaction"
          data-es-event-payload='{"source":"pdp_contact"}'
          onSubmit={(e) => {
            e.preventDefault();
            notify("PDP contact form submitted. SDK auto event should fire.");
          }}
        >
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="pdp-email">Email</label>
              <input id="pdp-email" name="email" type="email" data-es-identity="email" placeholder="you@example.com" required />
            </div>
            <div className="input-field">
              <label htmlFor="pdp-message">Question</label>
              <input id="pdp-message" name="question" type="text" placeholder="Do you have this in size 11?" required />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Send question</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailDemo;

