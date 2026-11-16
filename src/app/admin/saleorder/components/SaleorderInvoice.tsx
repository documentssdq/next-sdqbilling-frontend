"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Modal, Button, Spinner } from "react-bootstrap";
import Icon from "@/components/wrappers/Icon";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  getSaleorderById,
  SaleorderRecord,
  SaleorderItem,
} from "@/redux/slices/admin/saleorderSlice";
import { fetchPartys } from "@/redux/slices/admin/partySlice";
import { fetchServices } from "@/redux/slices/admin/serviceSlice";
import { fetchCategorys } from "@/redux/slices/admin/categorySlice";
import { fetchSubcategorys } from "@/redux/slices/admin/subcategorySlice";
import { fetchUnit } from "@/redux/slices/admin/unitSlice";
import { fetchCurrency } from "@/redux/slices/admin/currencySlice";
import { fetchCity } from "@/redux/slices/admin/citySlice";
import { fetchState, StateRecord } from "@/redux/slices/admin/stateSlice";
import { fetchCountries } from "@/redux/slices/admin/countriesSlice";
import { useSettingsContext } from "@/context/useSettingsContext";
import { formatServiceDisplayLabel } from "@/utils/helpers";

interface SaleorderInvoiceProps {
  orderId?: string;
  saleId?: string;
  order?: SaleorderRecord | null;
  sale?: SaleorderRecord | null;
  show?: boolean;
  onHide?: () => void;
  standalone?: boolean;
}

