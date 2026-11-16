"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Button,
  Spinner,
} from "react-bootstrap";
import Icon from "@/components/wrappers/Icon";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  getPurchaseorderById,
  PurchaseorderRecord,
  PurchaseorderItem,
} from "@/redux/slices/admin/purchaseorderSlice";
import { fetchPartys, PartyRecord } from "@/redux/slices/admin/partySlice";
import { fetchServices, ServiceRecord } from "@/redux/slices/admin/serviceSlice";
import { fetchCategorys } from "@/redux/slices/admin/categorySlice";
import { fetchSubcategorys } from "@/redux/slices/admin/subcategorySlice";
import { fetchUnit, UnitRecord } from "@/redux/slices/admin/unitSlice";
import { fetchCurrency, CurrencyRecord } from "@/redux/slices/admin/currencySlice";
import { fetchCity, CityRecord } from "@/redux/slices/admin/citySlice";
import { fetchState, StateRecord } from "@/redux/slices/admin/stateSlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";
import { useSettingsContext } from "@/context/useSettingsContext";
import { formatServiceDisplayLabel } from "@/utils/helpers";

interface PurchaseorderInvoiceProps {
  orderId?: string;
  purchaseId?: string;
  order?: PurchaseorderRecord | null;
  purchase?: PurchaseorderRecord | null;
  show?: boolean;
  onHide?: () => void;
  standalone?: boolean;
}

// Convert amount number to words (Indian numbering system format)
const numberToWords = (amount: number, currencyCode = "CAD"): string => {
  if (isNaN(amount) || amount === 0) {
    const cur = currencyCode === "CAD" || currencyCode === "USD" ? "Dollars" : "Rupees";
    return `Zero ${cur} Only`;
  }

  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = [
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return single[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? " " + single[unit] : "");
  };

  const convertThreeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (h > 0) res += single[h] + " Hundred";
    if (rest > 0) {
      if (res) res += " and ";
      res += convertTwoDigits(rest);
    }
    return res;
  };

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let num = integerPart;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;

  const parts: string[] = [];
  if (crore > 0) parts.push(convertTwoDigits(crore) + " Crore");
  if (lakh > 0) parts.push(convertTwoDigits(lakh) + " Lakh");
  if (thousand > 0) parts.push(convertTwoDigits(thousand) + " Thousand");
  if (hundreds > 0) parts.push(convertThreeDigits(hundreds));

  let words = parts.join(" ").trim();
  if (!words) words = "Zero";

  const currUnit =
    currencyCode === "CAD" ? "CAD" : currencyCode === "USD" ? "Dollars" : "Rupees";
  let result = `${words} ${currUnit}`;

  if (decimalPart > 0) {
    const subUnit = currencyCode === "CAD" || currencyCode === "USD" ? "Cents" : "Paise";
    result += ` and ${convertTwoDigits(decimalPart)} ${subUnit}`;
  }
  return result + " Only";
};

// Format Date as DD-MMM-YYYY (e.g. 20-Dec-2025)
const formatOrderDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateStr);
  }
};

