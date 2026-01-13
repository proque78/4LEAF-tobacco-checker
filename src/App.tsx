import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TobaccoProduct, ScanResult, AppStatus } from "./types";
import { CSV_DATA, parseCSV } from "./constants";
import {
  Camera,
  History,
  ShieldCheck,
  AlertCircle,
  X,
  RefreshCw,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

import CloverLogo from "./assets/clover_.png";

/** Normalize a barcode into multiple matching keys (UPC-A 12, EAN-13, GTIN-14, leading zeros, etc.) */
function barcodeKeys(raw: string): string[] {
  const digits = (raw ?? "").toString().replace(/\D/g, "");
  if (!digits) return [];

  const keys = new Set<string>();
  const add = (v: string) => v && keys.add(v);

  add(digits);

  // GTIN-14 -> try stripping leading zeros / leading digits
  if (digits.length === 14) {
    add(digits.replace(/^0+/, ""));
    add(digits.slice(1));
    add(digits.slice(2));
  }

  // EAN-13 starting with 0 -> UPC-A
  if (digits.length === 13 && digits.startsWith("0")) {
    add(digits.slice(1));
  }

  // UPC-A -> EAN-13
  if (digits.length === 12) {
    add("0" + digits);
  }

  // Short codes (common when Excel strips zeros) -> pad to 12
  if (digits.length >= 8 && digits.length <= 11) {
    const upc12 = digits.padStart(12, "0");
    add(upc12);
    add("0" + upc12);
  }

  return Array.from(keys).filter((k) => k.length >= 8 && k.length <= 14);
}

/** Build a lookup map where ANY UPC field is considered approved */
function buildApprovedLookupFromCSV(csv: string): Map<string, TobaccoProduct> {
  const rawMap = parseCSV(csv); // your existing parser (tradeName, manufacturer, upc, cartonUpc, etc.)
  const lookup = new Map<string, TobaccoProduct>();

  // rawMap contains keys as upc/cartonUpc, but we want *normalized* keys for BOTH fields
  for (const product of rawMap.values()) {
    for (const k of barcodeKeys(product.upc)) lookup.set(k, product);
    for (const k of barcodeKeys(product.cartonUpc)) lookup.set(k, product);
  }

  return lookup;
}

const App: React.FC = () => {
  const products = useMemo(() => buildApprovedLookupFromCSV(CSV_DATA), []);

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);

  const saveHistory = useCallback((newHistory: ScanResult[]) => {
    setHistory(newHistory);
    localStorage.setItem("tobacco_scan_history", JSON.stringify(newHistory));
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem("tobacco_scan_history");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(
          parsedHistory.map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          }))
        );
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current.clear())
        .catch((err: any) => console.error(err));
      scannerRef.current = null;
    }
  }, []);

  const handleScan = useCallback(
    (decodedText: string) => {
      const keys = barcodeKeys(decodedText);

      let product: TobaccoProduct | undefined = undefined;
      for (const k of keys) {
        const found = products.get(k);
        if (found) {
          product = found;
          break;
        }
      }

      const result: ScanResult = {
        code: keys[0] ?? decodedText.replace(/\D/g, ""),
        timestamp: new Date(),
        isApproved: !!product,
        product,
      };

      setLastResult(result);
      saveHistory([result, ...history.slice(0, 49)]);
      setStatus(AppStatus.RESULT);
      stopScanner();
    },
    [products, history, saveHistory, stopScanner]
  );

  const startScanner = useCallback(async () => {
    setStatus(AppStatus.SCANNING);
    setCameraError(null);

    // Give React time to render the scanner container
    setTimeout(() => {
      const Html5QrcodeCtor = (window as any).Html5Qrcode;
      if (!Html5QrcodeCtor) {
        setCameraError(
          "Scanner library not loaded. Confirm html5-qrcode script is in index.html."
        );
        setStatus(AppStatus.IDLE);
        return;
      }

      const html5QrCode = new Html5QrcodeCtor("scanner-container");
      scannerRef.current = html5QrCode;

      const config = { fps: 20, qrbox: { width: 280, height: 180 } };

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => handleScan(decodedText),
          () => {}
        )
        .catch((err: any) => {
          console.error("Camera access failed", err);
          setCameraError(
            "Camera access denied. Use HTTPS and allow camera permission in your browser."
          );
          setStatus(AppStatus.IDLE);
        });
    }, 100);
  }, [handleScan]);

  const reset = useCallback(() => {
    stopScanner();
    setCameraError(null);
    setLastResult(null);
    setStatus(AppStatus.IDLE);
  }, [stopScanner]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="max-w-xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center overflow-hidden">
            <img
              src={CloverLogo}
              alt="4LEAF Clover"
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div>
            <div className="text-sm font-black tracking-wide text-slate-900">
              Tobacco Scout
            </div>
            <div className="text-xs text-slate-500">UPC Approval Checker</div>
          </div>
        </div>

        <button
          onClick={() =>
            setStatus((s) => (s === AppStatus.HISTORY ? AppStatus.IDLE : AppStatus.HISTORY))
          }
          className="inline-flex items-center gap-2 rounded-xl bg-white shadow px-3 py-2 text-sm font-bold"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 pb-10">
        {/* Error */}
        {cameraError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">{cameraError}</div>
              <button onClick={() => setCameraError(null)} className="ml-auto">
                <X className="w-4 h-4 text-red-700" />
              </button>
            </div>
          </div>
        )}

        {/* IDLE */}
        {status === AppStatus.IDLE && (
          <div className="rounded-3xl bg-white shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-lg">Ready to Scan</div>
                <div className="text-sm text-slate-500">
                  Scan UPCs to check if the product is approved.
                </div>
              </div>
            </div>

            <button
              onClick={startScanner}
              className="mt-6 w-full rounded-2xl bg-slate-900 text-white py-3 font-black"
            >
              Start Scan
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Smartphone className="w-4 h-4" />
              Use your rear camera for best results.
            </div>
          </div>
        )}

        {/* SCANNING */}
        {status === AppStatus.SCANNING && (
          <div className="rounded-3xl bg-white shadow overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-black">Scanning…</div>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>

            {/* This container is REQUIRED for html5-qrcode */}
            <div className="p-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900">
                <div
                  id="scanner-container"
                  className="w-full"
                  style={{ minHeight: 380 }}
                />

                {/* overlay badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-xl bg-black/50 text-white px-3 py-2 text-xs font-bold">
                  <img
                    src={CloverLogo}
                    className="w-5 h-5 opacity-90"
                    alt="4LEAF Clover"
                  />
                  Camera Active
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Tip: hold steady and fill the box with the barcode.
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {status === AppStatus.RESULT && lastResult && (
          <div className="rounded-3xl bg-white shadow p-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  lastResult.isApproved ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {lastResult.isApproved ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="font-black text-lg">
                  {lastResult.isApproved ? "APPROVED" : "RESTRICTED"}
                </div>
                <div className="text-xs text-slate-500">
                  Scanned: <span className="font-mono">{lastResult.code}</span>
                </div>
              </div>
            </div>

            {lastResult.product && (
              <div className="mt-5 rounded-2xl bg-slate-50 border p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Trade Name
                </p>
                <h4 className="font-black text-slate-900 text-lg leading-tight mt-1">
                  {lastResult.product.tradeName}
                </h4>

                <p className="text-sm text-slate-600 mt-2">
                  {lastResult.product.manufacturer}
                </p>

                {lastResult.product.productType && (
                  <div className="mt-3 text-xs text-slate-500">
                    Type: <span className="font-bold">{lastResult.product.productType}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setStatus(AppStatus.IDLE)}
                className="rounded-2xl bg-slate-900 text-white py-3 font-black"
              >
                Scan Another
              </button>
              <button
                onClick={reset}
                className="rounded-2xl bg-white border py-3 font-black text-slate-900 inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {status === AppStatus.HISTORY && (
          <div className="rounded-3xl bg-white shadow p-6">
            <div className="flex items-center justify-between">
              <div className="font-black text-lg">Scan History</div>
              <button
                onClick={() => {
                  saveHistory([]);
                }}
                className="text-sm font-bold text-slate-600"
              >
                Clear
              </button>
            </div>

            {history.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500">
                No scans yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border p-3 flex items-start gap-3"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                        h.isApproved ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {h.isApproved ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-black">
                        {h.isApproved ? "APPROVED" : "RESTRICTED"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {h.code}
                      </div>
                      {h.product?.tradeName && (
                        <div className="text-xs text-slate-700 mt-1">
                          {h.product.tradeName}
                        </div>
                      )}
                      {h.product?.manufacturer && (
                        <div className="text-[11px] text-slate-500">
                          {h.product.manufacturer}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {new Date(h.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStatus(AppStatus.IDLE)}
              className="mt-6 w-full rounded-2xl bg-slate-900 text-white py-3 font-black"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