const numberToWords = (amount: number, currencyCode = "CAD"): string => {
  if (isNaN(amount) || amount === 0) {
    const cur = currencyCode === "CAD" || currencyCode === "USD" ? "Dollars" : "Rupees";
    return `Zero ${cur} Only`;
  }

  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
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

export const SaleorderInvoice: React.FC<SaleorderInvoiceProps> = ({
  orderId,
  saleId,
  order: initialOrder,
  sale: initialSale,
  show = true,
  onHide,
  standalone = false,
}) => {
  const effectiveId = orderId || saleId;
  const initialData = initialOrder || initialSale || null;
  const dispatch = useAppDispatch();
  const { setting } = useSettingsContext();

  const [loadedRecord, setLoadedRecord] = useState<SaleorderRecord | null>(initialData);
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

  useEffect(() => {
    if (initialData) {
      setLoadedRecord(initialData);
    } else if (effectiveId) {
      setLoading(true);
      dispatch(getSaleorderById(effectiveId))
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

  // Resolve Customer Details
  const customer = useMemo(() => {
    if (!activeRecord) return null;
    let customerId = "";
    let customerObj: any = null;
    if (typeof activeRecord.customer_id === "object" && activeRecord.customer_id) {
      customerId = String(activeRecord.customer_id.id || activeRecord.customer_id._id || "");
      customerObj = activeRecord.customer_id;
    } else {
      customerId = String(activeRecord.customer_id || "");
    }
    const partyFromList = partyList.find((p: any) => String(p.id || p._id) === customerId);
    return { ...partyFromList, ...customerObj };
  }, [activeRecord, partyList]);

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
    if (customer && typeof customer.currency_id === "object" && customer.currency_id) {
      return customer.currency_id;
    }
    return null;
  }, [activeRecord, currencyList, customer]);

  const currencyCode = useMemo(() => {
    return currencyRecord?.code || "CAD";
  }, [currencyRecord]);

  const items: SaleorderItem[] = useMemo(() => {
    if (!activeRecord) return [];
    const raw =
      activeRecord.items || activeRecord.saleorder_details || activeRecord.sale_details || [];
    return Array.isArray(raw) ? raw : [];
  }, [activeRecord]);

  const hasDiscount = useMemo(() => {
    return items.some((item) => Number(item.discount || 0) > 0);
  }, [items]);

  const pageChunks: SaleorderItem[][] = useMemo(() => {
    if (!items || items.length === 0) return [[]];
    if (items.length <= 12) return [items];

    const chunks: SaleorderItem[][] = [];
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

  const chunkStartingIndices = useMemo(() => {
    let running = 0;
    return pageChunks.map((c) => {
      const start = running;
      running += c.length;
      return start;
    });
  }, [pageChunks]);

  // Service Name - Category Name - Subcategory Name
  const getServiceName = (item: SaleorderItem) => {
    return formatServiceDisplayLabel(
      item.service_id,
      serviceList,
      categoryList,
      subcategoryList,
      "Item / Service"
    );
  };

  const getUnitName = (item: SaleorderItem) => {
    if (typeof item.unit_id === "object" && item.unit_id) {
      return item.unit_id.name || "";
    }
    const match = unitList.find((u: any) => String(u.id || u._id) === String(item.unit_id));
    return match?.name || "";
  };

  // Helper to get HSN/SAC Code
  const getHsnCode = (item: SaleorderItem): string => {
    const directCode = (item as any)?.hsn_code;
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
      const hsn_code = match?.hsn_code;
      if (hsn_code && String(hsn_code).trim()) {
        return String(hsn_code).trim();
      }
    }

    return "—";
  };

  // Company Details from settings
  const companyTitle = setting("general.title", "");
  const companyAddressLine1 = setting("general.website_address", "");
  const companyGstin = setting("general.gstin", "");
  const companyEmail = setting("general.support_email", "");
  const companyPhone = setting("general.phone", "");

  // Company Logo from settings
  const rawCompanyLogo =
    setting("general.logo", "") ||
    setting("general.logo_dark", "") ||
    setting("logo", "") ||
    "";

  const companyLogo = useMemo(() => {
    if (!rawCompanyLogo) return "";
    let logoVal = "";
    if (typeof rawCompanyLogo === "object" && (rawCompanyLogo as any)?.src) {
      logoVal = String((rawCompanyLogo as any).src);
    } else if (typeof rawCompanyLogo === "string") {
      logoVal = rawCompanyLogo.trim();
    }
    if (!logoVal) return "";
    if (
      logoVal.startsWith("blob:") ||
      logoVal.startsWith("http://") ||
      logoVal.startsWith("https://") ||
      logoVal.startsWith("data:") ||
      logoVal.startsWith("/")
    ) {
      return logoVal;
    }
    return `/uploads/${logoVal}`;
  }, [rawCompanyLogo]);

  // Bank Details from settings
  const rawBankDetails = setting("bank_details", null);
  const parsedBankDetails = useMemo(() => {
    if (typeof rawBankDetails === "object" && rawBankDetails !== null) {
      return rawBankDetails;
    }
    if (typeof rawBankDetails === "string" && rawBankDetails.trim().startsWith("{")) {
      try {
        return JSON.parse(rawBankDetails);
      } catch {
        return null;
      }
    }
    return null;
  }, [rawBankDetails]);

  const bankName =
    setting("bank_details.bank_name", "") ||
    setting("bank_name", "") ||
    parsedBankDetails?.bank_name ||
    "";
  const branchName =
    setting("bank_details.branch_name", "") ||
    setting("bank_details.branch", "") ||
    setting("branch_name", "") ||
    parsedBankDetails?.branch_name ||
    parsedBankDetails?.branch ||
    "";
  const accountNo =
    setting("bank_details.account_no", "") ||
    setting("bank_details.account_number", "") ||
    setting("account_no", "") ||
    setting("account_number", "") ||
    parsedBankDetails?.account_no ||
    parsedBankDetails?.account_number ||
    "";
  const ifscCode =
    setting("bank_details.ifsc_code", "") ||
    setting("ifsc_code", "") ||
    parsedBankDetails?.ifsc_code ||
    "";

  // Terms & Conditions from settings
  const rawTermsCondition =
    setting("general.terms_condition", "") ||
    setting("general.terms_conditions", "") ||
    setting("terms_condition", "") ||
    setting("terms_conditions", "") ||
    "";

  const termsCondition = useMemo(() => {
    let val = "";
    if (typeof rawTermsCondition === "string") val = rawTermsCondition.trim();
    else if (Array.isArray(rawTermsCondition)) val = rawTermsCondition.join("\n").trim();
    if (!val) return "";
    // Clean out empty HTML tags if rich text editor was used
    const cleanText = val.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
    if (!cleanText) return "";
    return val;
  }, [rawTermsCondition]);

  const hasTerms = Boolean(termsCondition && termsCondition.length > 0);
  const hasBankDetails = Boolean(
    (bankName && String(bankName).trim()) ||
    (branchName && String(branchName).trim()) ||
    (accountNo && String(accountNo).trim()) ||
    (ifscCode && String(ifscCode).trim())
  );

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printElement = document.getElementById("saleorder-invoice-printable");
    if (!printElement) {
      window.print();
      return;
    }

    const oldIframe = document.getElementById("saleorder-invoice-print-frame");
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "saleorder-invoice-print-frame";
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
      #saleorder-invoice-printable {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
      }
      .so-page {
        page-break-after: always !important;
        break-after: page !important;
        border: 1px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 0 !important;
      }
      .so-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
        margin-bottom: 0 !important;
      }
      .so-box {
        border: 1px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .so-border-top {
        border-top: 1px solid #000000 !important;
      }
      .so-border-bottom {
        border-bottom: 1px solid #000000 !important;
      }
      .so-border-right {
        border-right: 1px solid #000000 !important;
      }
      .so-disclaimer {
        border-top: 1px solid #000000 !important;
        border-bottom: 1px solid #000000 !important;
      }
      .so-table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .so-table th,
      .so-table td {
        border-right: 1px solid #000000 !important;
        border-bottom: 1px solid #000000 !important;
        vertical-align: middle !important;
        padding: 6px 8px !important;
        color: #000000 !important;
      }
      .so-table th:last-child,
      .so-table td:last-child {
        border-right: none !important;
      }
      .so-tax-inner-table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 0 !important;
        table-layout: fixed !important;
      }
      .so-tax-inner-table td {
        border-bottom: none !important;
        border-right: 1px solid #000000 !important;
        vertical-align: middle !important;
        padding: 6px 8px !important;
      }
      .so-tax-inner-table td:last-child {
        border-right: none !important;
      }
      td.so-tax-wrapper {
        padding: 0 !important;
        vertical-align: middle !important;
      }
      .d-flex { display: flex !important; }
      .flex-column { flex-direction: column !important; }
      .justify-content-between { justify-content: space-between !important; }
      .justify-content-center { justify-content: center !important; }
      .justify-content-end { justify-content: flex-end !important; }
      .align-items-center { align-items: center !important; }
      .align-items-end { align-items: flex-end !important; }
      .text-center { text-align: center !important; }
      .text-start { text-align: left !important; }
      .text-end { text-align: right !important; }
      .fw-bold { font-weight: bold !important; }
      .fw-semibold { font-weight: 600 !important; }
      .text-dark { color: #000000 !important; }
      .text-muted { color: #555555 !important; }
      .text-secondary { color: #333333 !important; }
      .text-danger { color: #dc3545 !important; }
      .text-uppercase { text-transform: uppercase !important; }
      .text-capitalize { text-transform: capitalize !important; }
      .fst-italic { font-style: italic !important; }
      .w-100 { width: 100% !important; }
      .h-100 { height: 100% !important; }
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
      .mt-2 { margin-top: 8px !important; }
      .mt-auto { margin-top: auto !important; }
      .me-2 { margin-right: 8px !important; }
      .me-3 { margin-right: 16px !important; }
      .pt-4 { padding-top: 24px !important; }
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
          <title>Proforma Invoice - ${activeRecord?.sale_order_no || activeRecord?.sale_no || "Print"}</title>
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

  // Customer display values
  const customerName = useMemo(() => {
    if (customer?.name) return customer.name;
    if (typeof activeRecord?.customer_id === "string" && activeRecord.customer_id)
      return activeRecord.customer_id;
    return "Customer Name";
  }, [customer, activeRecord]);

  const customerCityName = useMemo(() => {
    if (!customer) return "";
    if (typeof customer.city_id === "object" && customer.city_id?.name) {
      return customer.city_id.name;
    }
    if (customer.city_id) {
      const cId = String(customer.city_id);
      const match = cityList.find((c: any) => String(c.id || c._id) === cId);
      if (match?.name) return match.name;
    }
    if (typeof customer.city === "object" && customer.city?.name) {
      return customer.city.name;
    }
    if (typeof customer.city === "string" && customer.city) {
      return customer.city;
    }
    return "";
  }, [customer, cityList]);

  const customerStateRecord = useMemo(() => {
    if (!customer) return null;
    if (typeof customer.state_id === "object" && customer.state_id) {
      return customer.state_id;
    }
    if (customer.state_id) {
      const sId = String(customer.state_id);
      const match = stateList.find((s: any) => String(s.id || s._id) === sId);
      if (match) return match;
    }
    if (typeof customer.state === "object" && customer.state) {
      return customer.state;
    }
    if (typeof customer.city_id === "object" && customer.city_id?.state_id) {
      if (typeof customer.city_id.state_id === "object" && customer.city_id.state_id) {
        return customer.city_id.state_id;
      }
      const sId = String(customer.city_id.state_id);
      const match = stateList.find((s: any) => String(s.id || s._id) === sId);
      if (match) return match;
    } else if (customer.city_id) {
      const cId = String(customer.city_id);
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
    if (typeof customer.state === "string" && customer.state) {
      const match = stateList.find(
        (s: any) => String(s.name || "").trim().toLowerCase() === customer.state.trim().toLowerCase()
      );
      if (match) return match;
    }
    return null;
  }, [customer, stateList, cityList]);

  const customerStateName = useMemo(() => {
    if (customerStateRecord?.name) return String(customerStateRecord.name).trim();
    if (typeof customer?.state === "object" && customer.state?.name) {
      return String(customer.state.name).trim();
    }
    if (typeof customer?.state === "string" && customer.state) {
      return customer.state.trim();
    }
    return "";
  }, [customerStateRecord, customer]);

  const customerStateCode = useMemo(() => {
    if (customerStateRecord?.code) return String(customerStateRecord.code).trim();
    if (typeof customer?.state === "object" && customer.state?.code) {
      return String(customer.state.code).trim();
    }
    if (customer?.state_code || customer?.stateCode) {
      return String(customer.state_code || customer.stateCode).trim();
    }
    const gstin = String(customer?.gstin || "").trim();
    if (gstin && /^\d{2}/.test(gstin)) {
      return gstin.substring(0, 2);
    }
    return "";
  }, [customerStateRecord, customer]);

  const customerCountryName = useMemo(() => {
    if (!customer) return "";
    if (typeof customer.country_id === "object" && customer.country_id?.name) {
      return customer.country_id.name;
    }
    if (customer.country_id) {
      const coId = String(customer.country_id);
      const match = countryList.find((c: any) => String(c.id || c._id) === coId);
      if (match?.name) return match.name;
    }
    if (typeof customer.country === "object" && customer.country?.name) {
      return customer.country.name;
    }
    if (typeof customer.country === "string" && customer.country) {
      return customer.country;
    }
    return "";
  }, [customer, countryList]);

  const customerAddress = useMemo(() => {
    return customer?.address ? String(customer.address).trim() : "";
  }, [customer]);

  const customerFullAddress = useMemo(() => {
    const list: string[] = [];
    const addr = customerAddress.trim().replace(/,\s*$/, "");
    const city = customerCityName.trim().replace(/,\s*$/, "");
    const stateLabel = (
      customerStateName && customerStateCode
        ? `${customerStateName} (${customerStateCode})`
        : customerStateName
    ).trim().replace(/,\s*$/, "");
    const country = customerCountryName.trim().replace(/,\s*$/, "");

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
  }, [customerAddress, customerCityName, customerStateName, customerStateCode, customerCountryName]);

  const customerGstin = customer?.gstin || "";
  const customerPhone = customer?.phone || "";
  const customerEmail = customer?.email || "";

  const customerTaxLabel = useMemo(() => {
    const rawType = String(
      customer?.taxType || customer?.tax_type || (activeRecord as any)?.customer_id?.taxType || ""
    )
      .trim()
      .toUpperCase();
    if (rawType === "VAT") return "VAT No. :";
    if (rawType === "GST") return "GSTIN/UIN :";
    if (rawType) return `${rawType} Number :`;
    return "GSTIN/UIN :";
  }, [customer, activeRecord]);

  const invoicePaperContent = (
    <div id="saleorder-invoice-printable" className="p-3 p-md-4 bg-white text-dark">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #saleorder-invoice-printable,
          #saleorder-invoice-printable * {
            visibility: visible !important;
          }
          #saleorder-invoice-printable {
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
          .so-page {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
          }
          .so-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 0 !important;
          }
        }

        .so-box {
          border: 1px solid #000000 !important;
          background: #ffffff;
          color: #000000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.35;
        }

        .so-page {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
        }

        .so-border-top {
          border-top: 1px solid #000000 !important;
        }

        .so-border-bottom {
          border-bottom: 1px solid #000000 !important;
        }

        .so-border-right {
          border-right: 1px solid #000000 !important;
        }

        .so-disclaimer {
          border-top: 1px solid #000000 !important;
          border-bottom: 1px solid #000000 !important;
        }

        .so-table th,
        .so-table td {
          border-right: 1px solid #000000 !important;
          border-bottom: 1px solid #000000 !important;
          vertical-align: middle;
          padding: 6px 8px;
        }

        .so-table th:last-child,
        .so-table td:last-child {
          border-right: none !important;
        }

        .so-tax-inner-table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 0 !important;
          table-layout: fixed !important;
        }
        .so-tax-inner-table td {
          border-bottom: none !important;
          border-right: 1px solid #000000 !important;
          vertical-align: middle;
          padding: 6px 8px;
        }
        .so-tax-inner-table td:last-child {
          border-right: none !important;
        }
        td.so-tax-wrapper {
          padding: 0 !important;
          vertical-align: middle !important;
        }
      `}</style>

      {pageChunks.map((chunk, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;
        const pageNum = pageIndex + 1;

        return (
          <div
            key={`so-page-${pageIndex}`}
            className="so-box so-page"
            style={{
              marginBottom: isLastPage ? "0" : "24px",
            }}
          >
            {/* Top Header Bar */}
            <div
              className="d-flex align-items-center justify-content-between px-3 py-1 so-border-bottom"
              style={{ fontSize: "12px" }}
            >
              <div className="flex-1 text-start">
                Page : {pageNum}
                {totalPages > 1 ? ` of ${totalPages}` : ""}
              </div>
              <div className="flex-1 text-center fw-bold fs-15">Proforma Invoice</div>
              <div className="flex-1 text-end">Original/Duplicate</div>
            </div>

            {isFirstPage && (
              <>
              
                {/* Company Header: Centered Logo & Company Details */}
                <div className="so-border-bottom">
                  {companyLogo ? (
                    <div
                      className="d-flex align-items-center justify-content-center py-3 px-3"
                    >
                      <div
                        style={{
                          marginRight: "16px",
                          flexShrink: 0,
                          textAlign: "center",
                        }}
                      >
                        <Image
                          src={companyLogo}
                          alt={companyTitle || "Logo"}
                          width={90}
                          height={75}
                          style={{
                            maxHeight: "75px",
                            maxWidth: "90px",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            display: "inline-block",
                          }}
                          unoptimized
                          priority
                        />
                      </div>
                      <div className="text-start text-dark px-5">
                        <h2
                          className="fw-bold mb-1 text-dark"
                          style={{ fontSize: "22px", letterSpacing: "0.5px" }}
                        >
                          {companyTitle}
                        </h2>
                        <div className="text-dark" style={{ fontSize: "12px", lineHeight: "1.35" }}>
                          {companyAddressLine1 && <div>{companyAddressLine1}</div>}
                          {companyGstin && (
                            <div>
                              <span className="fw-semibold">GSTIN/UIN :</span> {companyGstin}
                            </div>
                          )}
                          {companyEmail && (
                            <div>
                              <span className="fw-semibold">E-mail :</span> {companyEmail}
                            </div>
                          )}
                          {companyPhone && (
                            <div>
                              <span className="fw-semibold">Phone :</span> {companyPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 px-3">
                      <h2
                        className="fw-bold mb-1 text-dark"
                        style={{ fontSize: "22px", letterSpacing: "0.5px" }}
                      >
                        {companyTitle}
                      </h2>
                      <div className="text-dark" style={{ fontSize: "12px", lineHeight: "1.35" }}>
                        {companyAddressLine1 && <div>{companyAddressLine1}</div>}
                        {companyGstin && (
                          <div>
                            <span className="fw-semibold">GSTIN/UIN :</span> {companyGstin}
                          </div>
                        )}
                        {companyEmail && (
                          <div>
                            <span className="fw-semibold">E-mail :</span> {companyEmail}
                          </div>
                        )}
                        {companyPhone && (
                          <div>
                            <span className="fw-semibold">Phone :</span> {companyPhone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Middle Two-Column Grid: TO (Customer) & Proforma Invoice Details */}
                <table className="w-100" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <tbody>
                    <tr style={{ height: "50%" }}>
                      {/* Left Column: Customer */}
                      <td
                        rowSpan={2}
                        className="so-border-right so-border-bottom p-3 text-dark"
                        style={{ width: "50%", verticalAlign: "top" }}
                      >
                        <div className="fw-bold mb-1" style={{ fontSize: "12px" }}>
                          TO
                        </div>
                        <div className="fw-bold fs-14 text-dark">{customerName}</div>
                        {customerFullAddress && <div className="mt-1">{customerFullAddress}</div>}
                        {customerGstin && (
                          <div className="mt-1">
                            <span className="fw-semibold">{customerTaxLabel}</span> {customerGstin}
                          </div>
                        )}
                        {customerPhone && (
                          <div>
                            <span className="fw-semibold">Phone :</span> {customerPhone}
                          </div>
                        )}
                        {customerEmail && (
                          <div>
                            <span className="fw-semibold">E-mail :</span> {customerEmail}
                          </div>
                        )}
                      </td>

                      {/* Right Column: Proforma Invoice Info Table Row 1 */}
                      <td
                        className="px-3 py-2 fw-bold so-border-right so-border-bottom"
                        style={{ width: "25%", verticalAlign: "middle" }}
                      >
                        Proforma Invoice No.
                      </td>
                      <td
                        className="px-3 py-2 font-monospace fw-bold so-border-bottom"
                        style={{ width: "25%", verticalAlign: "middle" }}
                      >
                        {activeRecord?.sale_order_no || activeRecord?.sale_no || "—"}
                      </td>
                    </tr>

                    <tr style={{ height: "50%" }}>
                      <td
                        className="px-3 py-2 fw-bold so-border-right so-border-bottom"
                        style={{ width: "25%", verticalAlign: "middle" }}
                      >
                        Invoice Date
                      </td>
                      <td
                        className="px-3 py-2 so-border-bottom"
                        style={{ width: "25%", verticalAlign: "middle" }}
                      >
                        {formatOrderDate(activeRecord?.invoice_date || activeRecord?.order_date)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Table View */}
            <div className="w-100">
              <table
                className="w-100 so-table"
                style={{ borderCollapse: "collapse", tableLayout: "fixed" }}
              >
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
                      <th className="text-center fw-bold">SL. No.</th>
                      <th className="text-start fw-bold">Description</th>
                      <th className="text-center fw-bold">HSN/SAC</th>
                      <th className="text-center fw-bold">QTY</th>
                      <th className="text-center fw-bold">Unit</th>
                      <th className="text-end fw-bold">Rate</th>
                      {hasDiscount && <th className="text-end fw-bold">Disc.</th>}
                      <th className="text-end fw-bold">Amount</th>
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
                          <td
                            className="text-start fw-semibold text-dark"
                            style={{ wordBreak: "break-word" }}
                          >
                            {getServiceName(item)}
                          </td>
                          <td className="text-center text-dark">{getHsnCode(item)}</td>
                          <td className="text-center font-monospace text-dark">
                            {item.quantity || 1}
                          </td>
                          <td className="text-center text-dark">{getUnitName(item) || "—"}</td>
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
                      <td
                        colSpan={hasDiscount ? 8 : 7}
                        className="text-center py-4 text-muted"
                      >
                        No items recorded for this sale order.
                      </td>
                    </tr>
                  ) : null}

                  {!isLastPage && (
                    <tr className="so-border-bottom">
                      <td
                        colSpan={hasDiscount ? 8 : 7}
                        className="py-2 px-3 text-end text-muted fst-italic"
                        style={{ fontSize: "11px", background: "#fafafa" }}
                      >
                        Continued on Page {pageNum + 1}...
                      </td>
                    </tr>
                  )}

                  {isLastPage && (
                    <>
                      {(Number(activeRecord?.tax_amount || 0) > 0 ||
                        Number(activeRecord?.discount_amount || 0) > 0 ||
                        Number(activeRecord?.round_off || 0) !== 0) && (
                        <>
                          <tr className="so-border-bottom">
                            <td
                              colSpan={hasDiscount ? 7 : 6}
                              className="py-1 px-3 text-end fw-semibold so-border-right text-muted"
                            >
                              Total ({currencyCode}):
                            </td>
                            <td className="py-1 px-2 text-end font-monospace fw-semibold text-dark">
                              {formatNum(activeRecord?.total_amount)}
                            </td>
                          </tr>

                          {Number(activeRecord?.discount_amount || 0) > 0 && (
                            <tr className="so-border-bottom">
                              <td
                                colSpan={hasDiscount ? 7 : 6}
                                className="py-1 px-3 text-end fw-semibold so-border-right text-danger"
                              >
                                Discount (
                                {activeRecord?.discount_type === "percentage"
                                  ? `${activeRecord.discount}%`
                                  : "Fixed"}
                                ):
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
                                <tr className="so-border-bottom">
                                  <td
                                    colSpan={hasDiscount ? 7 : 6}
                                    className="so-tax-wrapper so-border-right"
                                  >
                                    <table className="so-tax-inner-table">
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
                              <tr className="so-border-bottom">
                                <td
                                  colSpan={hasDiscount ? 7 : 6}
                                  className="py-1 px-3 text-end fw-semibold so-border-right text-dark"
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
                            <tr className="so-border-bottom">
                              <td
                                colSpan={hasDiscount ? 7 : 6}
                                className="py-1 px-3 text-end fw-semibold so-border-right text-muted"
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

                      <tr className="so-border-bottom">
                        <td
                          colSpan={hasDiscount ? 6 : 5}
                          className="py-2 px-3 text-start so-border-right"
                          style={{ verticalAlign: "middle" }}
                        >
                          <span className="fw-bold">In Word:</span>{" "}
                          <span className="fw-bold text-dark text-capitalize ms-1">
                            {numberToWords(Number(activeRecord?.final_amount || 0), currencyCode)}
                          </span>
                        </td>
                        <td
                          className="py-2 px-2 text-end fw-bold so-border-right text-dark"
                          style={{ verticalAlign: "middle", lineHeight: "1.2" }}
                        >
                          <div>Net Total ({currencyCode}):</div>
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

            {/* Bottom Signature & Details Section: ONLY on last page */}
            {isLastPage && (
              <>
                {/* Remarks Row: in one full-width row before Authorized Signatory / Details section */}
                {activeRecord?.remarks && (
                <div
                  className="px-3 py-1 text-secondary so-border-bottom"
                  style={{
                    fontSize: "11px",
                    lineHeight: "1.4",
                    minHeight: "26px",
                  }}
                >
                  <span className="fw-bold text-dark">Remarks:</span>{" "}
                  <span>{activeRecord?.remarks || ""}</span>
                </div>
                )}

                {/* Bank Details, Terms & Conditions (if present), and Authorized Signatory */}
                <table className="w-100" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <tbody>
                    <tr>
                      {/* Column 1: Bank Details */}
                      {hasBankDetails && (
                        <td
                          className="p-3 text-dark so-border-right"
                          style={{
                            width: hasTerms ? "20%" : "65%",
                            verticalAlign: "top",
                            fontSize: "11px",
                            lineHeight: "1.45",
                          }}
                        >
                          <div
                            className="fw-bold text-dark mb-1"
                            style={{ fontSize: "12px", textDecoration: "underline" }}
                          >
                            Bank Details:
                          </div>
                          {bankName && (
                            <div>
                              <span className="fw-semibold">Bank Name:</span> {bankName}
                            </div>
                          )}
                          {branchName && (
                            <div>
                              <span className="fw-semibold">Branch Name:</span> {branchName}
                            </div>
                          )}
                          {accountNo && (
                            <div>
                              <span className="fw-semibold">Account No:</span> {accountNo}
                            </div>
                          )}
                          {ifscCode && (
                            <div>
                              <span className="fw-semibold">IFSC Code:</span> {ifscCode}
                            </div>
                          )}
                        </td>
                      )}

                      {/* If bank details are not configured but terms are also not configured */}
                      {!hasBankDetails && !hasTerms && (
                        <td
                          className="p-3 text-dark so-border-right"
                          style={{
                            width: "65%",
                            verticalAlign: "top",
                            fontSize: "11px",
                            lineHeight: "1.45",
                          }}
                        >
                          <div
                            className="fw-bold text-dark mb-1"
                            style={{ fontSize: "12px", textDecoration: "underline" }}
                          >
                            Bank Details:
                          </div>
                          <div className="text-muted">—</div>
                        </td>
                      )}

                      {/* Column 2: Terms & Conditions - ONLY if hasTerms is true */}
                      {hasTerms && (
                        <td
                          className="p-3 text-dark so-border-right"
                          style={{
                            width: hasBankDetails ? "34%" : "65%",
                            verticalAlign: "top",
                            fontSize: "11px",
                            lineHeight: "1.45",
                          }}
                        >
                          <div
                            className="fw-bold text-dark mb-1"
                            style={{ fontSize: "12px", textDecoration: "underline" }}
                          >
                            Terms & Conditions:
                          </div>
                          <div className="text-muted" style={{ whiteSpace: "pre-line" }}>
                            {termsCondition}
                          </div>
                        </td>
                      )}

                      {/* Column 3: Authorized Signatory */}
                      <td
                        className="p-3 text-dark text-end"
                        style={{
                          width: hasBankDetails && hasTerms ? "20%" : "35%",
                          verticalAlign: "top",
                          fontSize: "11px",
                        }}
                      >
                        <div
                          className="d-flex flex-column justify-content-between h-100"
                          style={{ minHeight: "140px" }}
                        >
                          <div>
                            <div className="fst-italic text-muted" style={{ fontSize: "12px" }}>
                              E. & O.E.
                            </div>
                            <div className="fw-bold text-dark fs-13">For {companyTitle}</div>
                          </div>

                          <div className="pt-4 mt-auto">
                            <div className="fw-bold text-dark" style={{ fontSize: "12px" }}>
                              Authorized Signatory
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Computer Generated Invoice Disclaimer (Full Width with Top & Bottom Border) */}
                <div
                  className="w-100 text-center py-2 text-muted fst-italic so-border-top so-border-bottom so-disclaimer"
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

  if (standalone) {
    return (
      <div className="sale-invoice-standalone">
        <div className="d-flex align-items-center justify-content-between p-3 bg-light border-bottom mb-4 rounded no-print">
          <div className="d-flex align-items-center gap-2">
            <Icon icon="file-text" className="text-primary fs-20" />
            <h5 className="mb-0 fw-bold">Proforma Invoice</h5>
            <span className="badge bg-secondary-subtle text-secondary font-monospace">
              {activeRecord?.sale_order_no || activeRecord?.sale_no || "SO/—"}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={loading}
              className="d-flex align-items-center gap-1 shadow-sm"
            >
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                <Icon icon="printer" className="fs-16" />
              )}
              Print Invoice
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="text-muted mt-2">Loading sale order details...</div>
          </div>
        ) : (
          invoicePaperContent
        )}
      </div>
    );
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      scrollable
      backdrop="static"
      className="sale-invoice-modal"
    >
      <Modal.Header closeButton className="bg-light py-2 px-3 border-bottom no-print">
        <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2">
          <Icon icon="printer" className="text-primary fs-18" />
          <span>Proforma Invoice</span>
          {(activeRecord?.sale_order_no || activeRecord?.sale_no) && (
            <span className="badge bg-primary-subtle text-primary font-monospace fs-12">
              {activeRecord?.sale_order_no || activeRecord?.sale_no}
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
          <span>
            Tip: Click <strong>Print Invoice</strong> to print or export as PDF.
          </span>
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
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <Icon icon="printer" className="fs-14" />
            )}
            Print Invoice
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default SaleorderInvoice;
