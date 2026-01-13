import CSV_TEXT from "./utl-2026-01-12.csv?raw";
// src/constants.ts
import Papa from "papaparse";
import type { TobaccoProduct } from "./types";

// ✅ Put your CSV file in: src/utl-2026-01-12.csv
// or change the filename/path below to match your repo
import CSV_TEXT from "./utl-2026-01-12.csv?raw";

export const CSV_DATA = CSV_TEXT;

/* -----------------------------
   Barcode helpers
------------------------------ */

/** Expand scientific notation like "8.79982001196E+11" -> "879982001196"
 *  NOTE: If the CSV is rounded like "8.79982E+11", the missing digits are lost in the CSV.
 */
function expandScientific(raw: string): string {
  const s = (raw ?? "").toString().trim();
  if (!s) return "";

  const v = s.replace(/^"|"$/g, "").trim();
  const cleaned = v.replace(/\s+/g, "");

  const m = cleaned.match(/^([+-]?\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);
  if (!m) return cleaned;

  const mantissa = m[1];
  const exp = parseInt(m[2], 10);

  const unsigned = mantissa.replace(/^[+-]/, "");
  const parts = unsigned.split(".");
  const intPart = parts[0] || "0";
  const fracPart = parts[1] || "";

  const digits = (intPart + fracPart).replace(/^0+/, "") || "0";
  const shift = exp - fracPart.length;

  if (shift < 0) return digits; // barcodes shouldn't be decimals
  return digits + "0".repeat(shift);
}

/** Clean a CSV cell into digits-only barcode */
function cleanCsvBarcode(raw: string): string {
  const expanded = expandScientific(raw);
  return expanded.replace(/\D/g, "");
}

/** Normalize one barcode into multiple keys (UPC-A, EAN-13, GTIN-14 variants) */
function barcodeKeys(raw: string): string[] {
  const digits = (raw ?? "").toString().replace(/\D/g, "");
  if (!digits) return [];

  const keys = new Set<string>();
  const add = (v: string) => v && keys.add(v);

  add(digits);

  // GTIN-14 -> also try stripping leading zeros / digits
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

  // shorter codes (common when Excel strips leading zeros)
  if (digits.length >= 8 && digits.length <= 11) {
    const upc12 = digits.padStart(12, "0");
    add(upc12);
    add("0" + upc12);
  }

  return Array.from(keys).filter((k) => k.length >= 8 && k.length <= 14);
}

/* -----------------------------
   CSV parsing
------------------------------ */

function getField(row: Record<string, any>, ...keys: string[]): string {
  for (const k of keys) {
    const val = row[k];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

/**
 * Returns a lookup Map where ANY match in:
 *  - UPC
 *  - UPC (Carton or Roll)
 * is considered APPROVED
 */
export function parseCSV(csv: string): Map<string, TobaccoProduct> {
  const lookup = new Map<string, TobaccoProduct>();

  const parsed = Papa.parse<Record<string, any>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors?.length) {
    // Don’t crash the app; log for debugging
    console.warn("CSV parse warnings:", parsed.errors);
  }

  for (const row of parsed.data) {
    // Handle slight header variations safely
    const manufacturer = getField(row, "Manufacturer", "manufacturer");
    const tradeName = getField(row, "Trade Name", "TradeName", "tradeName", "trade name");
    const productType = getField(
      row,
      "Packaging/Brand Style",
      "Packaging Brand Style",
      "productType",
      "Product Type",
      "type"
    );

    // ✅ APPROVED sources (columns C & E in your file)
    const upc = cleanCsvBarcode(getField(row, "UPC", "upc"));
    const cartonUpc = cleanCsvBarcode(getField(row, "UPC (Carton or Roll)", "UPC Carton or Roll", "cartonUpc"));

    // If both are blank, skip row
    if (!upc && !cartonUpc) continue;

    const product: TobaccoProduct = {
      manufacturer,
      tradeName,
      upc,
      cartonUpc,
      productType,
    };

    // ✅ Add both UPC columns to lookup using normalized keys
    for (const k of barcodeKeys(upc)) lookup.set(k, product);
    for (const k of barcodeKeys(cartonUpc)) lookup.set(k, product);
  }

  return lookup;
}
