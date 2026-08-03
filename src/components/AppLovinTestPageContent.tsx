"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LogEntry {
  id: number;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

/**
 * Sample line items. The Axon Pixel Helper marks `items` as Required on every
 * commerce event and shows a red NULL without it, so the demo ships a realistic
 * cart rather than firing bare events.
 */
const SAMPLE_ITEMS = [
  {
    item_id: "sku-demo-001",
    item_name: "Demo Blue Runner",
    item_category: "Footwear",
    item_brand: "EventsIQ Demo",
    price: 39.99,
    quantity: 1,
  },
  {
    item_id: "sku-demo-002",
    item_name: "Demo Cotton Sock",
    item_category: "Accessories",
    item_brand: "EventsIQ Demo",
    price: 10.0,
    quantity: 1,
  },
];

const SAMPLE_CART_VALUE = 49.99;

/** Dummy identity — obviously fake, but enough to satisfy Axon's user_data check. */
const SAMPLE_USER_DATA = {
  email: "demo.shopper@example.com",
  phone: "+14155552671",
  country_code: "US",
  zip: "10001",
};

/**
 * Axon's standard event vocabulary. Unlike Snapchat (UPPERCASE) these are
 * lowercase snake_case, which is the single easiest thing to get wrong.
 *
 * `data` supplies the parameters the Pixel Helper expects for each event type —
 * commerce events carry items/currency/value, purchase adds shipping, tax,
 * transaction_id and user_data.
 */
const AXON_STANDARD_EVENTS: Array<{
  name: string;
  desc: string;
  data: () => Record<string, unknown>;
}> = [
  { name: "page_view", desc: "Page load — no commerce params expected", data: () => ({}) },
  {
    name: "view_item",
    desc: "Product / offer viewed",
    data: () => ({ items: SAMPLE_ITEMS, currency: "USD", value: SAMPLE_CART_VALUE }),
  },
  {
    name: "add_to_cart",
    desc: "Item added to cart",
    data: () => ({ items: SAMPLE_ITEMS, currency: "USD", value: SAMPLE_CART_VALUE }),
  },
  {
    name: "begin_checkout",
    desc: "Checkout started",
    data: () => ({ items: SAMPLE_ITEMS, currency: "USD", value: SAMPLE_CART_VALUE }),
  },
  {
    name: "purchase",
    desc: "Order completed — the strictest event; needs shipping, tax and user_data too",
    data: () => ({
      items: SAMPLE_ITEMS,
      currency: "USD",
      value: SAMPLE_CART_VALUE,
      orderId: `txn_demo_${Date.now()}`,
      shipping: 4.99,
      tax: 3.5,
      user_data: SAMPLE_USER_DATA,
    }),
  },
  { name: "sign_up", desc: "Lead / registration", data: () => ({ user_data: SAMPLE_USER_DATA }) },
  {
    name: "subscribe",
    desc: "Subscription started",
    data: () => ({ items: SAMPLE_ITEMS, currency: "USD", value: 9.99, user_data: SAMPLE_USER_DATA }),
  },
  { name: "search", desc: "Site search performed", data: () => ({ search_term: "blue runner" }) },
];

/** Events Axon validates commerce parameters on. */
const COMMERCE_EVENTS = new Set(["view_item", "add_to_cart", "begin_checkout", "purchase", "subscribe"]);

/**
 * Mirror of mapToAppLovinStandardEventName() in the SDK. Kept here so the page
 * can PREVIEW what a generic event name will be translated to before firing —
 * if this preview and the intercepted axon() call ever disagree, the SDK's copy
 * has drifted.
 */
const NAME_MAP: Record<string, string> = {
  pageview: "page_view",
  page_view: "page_view",
  viewcontent: "view_item",
  view_content: "view_item",
  view_item: "view_item",
  addtocart: "add_to_cart",
  add_to_cart: "add_to_cart",
  add_cart: "add_to_cart",
  initiatecheckout: "begin_checkout",
  initiate_checkout: "begin_checkout",
  start_checkout: "begin_checkout",
  begin_checkout: "begin_checkout",
  purchase: "purchase",
  donate: "purchase",
  lead: "sign_up",
  signup: "sign_up",
  sign_up: "sign_up",
  completeregistration: "sign_up",
  complete_registration: "sign_up",
  subscribe: "subscribe",
  search: "search",
};

