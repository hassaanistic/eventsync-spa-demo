"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LogEntry {
  id: number;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

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
  {
    id: "prod_watch",
    name: "Smart Watch",
    price: 299.99,
  },
];

const CheckoutPageContent = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(demoProducts[0]);
  const [quantity, setQuantity] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), message, type },
      ]);
    },
    []
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

  const sendPurchase = useCallback(
    (product: {
      id: string;
      name: string;
      price: number;
      quantity?: number;
    }) => {
      if (!sdkReady()) return;
      const qty = product.quantity ?? quantity;
      const timestamp = Date.now();
      const orderId = `order_${timestamp}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Send the purchase event
      window.EventsIQ!.sendEvent!({
        eventName: "Purchase",
        eventType: "interaction",
        additionalData: {
          value: product.price * qty,
          currency: "USD",
          orderId: orderId,
          contents: [
            {
              id: product.id,
              quantity: qty,
              item_price: product.price,
              name: product.name,
            },
          ],
          num_items: qty,
          product_category: "Demo",
        },
      });
      
      addLog(
        `✅ Purchase event sent: ${product.name} (Qty: ${qty}, Order ID: ${orderId})`,
        "success"
      );

      // Navigate to a new URL with unique timestamp to avoid duplicate detection
      // This makes each event fire on a different URL
      const newUrl = `/checkout?t=${timestamp}&order=${orderId}`;
      addLog(`🔄 Navigating to: ${newUrl}`, "info");
      
      // Use setTimeout to ensure event is sent before navigation
      setTimeout(() => {
        router.push(newUrl);
      }, 100);
    },
    [addLog, sdkReady, quantity, router]
  );

  const handleTestPurchase = useCallback(() => {
    sendPurchase({ ...selectedProduct, quantity });
  }, [sendPurchase, selectedProduct, quantity]);

  const handleTestMultiplePurchases = useCallback(() => {
    if (!sdkReady()) return;
    
    addLog(
      `🔄 Sending ${demoProducts.length} purchase events (staggered)...`,
      "info"
    );
    
    // Send multiple purchase events with different order IDs
    const timestamp = Date.now();
    let completedCount = 0;
    
    demoProducts.forEach((product, index) => {
      setTimeout(() => {
        const qty = 1;
        const orderId = `order_${timestamp + index}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        window.EventsIQ!.sendEvent!({
          eventName: "Purchase",
          eventType: "interaction",
          additionalData: {
            value: product.price * qty,
            currency: "USD",
            orderId: orderId,
            contents: [
              {
                id: product.id,
                quantity: qty,
                item_price: product.price,
                name: product.name,
              },
            ],
            num_items: qty,
            product_category: "Demo",
          },
        });
        
        addLog(
          `✅ Purchase event sent: ${product.name} (Order ID: ${orderId})`,
          "success"
        );
        
        completedCount++;
        
        // Navigate after all events are sent
        if (completedCount === demoProducts.length) {
          const newUrl = `/checkout?t=${timestamp}&multi=true`;
          addLog(`🔄 All events sent. Navigating to: ${newUrl}`, "info");
          setTimeout(() => {
            router.push(newUrl);
          }, 200);
        }
      }, index * 500); // Stagger by 500ms
    });
  }, [addLog, sdkReady, router]);

  return (
    <div className="page">
      <h1 className="page-heading">Checkout - Purchase Event Testing</h1>
      <p className="page-description">
        Test Snapchat Purchase events. Each purchase will send an event and automatically navigate to a unique URL with a timestamp to avoid duplicate detection.
      </p>

      <section className="card">
        <h2>Select Product & Quantity</h2>
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="product-select"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Product:
          </label>
          <select
            id="product-select"
            value={selectedProduct.id}
            onChange={(e) => {
              const product = demoProducts.find((p) => p.id === e.target.value);
              if (product) setSelectedProduct(product);
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          >
            {demoProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.price}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="quantity-input"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Quantity:
          </label>
          <input
            id="quantity-input"
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleTestPurchase}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#0051cc")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#0070f3")
            }
          >
            🛒 Test Purchase Event
          </button>

          <button
            onClick={handleTestMultiplePurchases}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#059669")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#10b981")
            }
          >
            🔄 Test Multiple Purchases
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Purchase Event Details</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.9rem",
          }}
        >
          <div>
            <strong>Event Name:</strong> Purchase
          </div>
          <div>
            <strong>Event Type:</strong> interaction
          </div>
          <div>
            <strong>Product:</strong> {selectedProduct.name}
          </div>
          <div>
            <strong>Price:</strong> ${selectedProduct.price}
          </div>
          <div>
            <strong>Quantity:</strong> {quantity}
          </div>
          <div>
            <strong>Total Value:</strong> $
            {(selectedProduct.price * quantity).toFixed(2)}
          </div>
          <div>
            <strong>Currency:</strong> USD
          </div>
          <div>
            <strong>Order ID:</strong> Generated on each purchase (unique)
          </div>
        </div>
      </section>

      <div className="card">
        <h3>Event Log</h3>
        <div
          className="log-panel"
          ref={logRef}
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {logs.length === 0 && (
            <p style={{ color: "#666" }}>
              No events sent yet. Click the button above to test.
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
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#856404" }}>ℹ️ Testing Notes</h3>
        <ul style={{ color: "#856404", margin: 0, paddingLeft: "1.5rem" }}>
          <li>
            <strong>Automatic URL Change:</strong> After sending an event, the page automatically navigates to a unique URL with a timestamp (e.g., <code>/checkout?t=1734456000000</code>)
          </li>
          <li>
            This ensures each event fires on a different URL, preventing Snapchat's duplicate detection
          </li>
          <li>Each purchase event has a unique order ID and unique URL timestamp</li>
          <li>
            Snapchat will track these as <code>PURCHASE</code> events (uppercase)
          </li>
          <li>
            Check your Snapchat Pixel dashboard to verify events are being received without duplicate warnings
          </li>
        </ul>
      </section>
    </div>
  );
};

export default CheckoutPageContent;
