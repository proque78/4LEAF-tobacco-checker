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

  // rawMap contains keys as
