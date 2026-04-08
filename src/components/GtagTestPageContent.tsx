"use client";

import { useCallback, useState, useRef, useEffect } from "react";

interface LogEntry {
  id: number;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

// Google Ads conversion labels from your account
const conversionActions = [
  {
    name: "Submit Form",
    conversionLabel: "AW-16684506815/oyRyCMyardMZEL-95ZM-",
    description: "Submit Form conversion action",
  },
  {
    name: "Page Views",
    conversionLabel: "AW-16684506815/pROrCMaardMZEL-95ZM-",
    description: "Page Views conversion action",
  },
  {
    name: "Page View - 2X",
    conversionLabel: "AW-16684506815/Mni3CMmardMZEL-95ZM-",
    description: "Page View - 2X conversion action",
  },
  {
    name: "Submit Form - 15k",
    conversionLabel: "AW-16684506815/ipS1CM-ardMZEL-95ZM-",
    description: "Submit Form - 15k conversion action",
  },
  {
    name: "Callfire",
    conversionLabel: "AW-16684506815/WdYyCNKardMZEL-95ZM-",
    description: "Callfire conversion action",
  },
  {
    name: "Callfire - 15k",
    conversionLabel: "AW-16684506815/LTLpCNWardMZEL-95ZM-",
    description: "Callfire - 15k conversion action",
  },
];

const GtagTestPageContent = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedConversion, setSelectedConversion] = useState(
    conversionActions[0],
  );
  const [eventName, setEventName] = useState("Purchase");
  const [eventValue, setEventValue] = useState("100");
  const [customSendTo, setCustomSendTo] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

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

  const sdkReady = useCallback(() => {
    if (typeof window === "undefined" || !window.EventsIQ?.sendEvent) {
      addLog("SDK not ready. Wait a moment and try again.", "error");
      return false;
    }
    return true;
  }, [addLog]);

  const checkGtagStatus = useCallback(() => {
    if (typeof window === "undefined") return;

    const gtag = (window as any).gtag;
    const dataLayer = (window as any).dataLayer;

    if (gtag) {
      addLog("✅ Google Tag (gtag.js) is loaded and available", "success");
      addLog(`gtag function type: ${typeof gtag}`, "info");

      // Check dataLayer
      if (dataLayer && Array.isArray(dataLayer)) {
        addLog(
          `✅ dataLayer exists with ${dataLayer.length} entries`,
          "success",
        );
        if (dataLayer.length > 0) {
          addLog(
            `Last dataLayer entry: ${JSON.stringify(dataLayer[dataLayer.length - 1])}`,
            "info",
          );
        }
      } else {
        addLog("⚠️ dataLayer not found", "warning");
      }
    } else {
      addLog(
        "❌ Google Tag (gtag.js) not found. Make sure it's initialized.",
        "error",
      );
    }
  }, [addLog]);

  const sendGtagEvent = useCallback(
    (conversionLabel: string, eventNameValue: string, value?: number) => {
      if (!sdkReady()) return;

      const additionalData: Record<string, any> = {
        send_to: conversionLabel,
      };

      if (value !== undefined) {
        additionalData.value = value;
        additionalData.currency = "USD";
      }

      window.EventsIQ!.sendEvent!({
        eventName: eventNameValue,
        eventType: "interaction",
        additionalData,
      });

      addLog(
        `✅ Event sent: ${eventNameValue} with send_to: ${conversionLabel}${value ? `, value: $${value}` : ""}`,
        "success",
      );
    },
    [addLog, sdkReady],
  );

  const handleSendWithSelectedConversion = useCallback(() => {
    const value = eventValue ? parseFloat(eventValue) : undefined;
    sendGtagEvent(selectedConversion.conversionLabel, eventName, value);
  }, [selectedConversion, eventName, eventValue, sendGtagEvent]);

  const handleSendWithCustomSendTo = useCallback(() => {
    if (!customSendTo.trim()) {
      addLog("❌ Please enter a custom send_to value", "error");
      return;
    }
    const value = eventValue ? parseFloat(eventValue) : undefined;
    sendGtagEvent(customSendTo.trim(), eventName, value);
  }, [customSendTo, eventName, eventValue, sendGtagEvent, addLog]);

  const handleSendConversionEvent = useCallback(() => {
    if (!sdkReady()) return;
    const value = eventValue ? parseFloat(eventValue) : undefined;

    window.EventsIQ!.sendEvent!({
      eventName: "conversion",
      eventType: "interaction",
      additionalData: {
        send_to: selectedConversion.conversionLabel,
        value: value,
        currency: "USD",
      },
    });

    addLog(
      `✅ Conversion event sent with send_to: ${selectedConversion.conversionLabel}${value ? `, value: $${value}` : ""}`,
      "success",
    );
  }, [selectedConversion, eventValue, addLog, sdkReady]);

  const handleSendSalesOffline = useCallback(() => {
    if (!sdkReady()) return;

    window.EventsIQ!.sendEvent!({
      eventName: "Sales",
      eventType: "interaction",
      additionalData: {
        send_to: "7507920695",
        value: 150.0,
        currency: "USD",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        city: "New York",
        countryCode: "US",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
    });

    addLog("🚀 Offline Sales event sent for ID: 7507920695", "success");
  }, [addLog, sdkReady]);

  const clearLog = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readyHandler = (event: Event) => {
      addLog("EventsIQ SDK initialized successfully!", "success");
      const config = (event as CustomEvent).detail?.config;
      if (config?.providers?.google) {
        addLog(
          `Google provider configured: ${JSON.stringify(config.providers.google)}`,
          "info",
        );
      }
    };

    const beforeSendHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail?.payload;
      if (detail?.additionalData?.send_to) {
        addLog(
          `📤 beforeSend: ${detail.eventName} with send_to: ${detail.additionalData.send_to}`,
          "info",
        );
      }
    };

    window.addEventListener("eventsiq:ready", readyHandler);
    window.addEventListener("eventsiq:beforeSend", beforeSendHandler);

    const timeout = setTimeout(() => {
      checkGtagStatus();
    }, 1500);

    return () => {
      window.removeEventListener("eventsiq:ready", readyHandler);
      window.removeEventListener("eventsiq:beforeSend", beforeSendHandler);
      clearTimeout(timeout);
    };
  }, [addLog, checkGtagStatus]);

  return (
    <div className="page">
      <h1 className="page-heading">Google Tag (gtag.js) Test Page</h1>
      <p className="page-description">
        Test Google Ads conversion tracking with conversion labels. Use the form
        below to send events with different conversion labels.
      </p>

      <div className="info">
        <strong>How to test:</strong>
        <ol>
          <li>
            <strong>Check Status:</strong> Click "Check gtag Status" to verify
            Google Tag is loaded
          </li>
          <li>
            <strong>Select Conversion:</strong> Choose a conversion action from
            the dropdown
          </li>
          <li>
            <strong>Send Event:</strong> Click "Send Event with Selected
            Conversion" to fire an event with the conversion label
          </li>
          <li>
            <strong>Custom send_to:</strong> Or enter a custom conversion label
            and test with that
          </li>
          <li>
            <strong>Monitor:</strong> Watch the log panel and browser console to
            see events being sent
          </li>
        </ol>
      </div>

      <section className="card">
        <h2>Google Tag Status</h2>
        <button
          onClick={checkGtagStatus}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Check gtag Status
        </button>
      </section>

      <section className="card">
        <h2>Send Event with Conversion Label</h2>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="event-name"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Event Name:
          </label>
          <input
            id="event-name"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Purchase, conversion, etc."
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="event-value"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Event Value (optional):
          </label>
          <input
            id="event-value"
            type="number"
            value={eventValue}
            onChange={(e) => setEventValue(e.target.value)}
            placeholder="100"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="conversion-select"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Select Conversion Action:
          </label>
          <select
            id="conversion-select"
            value={selectedConversion.conversionLabel}
            onChange={(e) => {
              const action = conversionActions.find(
                (a) => a.conversionLabel === e.target.value,
              );
              if (action) setSelectedConversion(action);
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          >
            {conversionActions.map((action) => (
              <option
                key={action.conversionLabel}
                value={action.conversionLabel}
              >
                {action.name} - {action.conversionLabel}
              </option>
            ))}
          </select>
          <p
            style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}
          >
            {selectedConversion.description}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <button
            onClick={handleSendWithSelectedConversion}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            📤 Send Event with Selected Conversion
          </button>
          <button
            onClick={handleSendConversionEvent}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            🎯 Send Conversion Event
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Custom send_to Value</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Enter a custom conversion label to test (format:
          AW-XXXXXXXXX/YYYYYYYYYYYYYYYYYYYYYYYYYYY-)
        </p>
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            value={customSendTo}
            onChange={(e) => setCustomSendTo(e.target.value)}
            placeholder="AW-16684506815/oyRyCMyardMZEL-95ZM-"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
              fontFamily: "monospace",
            }}
          />
        </div>
        <button
          onClick={handleSendWithCustomSendTo}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          📤 Send Event with Custom send_to
        </button>
      </section>

      <section className="card">
        <h2>Quick Test Buttons</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Quick test buttons for common conversion events
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {conversionActions.map((action) => (
            <button
              key={action.conversionLabel}
              onClick={() =>
                sendGtagEvent(action.conversionLabel, "Purchase", 100)
              }
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#f3f4f6",
                color: "#1f2937",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {action.name}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Send Event to Multiple Accounts</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Send the same event to multiple Google Ads accounts using an array of
          conversion labels. The SDK will automatically route each conversion
          label to its matching account.
        </p>
        <button
          onClick={() => {
            if (!sdkReady()) return;

            // Example: Send to two different accounts with their conversion labels
            const conversionLabels = [
              "AW-16684506815/oyRyCMyardMZEL-95ZM-", // Account 1: Submit Form
              "AW-16956379323/zwH1CPSxr8saELuht5U_", // Account 2: Submit lead form
            ];

            window.EventsIQ!.sendEvent!({
              eventName: "Purchase",
              eventType: "interaction",
              additionalData: {
                send_to: conversionLabels, // Array of conversion labels
                value: 100,
                currency: "USD",
              },
            });

            addLog(
              `✅ Event sent to multiple accounts: ${conversionLabels.length} conversion labels`,
              "success",
            );
            addLog(
              `   Labels: ${conversionLabels.map((l) => l.split("/")[0]).join(", ")}`,
              "info",
            );
          }}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          📤 Send to Multiple Accounts (Array)
        </button>
      </section>

      <section
        className="card"
        style={{ border: "2px solid #10b981", backgroundColor: "#f0fdf4" }}
      >
        <h2 style={{ color: "#065f46" }}>🎯 Test Your Offline Sales</h2>
        <p
          style={{
            marginBottom: "1rem",
            color: "#065f46",
            fontSize: "0.875rem",
          }}
        >
          This button sends the exact <strong>Sales</strong> event with ID{" "}
          <strong>7507920695</strong> mapped in your workflow.
        </p>
        <button
          onClick={handleSendSalesOffline}
          style={{
            padding: "1rem 2rem",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          💰 Fire Offline Sales Event
        </button>
      </section>

      <div className="card">
        <h3>Event Log</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <button
            onClick={clearLog}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Clear Log
          </button>
        </div>
        <div
          className="log-panel"
          ref={logRef}
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {logs.length === 0 && (
            <p style={{ color: "#666" }}>
              No events sent yet. Click the buttons above to test.
            </p>
          )}
          {logs.map((entry) => (
            <div key={entry.id} className={`log-entry log-${entry.type}`}>
              [{new Date(entry.id).toLocaleTimeString()}] {entry.message}
            </div>
          ))}
        </div>
      </div>

      <section
        className="card"
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#e0f2fe",
          border: "1px solid #0ea5e9",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#0c4a6e" }}>ℹ️ Testing Notes</h3>
        <ul style={{ color: "#0c4a6e", margin: 0, paddingLeft: "1.5rem" }}>
          <li>
            <strong>Conversion Labels:</strong> Each conversion action has a
            unique label format: <code>AW-ACCOUNT_ID/CONVERSION_LABEL</code>
          </li>
          <li>
            <strong>send_to Parameter:</strong> The <code>send_to</code>{" "}
            parameter in <code>additionalData</code> tells Google Tag which
            conversion action to track
          </li>
          <li>
            <strong>Browser Console:</strong> Open your browser's developer
            console to see gtag events being fired
          </li>
          <li>
            <strong>Google Tag Assistant:</strong> Use the Google Tag Assistant
            Chrome extension to verify events are being sent correctly
          </li>
          <li>
            <strong>Event Verification:</strong> Check your Google Ads account
            to verify conversions are being tracked
          </li>
        </ul>
      </section>
    </div>
  );
};

export default GtagTestPageContent;
