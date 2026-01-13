// src/csvBarcode.ts

// Expands strings like "8.79982001196E+11" into "879982001196"
// If it's rounded like "8.79982E+11", we can only expand to "879982000000"
// (digits may already be lost in the CSV).
export function expandScientific(raw: string): string {
  const s = (raw ?? "").toString().trim();
  if (!s) return "";

  // strip wrapping quotes
  const v = s.replace(/^"|"$/g, "").trim();

  // common junk like SKU: ....
  if (/sku:/i.test(v)) return v;

  // remove spaces
  const cleaned = v.replace(/\s+/g, "");

  const m = cleaned.match(/^([+-]?\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);
  if (!m) return cleaned;

  const mantissa = m[1];
  const exp = parseInt(m[2], 10);

  const sign = mantissa.startsWith("-") ? "-" : "";
  const unsigned = mantissa.replace(/^[+-]/, "");

  const parts = unsigned.split(".");
  const intPart = parts[0] || "0";
  const fracPart = parts[1] || "";

  // digits without decimal
  const digits = (intPart + fracPart).replace(/^0+/, "") || "0";
  const shift = exp - fracPart.length;

  if (shift < 0) {
    // would become a decimal; not valid for barcodes — return digits as-is
    return sign + digits;
  }

  return sign + digits + "0".repeat(shift);
}

// Turns CSV cell into a "barcode-ish" string the rest of your code can normalize
export function cleanCsvBarcode(raw: string): string {
  const expanded = expandScientific(raw);

  // keep only digits for UPC matching (scanners return digits)
  // if you WANT to allow alphanumeric SKU matching later, we can keep both forms.
  return expanded.replace(/\D/g, "");
}
