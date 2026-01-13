import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CloverLogo from "./assets/clover_.png";
import { AppStatus, ScanResult, TobaccoProduct } from "./types";
import { CSV_DATA } from "./constants";

/* ----------------------------------------
   BARCODE NORMALIZATION
----------------------------------------- */
function barcodeKeys(raw: string): string[] {
  const digits = (raw ?? "").toString().replace(/\D/g, "");
  if (!digits) return [];

  const keys = new Set<string>();
  const add = (v: string) => v && keys.add(v);

  add(digits);

  if (digits.length === 14) {
    add(digits.replace(/^0+/, ""));
    add(digits.slice(1));
    add(digits.slice(2));
  }

  if (digits.length === 13 && digits.startsWith("0")) {
    add(digits.slice(1));
  }

  if (digits.length === 12) {
    add("0" + digits);
  }

  if (digits.length >= 8 && digits.length <= 11) {
    const upc12 = digits.padStart(12, "0");
    add(upc12);
    add("0" + upc12);
  }

  return Array.from(keys).filter(k => k.length >= 8 && k.length <= 14);
}

/* ----------------------------------------
   CSV PARSING
----------------------------------------- */
function parseCSV(csv: string): Map<string, TobaccoProduct> {
  const map = new Map<string, TobaccoProduct>();
  const rows = csv.trim().split("\n").slice(1);

  for (const row of rows) {
    const cols = row.split(",");

    const product: TobaccoProduct = {
      manufacturer: cols[0]?.trim() || "",
      tradeName: cols[1]?.trim() || "",
      upc: cols[2]?.trim() || "",
      productType: cols[3]?.trim() || "",
      cartonUpc: cols[4]?.trim() || ""
    };

    for (const key of barcodeKeys(product.upc)) {
      map.set(key, product);
    }

    for (const key of barcodeKeys(product.cartonUpc)) {
      map.set(key, product);
    }
  }

  return map;
}

/* ----------------------------------------
   APP
----------------------------------------- */
export default function App() {
  const products = useMemo(() => parseCSV(CSV_DATA), []);
  const [status, setStatus] = useState<AppStatus>(AppStatus.READY);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const scannerRef = useRef<any>(null);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop?.();
      scannerRef.current = null;
    }
  };

  const handleScan = useCallback(
    (decodedText: string) => {
      const keys = barcodeKeys(decodedText);
      let product: TobaccoProduct | undefined;

      for (const key of keys) {
        const found = products.get(key);
        if (found) {
          product = found;
          break;
        }
      }

      const result: ScanResult = {
        code: keys[0] || decodedText,
        timestamp: new Date(),
        isApproved: !!product,
        product
      };

      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 49)]);
      setStatus(AppStatus.RESULT);
      stopScanner();
    },
    [products]
  );

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-white shadow flex items-center justify-between px-4 py-3">
        <div className="w-10 h-10">
          <img src={CloverLogo} alt="4LEAF Clover" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-black text-slate-900 tracking-wide">Tobacco Checker</h1>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center p-6">
        {status === AppStatus.RESULT && lastResult && (
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
            <div
              className={`text-white font-black text-lg py-2 rounded-md mb-4 ${
                lastResult.isApproved ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {lastResult.isApproved ? "APPROVED" : "RESTRICTED"}
            </div>

            {lastResult.product && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Trade Name
                </p>
                <h4 className="font-black text-slate-900 text-lg leading-tight mt-1">
                  {lastResult.product.tradeName}
                </h4>

                <p className="text-sm text-slate-600 mt-2">
                  {lastResult.product.manufacturer}
                </p>
              </>
            )}

            <button
              onClick={() => setStatus(AppStatus.READY)}
              className="mt-6 w-full bg-slate-900 text-white font-bold py-2 rounded-lg"
            >
              Scan Another Item
            </button>
          </div>
        )}

        {status === AppStatus.READY && (
          <div className="text-center">
            <button
              onClick={() => setStatus(AppStatus.SCANNING)}
              className="bg-slate-900 text-white font-bold px-6 py-3 rounded-lg"
            >
              Start Scan
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