function previewAxonName(eventName: string): string {
  if (!eventName) return "page_view";
  const normalized = String(eventName).toLowerCase().replace(/[\s-]+/g, "_");
  return NAME_MAP[normalized] || normalized;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

const btn = (bg: string): React.CSSProperties => ({
  padding: "0.75rem 1.25rem",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "0.95rem",
  fontWeight: 500,
  cursor: "pointer",
});

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const AppLovinTestPageContent = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [eventName, setEventName] = useState("purchase");
  const [eventValue, setEventValue] = useState("49.99");
  const [currency, setCurrency] = useState("USD");
  const [orderId, setOrderId] = useState("txn_demo_001");
  const [intercepting, setIntercepting] = useState(false);
  const [attribution, setAttribution] = useState<Record<string, string | null>>(
    {},
  );
  const logRef = useRef<HTMLDivElement>(null);
  const originalAxon = useRef<unknown>(null);

  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), message, type },
      ]);
    },
    [],
  );

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // ── Attribution snapshot ────────────────────────────────────────────────
  const refreshAttribution = useCallback(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const snapshot: Record<string, string | null> = {
      "URL ?aleid": p.get("aleid"),
      "URL ?eiq_aleid": p.get("eiq_aleid"),
      "sessionStorage eiq_aleid": sessionStorage.getItem("eiq_aleid"),
      "cookie eiq_aleid": readCookie("eiq_aleid"),
      "URL ?axwrt": p.get("axwrt"),
      "cookie axwrt": readCookie("axwrt") || readCookie("_axwrt"),
      "cookie eiq_click_id": readCookie("eiq_click_id"),
    };
    setAttribution(snapshot);

    // Same precedence order the SDK uses.
    const resolved =
      p.get("eiq_aleid") ||
      sessionStorage.getItem("eiq_aleid") ||
      p.get("aleid") ||
      readCookie("eiq_aleid") ||
      null;

    if (resolved) {
      addLog(`aleid resolved: ${resolved}`, "success");
    } else {
      addLog(
        "No aleid present. Conversions will fall back to weaker identifiers — use “Simulate AppLovin click” below.",
        "warning",
      );
    }
  }, [addLog]);

  // ── Pixel status ────────────────────────────────────────────────────────
  const checkPixelStatus = useCallback(() => {
    if (typeof window === "undefined") return;
    const axon = (window as any).axon;

    if (typeof axon === "undefined") {
      addLog(
        "❌ window.axon is undefined — the Axon Pixel never initialized. Check that an `applovin` provider is configured on this site's SDK config.",
        "error",
      );
      return;
    }

    addLog("✅ window.axon is defined", "success");
    addLog(`   eventKey: ${axon.eventKey ?? "(not set)"}`, axon.eventKey ? "info" : "warning");

    // Before pixel.js loads, calls buffer in operationQueue. Once it loads it
    // installs performOperation and drains the queue — so performOperation
    // existing is the real "script actually loaded" signal.
    if (typeof axon.performOperation === "function") {
      addLog("✅ pixel.js loaded (performOperation installed — calls execute live)", "success");
    } else {
      addLog(
        `⏳ pixel.js not loaded yet — ${axon.operationQueue?.length ?? 0} call(s) buffered in operationQueue. They will flush once the script arrives.`,
        "warning",
      );
    }

    const scripts = Array.from(document.querySelectorAll("script"))
      .map((s) => s.getAttribute("src") || "")
      .filter((s) => s.includes("axon.ai") || s.includes("applovin.com"));
    if (scripts.length) {
      scripts.forEach((s) => addLog(`   script: ${s}`, "info"));
    } else {
      addLog("   ⚠️ no s.axon.ai / res4.applovin.com script tags found in the DOM", "warning");
    }
  }, [addLog]);

  // ── Intercept raw axon() calls ──────────────────────────────────────────
  const toggleIntercept = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window as any;

    if (intercepting) {
      if (originalAxon.current) w.axon = originalAxon.current;
      originalAxon.current = null;
      setIntercepting(false);
      addLog("Interceptor removed — axon() restored.", "info");
      return;
    }

    if (typeof w.axon === "undefined") {
      addLog("Cannot intercept: window.axon is undefined. Check pixel status first.", "error");
      return;
    }

    originalAxon.current = w.axon;
    const original = w.axon;
    const wrapped = function (...args: unknown[]) {
      const [op, name, data] = args;
      addLog(
        `🛰️ axon("${op}"${name !== undefined ? `, "${name}"` : ""}${data !== undefined ? `, ${JSON.stringify(data)}` : ""})`,
        "success",
      );
      return (original as (...a: unknown[]) => unknown).apply(w, args);
    };
    // Preserve the properties the real pixel sets on the function object.
    Object.assign(wrapped, original);
    w.axon = wrapped;
    setIntercepting(true);
    addLog("✅ Interceptor active — every axon() call will be logged verbatim.", "success");
  }, [intercepting, addLog]);

  // ── Firing ──────────────────────────────────────────────────────────────
  const sdkReady = useCallback(() => {
    if (typeof window === "undefined" || !window.EventsIQ?.sendEvent) {
      addLog("EventsIQ SDK not ready yet — wait a moment and retry.", "error");
      return false;
    }
    return true;
  }, [addLog]);

  /** Fire THROUGH the SDK, scoped to the applovin provider only. */
  const fireViaSdk = useCallback(
    (name: string, extra: Record<string, unknown> = {}) => {
      if (!sdkReady()) return;

      window.EventsIQ!.sendEvent!({
        eventName: name,
        eventType: "interaction",
        // Scoping to applovin keeps Facebook/Google/TikTok pixels out of the
        // way, so anything you see in the log came from AppLovin.
        providers: ["applovin"],
        additionalData: extra,
      });

      addLog(
        `📤 SDK sendEvent("${name}") → axon expects "${previewAxonName(name)}"${
          Object.keys(extra).length ? ` · ${JSON.stringify(extra)}` : ""
        }`,
        "info",
      );
    },
    [addLog, sdkReady],
  );

  /** Fire DIRECTLY at axon(), bypassing the SDK entirely. */
  const fireDirect = useCallback(
    (name: string, data: Record<string, unknown> = {}) => {
      if (typeof window === "undefined") return;
      const axon = (window as any).axon;
      if (typeof axon !== "function") {
        addLog("window.axon is not callable — check pixel status.", "error");
        return;
      }
      axon("track", name, data);
      addLog(`🎯 direct axon("track", "${name}", ${JSON.stringify(data)})`, "success");
    },
    [addLog],
  );

  const handleFireConfigured = useCallback(() => {
    const value = eventValue ? parseFloat(eventValue) : undefined;
    const extra: Record<string, unknown> = {};
    if (value !== undefined && !Number.isNaN(value)) {
      extra.value = value;
      extra.currency = currency;
    }
    if (orderId) extra.orderId = orderId;

    // Axon requires items/currency/value on commerce events — without them the
    // Pixel Helper reports them as NULL Required. Attach the sample cart so a
    // hand-typed commerce event validates the same way the preset buttons do.
    const axonName = previewAxonName(eventName);
    if (COMMERCE_EVENTS.has(axonName)) {
      extra.items = SAMPLE_ITEMS;
      extra.currency = extra.currency ?? currency;
      extra.value = extra.value ?? SAMPLE_CART_VALUE;
      if (axonName === "purchase") {
        extra.shipping = 4.99;
        extra.tax = 3.5;
        extra.user_data = SAMPLE_USER_DATA;
      }
    }

    fireViaSdk(eventName, extra);
  }, [eventName, eventValue, currency, orderId, fireViaSdk]);

  const handleFireConfiguredDirect = useCallback(() => {
    const value = eventValue ? parseFloat(eventValue) : undefined;
    const data: Record<string, unknown> = {};
    if (value !== undefined && !Number.isNaN(value)) {
      data.value = value;
      data.currency = currency;
    }
    if (orderId) {
      data.transaction_id = orderId;
      // dedupe_id must match what the server-side Conversion API sends, or the
      // same order counts twice.
      data.dedupe_id = orderId;
    }
    fireDirect(previewAxonName(eventName), data);
  }, [eventName, eventValue, currency, orderId, fireDirect]);

  /** Reload with an ?aleid= param, imitating a real AppLovin ad click. */
  const simulateClick = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("aleid", `AL_demo_${Date.now()}`);
    window.location.href = url.toString();
  }, []);

  const clearAttribution = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("eiq_aleid");
    document.cookie = "eiq_aleid=; Path=/; Max-Age=0";
    const url = new URL(window.location.href);
    url.searchParams.delete("aleid");
    url.searchParams.delete("eiq_aleid");
    window.location.href = url.toString();
  }, []);

  const clearLog = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readyHandler = (event: Event) => {
      addLog("EventsIQ SDK initialized.", "success");
      const config = (event as CustomEvent).detail?.config;
      const applovin = config?.providers?.applovin;
      if (applovin) {
        addLog(`AppLovin provider configured: ${JSON.stringify(applovin)}`, "success");
      } else {
        addLog(
          "⚠️ No `applovin` provider in the SDK config. Add an Axon Pixel under Tracking → SDK for this site, or the pixel will never load.",
          "warning",
        );
      }
    };

    window.addEventListener("eventsiq:ready", readyHandler);
    const t = setTimeout(() => {
      checkPixelStatus();
      refreshAttribution();
    }, 1500);

    return () => {
      window.removeEventListener("eventsiq:ready", readyHandler);
      clearTimeout(t);
    };
  }, [addLog, checkPixelStatus, refreshAttribution]);

  return (
    <div className="page">
      <h1 className="page-heading">AppLovin (Axon) Pixel Test</h1>
      <p className="page-description">
        Isolated harness for the AppLovin Axon Pixel. Every event here is scoped to the{" "}
        <code>applovin</code> provider only — Facebook, Google, TikTok and Snapchat pixels are
        left alone, so anything in the log came from AppLovin.
      </p>

      <div className="info">
        <strong>Order to test in:</strong>
        <ol>
          <li>
            <strong>Check Pixel Status</strong> — confirm <code>window.axon</code> exists and{" "}
            <code>pixel.js</code> actually loaded.
          </li>
          <li>
            <strong>Simulate AppLovin click</strong> — reloads with <code>?aleid=…</code> so
            attribution has something to match on.
          </li>
          <li>
            <strong>Enable Interceptor</strong> — logs the raw <code>axon()</code> calls.
          </li>
          <li>
            <strong>Fire events</strong> — via the SDK, and directly, to isolate which side a
            problem is on.
          </li>
          <li>
            Verify with the <strong>Axon Pixel Helper</strong> Chrome extension.
          </li>
        </ol>
      </div>

      {/* ── STATUS ─────────────────────────────────────────────────────── */}
      <section className="card">
        <h2>1 · Pixel Status</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button onClick={checkPixelStatus} style={btn("#0070f3")}>
            🔍 Check Pixel Status
          </button>
          <button onClick={toggleIntercept} style={btn(intercepting ? "#ef4444" : "#8b5cf6")}>
            {intercepting ? "⏹ Disable Interceptor" : "🛰️ Enable axon() Interceptor"}
          </button>
        </div>
      </section>

      {/* ── ATTRIBUTION ────────────────────────────────────────────────── */}
      <section className="card">
        <h2>2 · Attribution (aleid)</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          AppLovin appends <code>aleid</code> to the landing-page URL after an ad click. It is the
          strongest identifier the Conversion API matches on, so it must survive into the pixel and
          the server-side event.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <button onClick={refreshAttribution} style={btn("#0070f3")}>
            🔄 Refresh Snapshot
          </button>
          <button onClick={simulateClick} style={btn("#10b981")}>
            🖱️ Simulate AppLovin Click (adds ?aleid)
          </button>
          <button onClick={clearAttribution} style={btn("#6b7280")}>
            🧹 Clear aleid
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
                  Source
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(attribution).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace" }}>
                    {k}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      borderBottom: "1px solid #f3f4f6",
                      fontFamily: "monospace",
                      color: v ? "#065f46" : "#9ca3af",
                    }}
                  >
                    {v ?? "—"}
                  </td>
                </tr>
              ))}
              {Object.keys(attribution).length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: "0.5rem", color: "#666" }}>
                    Click “Refresh Snapshot”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CUSTOM EVENT ───────────────────────────────────────────────── */}
      <section className="card">
        <h2>3 · Fire a Custom Event</h2>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="al-event" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
            Event Name:
          </label>
          <input
            id="al-event"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="purchase"
            style={input}
          />
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
            Axon receives:{" "}
            <code style={{ fontWeight: 700, color: "#065f46" }}>{previewAxonName(eventName)}</code>
            {previewAxonName(eventName) !== eventName && " (auto-mapped)"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: "1 1 120px" }}>
            <label htmlFor="al-value" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Value:
            </label>
            <input id="al-value" type="number" value={eventValue} onChange={(e) => setEventValue(e.target.value)} style={input} />
          </div>
          <div style={{ flex: "1 1 100px" }}>
            <label htmlFor="al-cur" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Currency:
            </label>
            <input id="al-cur" type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} style={input} />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label htmlFor="al-order" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Order / Transaction ID:
            </label>
            <input id="al-order" type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} style={input} />
          </div>
        </div>

        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
          The Order ID doubles as <code>dedupe_id</code>. It must match the{" "}
          <code>dedupe_id</code> your server-side Conversion API workflow sends, or the same order
          is counted twice.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button onClick={handleFireConfigured} style={btn("#0070f3")}>
            📤 Fire via SDK (applovin only)
          </button>
          <button onClick={handleFireConfiguredDirect} style={btn("#f59e0b")}>
            🎯 Fire direct axon() — bypass SDK
          </button>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#666", marginTop: "0.75rem" }}>
          If <em>direct</em> works but <em>SDK</em> doesn’t, the problem is in the SDK wiring. If
          neither works, the pixel itself never loaded.
        </p>
      </section>

      {/* ── STANDARD EVENTS ────────────────────────────────────────────── */}
      <section className="card">
        <h2>4 · Standard Axon Events</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Axon uses lowercase snake_case — the inverse of Snapchat’s UPPERCASE convention. Each
          button fires through the SDK, scoped to AppLovin, and carries the parameters the Axon
          Pixel Helper expects for that event type (commerce events include a sample cart;{" "}
          <code>purchase</code> also sends shipping, tax and user_data).
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {AXON_STANDARD_EVENTS.map((e) => (
            <button
              key={e.name}
              title={e.desc}
              onClick={() => fireViaSdk(e.name, e.data())}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#f3f4f6",
                color: "#1f2937",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              {e.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── LOG ────────────────────────────────────────────────────────── */}
      <div className="card">
        <h3>Event Log</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <button onClick={clearLog} style={{ ...btn("#ef4444"), padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Clear Log
          </button>
        </div>
        <div className="log-panel" ref={logRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
          {logs.length === 0 && <p style={{ color: "#666" }}>No events yet.</p>}
          {logs.map((entry) => (
            <div key={entry.id} className={`log-entry log-${entry.type}`}>
              [{new Date(entry.id).toLocaleTimeString()}] {entry.message}
            </div>
          ))}
        </div>
      </div>

      <section
        className="card"
        style={{ marginTop: "2rem", backgroundColor: "#e0f2fe", border: "1px solid #0ea5e9" }}
      >
        <h3 style={{ marginTop: 0, color: "#0c4a6e" }}>ℹ️ Notes &amp; gotchas</h3>
        <ul style={{ color: "#0c4a6e", margin: 0, paddingLeft: "1.5rem" }}>
          <li>
            <strong>One pixel per page.</strong> Axon bakes the key into a single global{" "}
            <code>axon.eventKey</code>, so unlike fbq/snaptr it cannot run multiple pixels. Extra
            configured keys are ignored with a console warning.
          </li>
          <li>
            <strong>page_view is automatic.</strong> The SDK’s auto-tracking fires it; the loader
            deliberately does not, or every page view would double-count.
          </li>
          <li>
            <strong>Buffered calls are normal.</strong> Before <code>pixel.js</code> arrives, calls
            queue in <code>axon.operationQueue</code> and flush on load — an event fired immediately
            after page load is not lost.
          </li>
          <li>
            <strong>Event key ≠ Pixel ID.</strong> The client pixel uses the{" "}
            <code>AXON_EVENT_KEY</code>; the server-side Conversion API uses a separate{" "}
            <code>pixel_id</code> plus its own API key.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default AppLovinTestPageContent;