const formatNum = (val?: number | string | null) => {
  const n = Number(val || 0);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const PurchaseorderInvoice: React.FC<PurchaseorderInvoiceProps> = ({
  orderId,
  purchaseId,
  order: initialOrder,
  purchase: initialPurchase,
  show = true,
  onHide,
  standalone = false,
}) => {
  const effectiveId = orderId || purchaseId;
  const initialData = initialOrder || initialPurchase || null;
  const dispatch = useAppDispatch();
  const { setting } = useSettingsContext();

  const [loadedRecord, setLoadedRecord] = useState<PurchaseorderRecord | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);

  const { records: partyList } = useAppSelector((state: any) => state.party || { records: [] });
  const { records: serviceList } = useAppSelector((state: any) => state.service || { records: [] });
  const { records: categoryList } = useAppSelector((state: any) => state.category || { records: [] });
  const { records: subcategoryList } = useAppSelector((state: any) => state.subcategory || { records: [] });
  const { records: unitList } = useAppSelector((state: any) => state.unit || { records: [] });
  const { records: currencyList } = useAppSelector((state: any) => state.currency || { records: [] });
  const { records: cityList } = useAppSelector((state: any) => state.city || { records: [] });
  const { records: stateList } = useAppSelector((state: any) => state.state || { records: [] });
  const { records: countryList } = useAppSelector((state: any) => state.countries || { records: [] });

  // Load auxiliary lists if empty
  useEffect(() => {
    if (partyList.length === 0) dispatch(fetchPartys());
    if (serviceList.length === 0) dispatch(fetchServices());
    if (categoryList.length === 0) dispatch(fetchCategorys());
    if (subcategoryList.length === 0) dispatch(fetchSubcategorys());
    if (unitList.length === 0) dispatch(fetchUnit());
    if (currencyList.length === 0) dispatch(fetchCurrency());
    if (cityList.length === 0) dispatch(fetchCity());
    if (stateList.length === 0) dispatch(fetchState());
    if (countryList.length === 0) dispatch(fetchCountries());
  }, [
    dispatch,
    partyList.length,
    serviceList.length,
    categoryList.length,
    subcategoryList.length,
    unitList.length,
    currencyList.length,
    cityList.length,
    stateList.length,
    countryList.length,
  ]);

  // If effectiveId is supplied and no full details are present, fetch authoritative record
  useEffect(() => {
    if (initialData) {
      setLoadedRecord(initialData);
    } else if (effectiveId) {
      setLoading(true);
      dispatch(getPurchaseorderById(effectiveId))
        .unwrap()
        .then((rec) => {
          setLoadedRecord(rec);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [effectiveId, initialData, dispatch]);

  const activeRecord = loadedRecord || initialData;

  // Resolve Vendor Details (merges loaded party with activeRecord.vendor_id)
  const vendor = useMemo(() => {
    if (!activeRecord) return null;
    let vendorId = "";
    let vendorObj: any = null;
    if (typeof activeRecord.vendor_id === "object" && activeRecord.vendor_id) {
      vendorId = String(activeRecord.vendor_id.id || activeRecord.vendor_id._id || "");
      vendorObj = activeRecord.vendor_id;
    } else {
      vendorId = String(activeRecord.vendor_id || "");
    }
    const partyFromList = partyList.find((p: any) => String(p.id || p._id) === vendorId);
    return { ...partyFromList, ...vendorObj };
  }, [activeRecord, partyList]);

  // Resolve Currency Details
  const currencyRecord = useMemo(() => {
    if (!activeRecord) return null;
    if (typeof activeRecord.currency_id === "object" && activeRecord.currency_id) {
      return activeRecord.currency_id;
    }
    const id = String(activeRecord.currency_id || "");
    if (id) {
      const match = currencyList.find((c: any) => String(c.id || c._id) === id);
      if (match) return match;
    }
    if (vendor && typeof vendor.currency_id === "object" && vendor.currency_id) {
      return vendor.currency_id;
    }
    return null;
  }, [activeRecord, currencyList, vendor]);

  const currencyCode = useMemo(() => {
    return currencyRecord?.code || "CAD";
  }, [currencyRecord]);

  // Resolve Items list from order details
  const items: PurchaseorderItem[] = useMemo(() => {
    if (!activeRecord) return [];
    const raw = activeRecord.items || activeRecord.purchaseorder_details || activeRecord.purchase_details || [];
    return Array.isArray(raw) ? raw : [];
  }, [activeRecord]);

  // Check if any item has discount
  const hasDiscount = useMemo(() => {
    return items.some((item) => Number(item.discount || 0) > 0);
  }, [items]);

  // Paginate items:
  // If items <= 12, everything fits on 1 page with header and summary.
  // If items > 12, Page 1 shows up to 22 existing items without blank rows,
  // and the summary section renders on the last page.
  const pageChunks: PurchaseorderItem[][] = useMemo(() => {
    if (!items || items.length === 0) return [[]];

    if (items.length <= 12) {
      return [items];
    }

    const chunks: PurchaseorderItem[][] = [];
    const PAGE_1_LIMIT = 22;
    const SUBSEQUENT_PAGE_LIMIT = 22;

    chunks.push(items.slice(0, PAGE_1_LIMIT));
    const remaining = items.slice(PAGE_1_LIMIT);

    if (remaining.length === 0) {
      chunks.push([]);
    } else {
      for (let i = 0; i < remaining.length; i += SUBSEQUENT_PAGE_LIMIT) {
        chunks.push(remaining.slice(i, i + SUBSEQUENT_PAGE_LIMIT));
      }
      if (remaining.length % SUBSEQUENT_PAGE_LIMIT === 0) {
        chunks.push([]);
      }
    }

    return chunks;
  }, [items]);

  const totalPages = pageChunks.length;

  // Calculate starting SL. No. for each chunk
  const chunkStartingIndices = useMemo(() => {
    let running = 0;
    return pageChunks.map((c) => {
      const start = running;
      running += c.length;
      return start;
    });
  }, [pageChunks]);

  // Helper to get Service Name - Category Name - Subcategory Name (Description)
  const getServiceName = (item: PurchaseorderItem) => {
    return formatServiceDisplayLabel(
      item.service_id,
      serviceList,
      categoryList,
      subcategoryList,
      "Item / Service",
    );
  };

  // Helper to get Unit Name (Unit)
  const getUnitName = (item: PurchaseorderItem) => {
    if (typeof item.unit_id === "object" && item.unit_id) {
      return item.unit_id.name || "";
    }
    const match = unitList.find((u: any) => String(u.id || u._id) === String(item.unit_id));
    return match?.name || "";
  };

  // Helper to get HSN/SAC Code
  const getHsnCode = (item: PurchaseorderItem): string => {
    const directCode =
      (item as any)?.hsn_code;
    if (directCode && String(directCode).trim()) {
      return String(directCode).trim();
    }

    if (typeof item?.service_id === "object" && item?.service_id) {
      const s = item.service_id as any;
      const code = s.hsn_code;
      if (code && String(code).trim()) {
        return String(code).trim();
      }
    }

    const serviceId =
      typeof item?.service_id === "object" && item?.service_id
        ? String((item.service_id as any)._id || (item.service_id as any).id || "")
        : String(item?.service_id || "");

    if (serviceId) {
      const match = serviceList.find(
        (s: any) => String(s.id || s._id) === serviceId
      );
      const hsn_code =
        match?.hsn_code;
      if (hsn_code && String(hsn_code).trim()) {
        return String(hsn_code).trim();
      }
    }

    return "—";
  };

  // Company Details from settings (fallback to template values from sample image)
  const companyTitle = setting("general.title", "");
  const companyAddressLine1 = setting("general.website_address", "");
  const companyGstin = setting("general.gstin", "");
  const companyEmail = setting("general.support_email", "");
  const companyPhone = setting("general.contact", "");

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printElement = document.getElementById("purchaseorder-invoice-printable");
    if (!printElement) {
      window.print();
      return;
    }

    // Remove any previous print iframe
    const oldIframe = document.getElementById("purchaseorder-invoice-print-frame");
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "purchaseorder-invoice-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all parent stylesheets
    let styleSheetsHtml = "";
    document.querySelectorAll("link[rel='stylesheet']").forEach((link) => {
      styleSheetsHtml += `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">\n`;
    });

    const explicitPrintStyles = `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 12px !important;
        line-height: 1.35 !important;
      }
      #purchaseorder-invoice-printable {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
      }
      .po-page {
        page-break-after: always !important;
        break-after: page !important;
        border: 1px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 0 !important;
      }
      .po-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
        margin-bottom: 0 !important;
      }
      .po-box {
        border: 1px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .po-border-top {
        border-top: 1px solid #000000 !important;
      }
      .po-border-bottom {
        border-bottom: 1px solid #000000 !important;
      }
      .po-border-right {
        border-right: 1px solid #000000 !important;
      }
      .po-table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .po-table th,
      .po-table td {
        border-right: 1px solid #000000 !important;
        border-bottom: 1px solid #000000 !important;
        vertical-align: middle !important;
        padding: 6px 8px !important;
        color: #000000 !important;
      }
      .po-table th:last-child,
      .po-table td:last-child {
        border-right: none !important;
      }
      .po-tax-inner-table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 0 !important;
        table-layout: fixed !important;
      }
      .po-tax-inner-table td {
        border-bottom: none !important;
        border-right: 1px solid #000000 !important;
        vertical-align: middle !important;
        padding: 6px 8px !important;
      }
      .po-tax-inner-table td:last-child {
        border-right: none !important;
      }
      td.po-tax-wrapper {
        padding: 0 !important;
        vertical-align: middle !important;
      }
      .d-flex {
        display: flex !important;
      }
      .justify-content-between {
        justify-content: space-between !important;
      }
      .justify-content-end {
        justify-content: flex-end !important;
      }
      .align-items-center {
        align-items: center !important;
      }
      .align-items-end {
        align-items: flex-end !important;
      }
      .text-center {
        text-align: center !important;
      }
      .text-start {
        text-align: left !important;
      }
      .text-end {
        text-align: right !important;
      }
      .fw-bold {
        font-weight: bold !important;
      }
      .fw-semibold {
        font-weight: 600 !important;
      }
      .text-dark {
        color: #000000 !important;
      }
      .text-muted {
        color: #555555 !important;
      }
      .text-secondary {
        color: #333333 !important;
      }
      .text-danger {
        color: #dc3545 !important;
      }
      .text-uppercase {
        text-transform: uppercase !important;
      }
      .text-capitalize {
        text-transform: capitalize !important;
      }
      .fst-italic {
        font-style: italic !important;
      }
      .w-100 {
        width: 100% !important;
      }
      .h-100 {
        height: 100% !important;
      }
      .p-2 { padding: 8px !important; }
      .p-3 { padding: 12px !important; }
      .px-2 { padding-left: 8px !important; padding-right: 8px !important; }
      .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
      .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
      .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
      .py-3 { padding-top: 12px !important; padding-bottom: 12px !important; }
      .mb-1 { margin-bottom: 4px !important; }
      .mb-2 { margin-bottom: 8px !important; }
      .mb-4 { margin-bottom: 16px !important; }
      .mt-1 { margin-top: 4px !important; }
      .pt-5 { padding-top: 40px !important; }
      .fs-13 { font-size: 13px !important; }
      .fs-14 { font-size: 14px !important; }
      .font-monospace {
        font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      }
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Proforma Invoice - ${activeRecord?.purchase_order_no || activeRecord?.purchase_no || "Print"}</title>
          ${styleSheetsHtml}
          <style>${explicitPrintStyles}</style>
        </head>
        <body>
          <div style="padding: 0; margin: 0;">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after iframe renders
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print error:", err);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 1500);
      }
    }, 300);
  };

  // Vendor display values
  const vendorName = useMemo(() => {
    if (vendor?.name) return vendor.name;
    if (typeof activeRecord?.vendor_id === "string" && activeRecord.vendor_id) return activeRecord.vendor_id;
    return "Vendor Name";
  }, [vendor, activeRecord]);

  const vendorCityName = useMemo(() => {
    if (!vendor) return "";
    if (typeof vendor.city_id === "object" && vendor.city_id?.name) {
      return vendor.city_id.name;
    }
    if (vendor.city_id) {
      const cId = String(vendor.city_id);
      const match = cityList.find((c: any) => String(c.id || c._id) === cId);
      if (match?.name) return match.name;
    }
    if (typeof vendor.city === "object" && vendor.city?.name) {
      return vendor.city.name;
    }
    if (typeof vendor.city === "string" && vendor.city) {
      return vendor.city;
    }
    return "";
  }, [vendor, cityList]);

  const vendorStateRecord = useMemo(() => {
    if (!vendor) return null;
    if (typeof vendor.state_id === "object" && vendor.state_id) {
      return vendor.state_id;
    }
    if (vendor.state_id) {
      const sId = String(vendor.state_id);
      const match = stateList.find((s: any) => String(s.id || s._id) === sId);
      if (match) return match;
    }
    if (typeof vendor.state === "object" && vendor.state) {
      return vendor.state;
    }
    if (typeof vendor.city_id === "object" && vendor.city_id?.state_id) {
      if (typeof vendor.city_id.state_id === "object" && vendor.city_id.state_id) {
        return vendor.city_id.state_id;
      }
      const sId = String(vendor.city_id.state_id);
      const match = stateList.find((s: any) => String(s.id || s._id) === sId);
      if (match) return match;
    } else if (vendor.city_id) {
      const cId = String(vendor.city_id);
      const cityMatch = cityList.find((c: any) => String(c.id || c._id) === cId);
      if (cityMatch?.state_id) {
        if (typeof cityMatch.state_id === "object" && cityMatch.state_id) {
          return cityMatch.state_id;
        }
        const sId = String(cityMatch.state_id);
        const match = stateList.find((s: any) => String(s.id || s._id) === sId);
        if (match) return match;
      }
    }
    if (typeof vendor.state === "string" && vendor.state) {
      const match = stateList.find(
        (s: any) => String(s.name || "").trim().toLowerCase() === vendor.state.trim().toLowerCase()
      );
      if (match) return match;
    }
    return null;
  }, [vendor, stateList, cityList]);

  const vendorStateName = useMemo(() => {
    if (vendorStateRecord?.name) return String(vendorStateRecord.name).trim();
    if (typeof vendor?.state === "object" && vendor.state?.name) {
      return String(vendor.state.name).trim();
    }
    if (typeof vendor?.state === "string" && vendor.state) {
      return vendor.state.trim();
    }
    return "";
  }, [vendorStateRecord, vendor]);

  const vendorStateCode = useMemo(() => {
    if (vendorStateRecord?.code) return String(vendorStateRecord.code).trim();
    if (typeof vendor?.state === "object" && vendor.state?.code) {
      return String(vendor.state.code).trim();
    }
    if (vendor?.state_code || vendor?.stateCode) {
      return String(vendor.state_code || vendor.stateCode).trim();
    }
    const gstin = String(vendor?.gstin || "").trim();
    if (gstin && /^\d{2}/.test(gstin)) {
      return gstin.substring(0, 2);
    }
    return "";
  }, [vendorStateRecord, vendor]);

  const vendorCountryName = useMemo(() => {
    if (!vendor) return "";
    if (typeof vendor.country_id === "object" && vendor.country_id?.name) {
      return vendor.country_id.name;
    }
    if (vendor.country_id) {
      const coId = String(vendor.country_id);
      const match = countryList.find((c: any) => String(c.id || c._id) === coId);
      if (match?.name) return match.name;
    }
    if (typeof vendor.country === "object" && vendor.country?.name) {
      return vendor.country.name;
    }
    if (typeof vendor.country === "string" && vendor.country) {
      return vendor.country;
    }
    return "";
  }, [vendor, countryList]);

  const vendorAddress = useMemo(() => {
    return vendor?.address ? String(vendor.address).trim() : "";
  }, [vendor]);

  const vendorFullAddress = useMemo(() => {
    const list: string[] = [];
    const addr = vendorAddress.trim().replace(/,\s*$/, "");
    const city = vendorCityName.trim().replace(/,\s*$/, "");
    const stateLabel = (
      vendorStateName && vendorStateCode
        ? `${vendorStateName} (${vendorStateCode})`
        : vendorStateName
    ).trim().replace(/,\s*$/, "");
    const country = vendorCountryName.trim().replace(/,\s*$/, "");

    if (addr) list.push(addr);
    if (city && (!addr || addr.toLowerCase() !== city.toLowerCase())) {
      list.push(city);
    }
    if (stateLabel && (!city || city.toLowerCase() !== stateLabel.toLowerCase())) {
      list.push(stateLabel);
    }
    if (
      country &&
      (!stateLabel || stateLabel.toLowerCase() !== country.toLowerCase()) &&
      (!city || city.toLowerCase() !== country.toLowerCase())
    ) {
      list.push(country);
    }
    return list.join(", ");
  }, [vendorAddress, vendorCityName, vendorStateName, vendorStateCode, vendorCountryName]);

  const vendorGstin = vendor?.gstin || "";
  const vendorPhone = vendor?.phone || "";
  const vendorEmail = vendor?.email || "";

  // Dynamic Tax Label based on vendor's taxType (GST vs VAT)
  const vendorTaxLabel = useMemo(() => {
    const rawType = String(
      vendor?.taxType || vendor?.tax_type || (activeRecord as any)?.vendor_id?.taxType || ""
    ).trim().toUpperCase();
    if (rawType === "VAT") {
      return "VAT No. :";
    }
    if (rawType === "GST") {
      return "GSTIN/UIN :";
    }
    if (rawType) {
      return `${rawType} Number :`;
    }
    return "GSTIN/UIN :";
  }, [vendor, activeRecord]);

  // The actual printable ERP Box View matching the purchase module
  const invoicePaperContent = (
    <div id="purchaseorder-invoice-printable" className="p-3 p-md-4 bg-white text-dark">
      {/* Print CSS Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #purchaseorder-invoice-printable,
          #purchaseorder-invoice-printable * {
            visibility: visible !important;
          }
          #purchaseorder-invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .modal {
            position: static !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .modal-dialog {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
          }
          .modal-backdrop,
          .no-print,
          .modal-header,
          .modal-footer {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          .po-page {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
          }
          .po-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 0 !important;
          }
        }

        .po-box {
          border: 1px solid #000000 !important;
          background: #ffffff;
          color: #000000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.35;
        }

        .po-page {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
        }

        .po-border-top {
          border-top: 1px solid #000000 !important;
        }

        .po-border-bottom {
          border-bottom: 1px solid #000000 !important;
        }

        .po-border-right {
          border-right: 1px solid #000000 !important;
        }

        .po-table th,
        .po-table td {
          border-right: 1px solid #000000 !important;
          border-bottom: 1px solid #000000 !important;
          vertical-align: middle;
          padding: 6px 8px;
        }

        .po-table th:last-child,
        .po-table td:last-child {
          border-right: none !important;
        }

        .po-tax-inner-table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 0 !important;
          table-layout: fixed !important;
        }
        .po-tax-inner-table td {
          border-bottom: none !important;
          border-right: 1px solid #000000 !important;
          vertical-align: middle;
          padding: 6px 8px;
        }
        .po-tax-inner-table td:last-child {
          border-right: none !important;
        }
        td.po-tax-wrapper {
          padding: 0 !important;
          vertical-align: middle !important;
        }
      `}</style>

      {/* Pages Container */}
      {pageChunks.map((chunk, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;
        const pageNum = pageIndex + 1;

        return (
          <div
            key={`po-page-${pageIndex}`}
            className="po-box po-page"
            style={{
              marginBottom: isLastPage ? "0" : "24px",
            }}
          >
            {/* Top Header Bar: Page : X of Y | Proforma | Original/Duplicate */}
            <div
              className="d-flex align-items-center justify-content-between px-3 py-1 po-border-bottom"
              style={{ fontSize: "12px" }}
            >
              <div className="flex-1 text-start">
                Page : {pageNum}{totalPages > 1 ? ` of ${totalPages}` : ""}
              </div>
              <div className="flex-1 text-center fw-bold fs-15">
                Proforma Invoice
              </div>
              <div className="flex-1 text-end">Original/Duplicate</div>
            </div>

            {/* Header ONLY on first page */}
            {isFirstPage && (
              <>
                {/* Company Header Centered */}
                <div className="text-center py-3 px-3 po-border-bottom">
                  <h2 className="fw-bold mb-1 text-dark" style={{ fontSize: "22px", letterSpacing: "0.5px" }}>
                    {vendorName}
                  </h2>
                  <div className="text-dark" style={{ fontSize: "12px" }}>
                    <div>{vendorFullAddress}</div>
                    {/* {vendorStateName && (
                      <div>
                        <span className="fw-semibold">State Name :</span> {vendorStateName}
                        {vendorStateCode && (
                          <span className="ms-2">
                            <span className="fw-semibold">State Code :</span> {vendorStateCode}
                          </span>
                        )}
                      </div>
                    )} */}
                    {vendorGstin && (
                      <div>
                        <span className="fw-semibold">{vendorTaxLabel}</span> {vendorGstin}
                      </div>
                    )}
                    {vendorEmail && (
                      <div>
                        <span className="fw-semibold">E-mail :</span> {vendorEmail}
                      </div>
                    )}
                    {vendorPhone && (
                      <div>
                        <span className="fw-semibold">Phone :</span> {vendorPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Two-Column Grid: TO (Vendor) & Proforma Details */}
                <table className="w-100" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <tbody>
                    <tr style={{ height: "25%" }}>
                      {/* Left Column: TO (Vendor/Party Details) spanning all 4 rows */}
                      <td
                        rowSpan={4}
                        className="po-border-right po-border-bottom p-3 text-dark"
                        style={{ width: "50%", verticalAlign: "top" }}
                      >
                        <div className="fw-bold mb-1" style={{ fontSize: "12px" }}>
                          TO
                        </div>
                        <div className="fw-bold fs-14 text-dark">{companyTitle}</div>
                        {companyAddressLine1 && <div className="mt-1">{companyAddressLine1}</div>}
                        {companyGstin && (
                          <div className="mt-1">
                            <span className="fw-semibold">{vendorTaxLabel}</span> {companyGstin}
                          </div>
                        )}
                        {companyPhone && (
                          <div>
                            <span className="fw-semibold">Phone :</span> {companyPhone}
                          </div>
                        )}
                        {companyEmail && (
                          <div>
                            <span className="fw-semibold">E-mail :</span> {companyEmail}
                          </div>
                        )}
                      </td>

                      {/* Row 1 Right: Proforma Invoice No. */}
                      <td
                        className="px-3 py-2 fw-bold po-border-right po-border-bottom"
                        style={{ width: "22.5%", verticalAlign: "middle" }}
                      >
                        Proforma Invoice No.
                      </td>
                      <td
                        className="px-3 py-2 font-monospace fw-bold po-border-bottom"
                        style={{ width: "27.5%", verticalAlign: "middle" }}
                      >
                        {activeRecord?.purchase_order_no || activeRecord?.purchase_no || "—"}
                      </td>
                    </tr>

                    <tr style={{ height: "25%" }}>
                      {/* Row 2 Right: Order Date */}
                      <td
                        className="px-3 py-2 fw-bold po-border-right po-border-bottom"
                        style={{ width: "22.5%", verticalAlign: "middle" }}
                      >
                        Order Date
                      </td>
                      <td
                        className="px-3 py-2 po-border-bottom"
                        style={{ width: "27.5%", verticalAlign: "middle" }}
                      >
                        {formatOrderDate(activeRecord?.invoice_date || activeRecord?.order_date)}
                      </td>
                    </tr>

                    <tr style={{ height: "25%" }}>
                      {/* Row 3 Right: Vendor Bill No. */}
                      <td
                        className="px-3 py-2 fw-bold po-border-right po-border-bottom"
                        style={{ width: "22.5%", verticalAlign: "middle" }}
                      >
                        Vendor Bill No.
                      </td>
                      <td
                        className="px-3 py-2 po-border-bottom"
                        style={{ width: "27.5%", verticalAlign: "middle" }}
                      >
                        {activeRecord?.invoice_no ? activeRecord.invoice_no : "—"}
                      </td>
                    </tr>

                    <tr style={{ height: "25%" }} className="po-border-bottom">
                      {/* Row 4 Right: Delivery Date */}
                      <td
                        className="px-3 py-2 fw-bold po-border-right po-border-bottom"
                        style={{ width: "22.5%", verticalAlign: "middle" }}
                      >
                        Delivery Date
                      </td>
                      <td
                        className="px-3 py-2 po-border-bottom"
                        style={{ width: "27.5%", verticalAlign: "middle" }}
                      >
                        {formatOrderDate(activeRecord?.due_date)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Existing Table Fields (from purchaseorder_details) Table View */}
            <div className="w-100">
              <table className="w-100 po-table" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: hasDiscount ? "32%" : "38%" }} />
                  <col style={{ width: hasDiscount ? "10%" : "11%" }} />
                  <col style={{ width: hasDiscount ? "8%" : "9%" }} />
                  <col style={{ width: hasDiscount ? "9%" : "10%" }} />
                  <col style={{ width: hasDiscount ? "11%" : "12%" }} />
                  {hasDiscount && <col style={{ width: "9%" }} />}
                  <col style={{ width: hasDiscount ? "16%" : "15%" }} />
                </colgroup>
                {chunk.length > 0 && (
                  <thead>
                    <tr style={{ background: "#fdfdfd" }}>
                      <th className="text-center fw-bold">
                        SL. No.
                      </th>
                      <th className="text-start fw-bold">
                        Description
                      </th>
                      <th className="text-center fw-bold">
                        HSN/SAC
                      </th>
                      <th className="text-center fw-bold">
                        QTY
                      </th>
                      <th className="text-center fw-bold">
                        Unit
                      </th>
                      <th className="text-end fw-bold">
                        Rate
                      </th>
                      {hasDiscount && (
                        <th className="text-end fw-bold">
                          Disc.
                        </th>
                      )}
                      <th className="text-end fw-bold">
                        Amount
                      </th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {chunk.length > 0 ? (
                    chunk.map((item, idx) => {
                      const globalIndex = chunkStartingIndices[pageIndex] + idx + 1;
                      return (
                        <tr key={item.id || item._id || idx}>
                          <td className="text-center text-dark">{globalIndex}</td>
                          <td className="text-start fw-semibold text-dark" style={{ wordBreak: "break-word" }}>
                            {getServiceName(item)}
                          </td>
                          <td className="text-center text-dark">
                            {getHsnCode(item)}
                          </td>
                          <td className="text-center font-monospace text-dark">
                            {item.quantity || 1}
                          </td>
                          <td className="text-center text-dark">
                            {getUnitName(item) || "—"}
                          </td>
                          <td className="text-end font-monospace text-dark">
                            {formatNum(item.rate)}
                          </td>
                          {hasDiscount && (
                            <td className="text-end font-monospace text-muted">
                              {Number(item.discount || 0) > 0 ? formatNum(item.discount) : "0.00"}
                            </td>
                          )}
                          <td className="text-end font-monospace fw-bold text-dark">
                            {formatNum(item.total)}
                          </td>
                        </tr>
                      );
                    })
                  ) : totalPages === 1 ? (
                    <tr>
                      <td colSpan={hasDiscount ? 8 : 7} className="text-center py-4 text-muted">
                        No items recorded for this purchase order.
                      </td>
                    </tr>
                  ) : null}

                  {/* If NOT last page, show subtle continuation row at bottom of table */}
                  {!isLastPage && (
                    <tr className="po-border-bottom">
                      <td
                        colSpan={hasDiscount ? 8 : 7}
                        className="py-2 px-3 text-end text-muted fst-italic"
                        style={{ fontSize: "11px", background: "#fafafa" }}
                      >
                        Continued on Page {pageNum + 1}...
                      </td>
                    </tr>
                  )}

                  {/* Price Section ONLY on last page */}
                  {isLastPage && (
                    <>
                      {/* Financial Calculation Breakdown Rows */}
                      {(Number(activeRecord?.tax_amount || 0) > 0 ||
                        Number(activeRecord?.discount_amount || 0) > 0 ||
                        Number(activeRecord?.round_off || 0) !== 0) && (
                        <>
                          <tr className="po-border-bottom">
                            <td
                              colSpan={hasDiscount ? 7 : 6}
                              className="py-1 px-3 text-end fw-semibold po-border-right text-muted"
                            >
                              Total ({currencyCode}):
                            </td>
                            <td className="py-1 px-2 text-end font-monospace fw-semibold text-dark">
                              {formatNum(activeRecord?.total_amount)}
                            </td>
                          </tr>

                          {Number(activeRecord?.discount_amount || 0) > 0 && (
                            <tr className="po-border-bottom">
                              <td
                                colSpan={hasDiscount ? 7 : 6}
                                className="py-1 px-3 text-end fw-semibold po-border-right text-danger"
                              >
                                Discount ({activeRecord?.discount_type === "percentage" ? `${activeRecord.discount}%` : "Fixed"}):
                              </td>
                              <td className="py-1 px-2 text-end font-monospace text-danger">
                                -{formatNum(activeRecord?.discount_amount)}
                              </td>
                            </tr>
                          )}

                          {Number(activeRecord?.tax_amount || 0) > 0 && (() => {
                            const taxType = (activeRecord?.tax_type || "GST").trim();
                            const isGst = taxType.toUpperCase() === "GST";
                            const taxAmount = Number(activeRecord?.tax_amount || 0);
                            const taxPercentage = Number(activeRecord?.tax_percentage || 0);
                            const halfPercentage = taxPercentage > 0 ? taxPercentage / 2 : 0;
                            const halfTaxAmount = taxAmount > 0 ? taxAmount / 2 : 0;

                            if (isGst) {
                              return (
                                <tr className="po-border-bottom">
                                  <td
                                    colSpan={hasDiscount ? 7 : 6}
                                    className="po-tax-wrapper po-border-right"
                                  >
                                    <table className="po-tax-inner-table">
                                      <colgroup>
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "32%" }} />
                                      </colgroup>
                                      <tbody>
                                        <tr>
                                          <td className="text-end fw-semibold text-dark">
                                            CGST:
                                          </td>
                                          <td className="text-end font-monospace text-dark">
                                            {formatNum(halfTaxAmount)}
                                          </td>
                                          <td className="text-end fw-semibold text-dark">
                                            SGST:
                                          </td>
                                          <td className="text-end font-monospace text-dark">
                                            {formatNum(halfTaxAmount)}
                                          </td>
                                          <td className="text-end fw-semibold text-dark">
                                            Tax{taxPercentage > 0 ? ` (${taxType}@${taxPercentage}%)` : ""}:
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                  <td className="py-1 px-2 text-end font-monospace text-dark">
                                    +{formatNum(taxAmount)}
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr className="po-border-bottom">
                                <td
                                  colSpan={hasDiscount ? 7 : 6}
                                  className="py-1 px-3 text-end fw-semibold po-border-right text-dark"
                                >
                                  Tax ({taxType}{taxPercentage > 0 ? ` @ ${taxPercentage}%` : ""}):
                                </td>
                                <td className="py-1 px-2 text-end font-monospace text-dark">
                                  +{formatNum(taxAmount)}
                                </td>
                              </tr>
                            );
                          })()}

                          {Number(activeRecord?.round_off || 0) !== 0 && (
                            <tr className="po-border-bottom">
                              <td
                                colSpan={hasDiscount ? 7 : 6}
                                className="py-1 px-3 text-end fw-semibold po-border-right text-muted"
                              >
                                Round Off:
                              </td>
                              <td className="py-1 px-2 text-end font-monospace text-dark">
                                {Number(activeRecord?.round_off || 0) > 0 ? "+" : ""}
                                {formatNum(activeRecord?.round_off)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}

                      {/* In Word & Net Total Row */}
                      <tr className="po-border-bottom">
                        <td
                          colSpan={hasDiscount ? 6 : 5}
                          className="py-2 px-3 text-start po-border-right"
                          style={{ verticalAlign: "middle" }}
                        >
                          <span className="fw-bold">In Word:</span>{" "}
                          <span className="fw-bold text-dark text-capitalize ms-1">
                            {numberToWords(Number(activeRecord?.final_amount || 0), currencyCode)}
                          </span>
                        </td>
                        <td
                          className="py-2 px-2 text-end fw-bold po-border-right text-dark"
                          style={{ verticalAlign: "middle", lineHeight: "1.2" }}
                        >
                          <div>Net Total</div>
                          <div>({currencyCode})</div>
                        </td>
                        <td
                          className="py-2 px-2 text-end font-monospace fw-bold fs-13 text-dark"
                          style={{ verticalAlign: "middle" }}
                        >
                          {formatNum(activeRecord?.final_amount)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Notes & Signatures ONLY on last page */}
            {isLastPage && (
              <>
                <div
                className="p-3"
                style={{ minHeight: "160px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              >
                {/* Optional Remarks if entered */}
                {activeRecord?.remarks && (
                  <div className="mb-2 text-secondary" style={{ fontSize: "11px" }}>
                    <span className="fw-bold text-dark">Remarks:</span>{" "}
                    <span>{activeRecord.remarks}</span>
                  </div>
                )}

                {/* Right Header: E. & O.E. / For Company */}
                <div className="d-flex justify-content-end mb-4">
                  <div className="text-end" style={{ fontSize: "12px" }}>
                    <div className="fst-italic text-muted">E. & O.E.</div>
                    <div className="fw-bold text-dark">For {companyTitle}</div>
                  </div>
                </div>

                {/* Signatures Bar: VENDOR SIGNATURE on Left, Approved By on Right */}
                <div className="d-flex justify-content-between align-items-end pt-5">
                  <div className="fw-bold text-uppercase" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                    VENDOR SIGNATURE
                  </div>
                  <div className="fw-bold text-end" style={{ fontSize: "12px" }}>
                    Approved By
                  </div>
                </div>
              </div>

              {/* Computer Generated Invoice Disclaimer (Full Width with Top & Bottom Border) */}
              <div
                className="w-100 text-center py-2 text-muted fst-italic po-border-top po-border-bottom"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.3px",
                  background: "#fafafa",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                }}
              >
                This is a Computer Generated Invoice
              </div>
            </>
          )}
          </div>
        );
      })}
    </div>
  );

  // If standalone view (e.g. on dedicated page), render with action toolbar
  if (standalone) {
    return (
      <div className="purchase-invoice-standalone">
        <div className="d-flex align-items-center justify-content-between p-3 bg-light border-bottom mb-4 rounded no-print">
          <div className="d-flex align-items-center gap-2">
            <Icon icon="file-text" className="text-primary fs-20" />
            <h5 className="mb-0 fw-bold">Proforma Invoice</h5>
            <span className="badge bg-secondary-subtle text-secondary font-monospace">
              {activeRecord?.purchase_order_no || activeRecord?.purchase_no || "PI/—"}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={loading}
              className="d-flex align-items-center gap-1 shadow-sm"
            >
              {loading ? <Spinner size="sm" animation="border" /> : <Icon icon="printer" className="fs-16" />}
              Print Invoice
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="text-muted mt-2">Loading purchase order details...</div>
          </div>
        ) : (
          invoicePaperContent
        )}
      </div>
    );
  }

  // Otherwise, render as a preview Modal
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      scrollable
      backdrop="static"
      className="purchase-invoice-modal"
    >
      <Modal.Header closeButton className="bg-light py-2 px-3 border-bottom no-print">
        <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2">
          <Icon icon="printer" className="text-primary fs-18" />
          <span>Proforma Invoice</span>
          {(activeRecord?.purchase_order_no || activeRecord?.purchase_no) && (
            <span className="badge bg-primary-subtle text-primary font-monospace fs-12">
              {activeRecord?.purchase_order_no || activeRecord?.purchase_no}
            </span>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3 bg-secondary bg-opacity-10">
        {loading ? (
          <div className="text-center py-5 bg-white">
            <Spinner animation="border" variant="primary" />
            <div className="text-muted mt-2 fs-13">Loading details...</div>
          </div>
        ) : (
          invoicePaperContent
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light py-2 px-3 border-top no-print d-flex align-items-center justify-content-between">
        <div className="text-muted fs-12 d-flex align-items-center gap-1">
          <Icon icon="info" className="text-info fs-14" />
          <span>Tip: Click <strong>Print Invoice</strong> to print or export as PDF.</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {onHide && (
            <Button variant="outline-secondary" size="sm" onClick={onHide}>
              Close
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={loading}
            className="d-flex align-items-center gap-1 shadow-sm"
          >
            {loading ? <Spinner size="sm" animation="border" /> : <Icon icon="printer" className="fs-14" />}
            Print Invoice
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PurchaseorderInvoice;
