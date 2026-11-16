"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Icon from "@/components/wrappers/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  FormCheck,
  FormControl,
  FormLabel,
  FormSelect,
  OverlayTrigger,
  Row,
  Table,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addPurchase,
  updatePurchase,
  getPurchaseById,
  fetchNextPurchaseNo,
  generateDefaultPurchaseNo,
  getFinancialYear,
  PurchaseRecord,
  PurchaseItem,
} from "@/redux/slices/admin/purchaseSlice";
import {
  fetchPurchaseorder,
  getPurchaseorderById,
  PurchaseorderRecord,
} from "@/redux/slices/admin/purchaseorderSlice";
import { fetchPartys, PartyRecord } from "@/redux/slices/admin/partySlice";
import { fetchServices, ServiceRecord } from "@/redux/slices/admin/serviceSlice";
import { fetchCategorys } from "@/redux/slices/admin/categorySlice";
import { fetchSubcategorys } from "@/redux/slices/admin/subcategorySlice";
import { fetchUnit, UnitRecord } from "@/redux/slices/admin/unitSlice";
import { fetchCurrency, CurrencyRecord } from "@/redux/slices/admin/currencySlice";
import { fetchTaxrate, TaxrateRecord } from "@/redux/slices/admin/taxrateSlice";
import PurchaseInvoice from "./PurchaseInvoice";
import PurchaseOrderSelectList from "./PurchaseOrderSelectList";
import useFinYearFilter from "@/hooks/useFinYearFilter";
import { useSettingsContext, setting as getGlobalSetting } from "@/context/useSettingsContext";
import { formatServiceDisplayLabel } from "@/utils/helpers";

interface PurchaseFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

const formatDateForInput = (d?: string | Date | null) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const addOneMonth = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) {
      const d = new Date(dateStr);
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split("T")[0];
    }
    let targetMonth = month + 1;
    let targetYear = year;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    const targetDay = Math.min(day, daysInTargetMonth);
    const mStr = String(targetMonth).padStart(2, "0");
    const dStr = String(targetDay).padStart(2, "0");
    return `${targetYear}-${mStr}-${dStr}`;
  } catch {
    return "";
  }
};

const PurchaseForm: React.FC<PurchaseFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { currentRecord, records: purchaseRecords, loading: purchaseLoading } = useAppSelector(
    (state: any) => state.purchase || { currentRecord: null, records: [], loading: false }
  );
  const { records: partyList } = useAppSelector(
    (state: any) => state.party || { records: [] }
  );
  const { records: serviceList } = useAppSelector(
    (state: any) => state.service || { records: [] }
  );
  const { records: categoryList } = useAppSelector(
    (state: any) => state.category || { records: [] }
  );
  const { records: subcategoryList } = useAppSelector(
    (state: any) => state.subcategory || { records: [] }
  );
  const { records: unitList } = useAppSelector(
    (state: any) => state.unit || { records: [] }
  );
  const { records: currencyList } = useAppSelector(
    (state: any) => state.currency || { records: [] }
  );
  const { records: taxrateList } = useAppSelector(
    (state: any) => state.taxrate || { records: [] }
  );

  // Read active financial year filter (defaults to current FY or saved choice)
  const { selectedFinYear } = useFinYearFilter();

  // Read purchase prefix from website settings
  const { setting } = useSettingsContext();
  const purchasePrefix = useMemo(() => {
    const raw = setting("prefixes.purchase") || "BILL/P";
    return String(raw).replace(/\/+$/, "").trim() || "BILL/P";
  }, [setting]);

  const effectiveAddFY = useMemo(() => {
    if (selectedFinYear && selectedFinYear !== "All") {
      return selectedFinYear;
    }
    if (typeof window !== "undefined") {
      try {
        const stored =
          localStorage.getItem("global_fin_year");
        if (stored && stored !== "All" && stored.trim()) {
          return stored.trim();
        }
      } catch (e) {
        // ignore
      }
    }
    return getFinancialYear();
  }, [selectedFinYear]);

  const [formData, setFormData] = useState<PurchaseRecord>(() => {
    const today = new Date().toISOString().split("T")[0];
    const initialDueDate = addOneMonth(today);
    let initialFY = getFinancialYear(today);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("global_fin_year");
        if (stored && stored !== "All" && stored.trim()) {
          initialFY = stored.trim();
        }
      } catch (e) {
        // ignore
      }
    }
    const initialPrefix =
      typeof window !== "undefined"
        ? String(getGlobalSetting("prefixes.purchase")).replace(/\/+$/, "").trim()
        : "BILL/P";

    return {
      id: recordId || "",
      purchase_no: mode === "add" ? generateDefaultPurchaseNo([], today, initialFY, initialPrefix) : "",
      purchaseorder_id: null,
      fin_year: initialFY,
      vendor_id: "",
      currency_id: "",
      tax_type: "GST",
      tax_percentage: 0,
      invoice_date: today,
      due_date: mode === "add" ? initialDueDate : "",
      invoice_no: "",
      total_amount: 0,
      discount_type: "fixed",
      discount: 0,
      discount_amount: 0,
      tax_amount: 0,
      round_off: 0,
      final_amount: 0,
      remarks: "",
      isActive: true,
    };
  });

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      service_id: "",
      unit_id: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      total: 0,
    },
  ]);

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Purchase Proforma selection state (for prepopulating Purchase in Add mode)
  const [selectedPo, setSelectedPo] = useState<PurchaseorderRecord | null>(null);
  const [loadingPoId, setLoadingPoId] = useState<string | null>(null);
  const [showPoSelector, setShowPoSelector] = useState<boolean>(() => !isEdit);
  const [loadingInitialPo, setLoadingInitialPo] = useState<boolean>(false);
  const invoiceDateDirtyRef = React.useRef<boolean>(false);

  // Fetch dependencies
  useEffect(() => {
    if (partyList.length === 0) dispatch(fetchPartys());
    if (serviceList.length === 0) dispatch(fetchServices());
    if (categoryList.length === 0) dispatch(fetchCategorys());
    if (subcategoryList.length === 0) dispatch(fetchSubcategorys());
    if (unitList.length === 0) dispatch(fetchUnit());
    if (currencyList.length === 0) dispatch(fetchCurrency());
    if (taxrateList.length === 0) dispatch(fetchTaxrate());
  }, [dispatch, partyList.length, serviceList.length, categoryList.length, subcategoryList.length, unitList.length, currencyList.length, taxrateList.length]);

  // If edit mode, fetch purchase by ID; If add mode, set/fetch BILL/P/YYYY-YYYY/N format using default/selected fin_year
  useEffect(() => {
    if (isEdit && recordId) {
      dispatch(getPurchaseById(recordId));
    } else if (!isEdit) {
      const invDate = formData.invoice_date || new Date().toISOString().split("T")[0];
      const fy = effectiveAddFY;

      // 1. Instantly calculate based on local Redux records using prefix from settings
      const defaultNo = generateDefaultPurchaseNo(purchaseRecords, invDate, fy, purchasePrefix);
      setFormData((prev) => ({
        ...prev,
        fin_year: fy,
        purchase_no:
          prev.purchase_no && prev.purchase_no.startsWith(`${purchasePrefix}/`)
            ? prev.purchase_no
            : defaultNo,
      }));

      // 2. Fetch authoritative next purchase number from server using prefix from settings
      dispatch(fetchNextPurchaseNo({ invoiceDate: invDate, finYear: fy, prefix: purchasePrefix }))
        .unwrap()
        .then((serverNo) => {
          if (serverNo) {
            setFormData((prev) => ({ ...prev, purchase_no: serverNo }));
          }
        })
        .catch(() => {
          // Keep local fallback
        });
    }
  }, [isEdit, recordId, dispatch, purchaseRecords.length, effectiveAddFY, purchasePrefix]);

  // Load record data into form
  useEffect(() => {
    if (isEdit && currentRecord && (currentRecord.id === recordId || currentRecord._id === recordId)) {
      let initialVendorId = "";
      if (typeof currentRecord.vendor_id === "object" && currentRecord.vendor_id) {
        initialVendorId = currentRecord.vendor_id.id || currentRecord.vendor_id._id || "";
      } else if (typeof currentRecord.vendor_id === "string") {
        initialVendorId = currentRecord.vendor_id;
      }

      let initialCurrencyId = "";
      if (typeof currentRecord.currency_id === "object" && currentRecord.currency_id) {
        initialCurrencyId = currentRecord.currency_id.id || currentRecord.currency_id._id || "";
      } else if (typeof currentRecord.currency_id === "string") {
        initialCurrencyId = currentRecord.currency_id;
      }

      let initialPurchaseorderId: string | null = null;
      if (typeof currentRecord.purchaseorder_id === "object" && currentRecord.purchaseorder_id) {
        initialPurchaseorderId =
          currentRecord.purchaseorder_id.id || currentRecord.purchaseorder_id._id || null;
      } else if (typeof currentRecord.purchaseorder_id === "string" && currentRecord.purchaseorder_id.trim()) {
        initialPurchaseorderId = currentRecord.purchaseorder_id.trim();
      }

      const invDate = formatDateForInput(currentRecord.invoice_date) || new Date().toISOString().split("T")[0];
      const fy = currentRecord.fin_year || getFinancialYear(invDate);

      let taxPct = Number(currentRecord.tax_percentage) || 0;
      if (!taxPct && currentRecord.tax_amount && currentRecord.total_amount) {
        const taxable = Math.max(0, Number(currentRecord.total_amount) - (Number(currentRecord.discount_amount) || 0));
        if (taxable > 0) {
          taxPct = Number(((Number(currentRecord.tax_amount) / taxable) * 100).toFixed(2));
        }
      }

      invoiceDateDirtyRef.current = false;

      setFormData({
        id: currentRecord.id || currentRecord._id || recordId,
        _id: currentRecord._id || currentRecord.id || recordId,
        purchase_no: currentRecord.purchase_no || "",
        purchaseorder_id: initialPurchaseorderId,
        fin_year: fy,
        vendor_id: initialVendorId,
        currency_id: initialCurrencyId,
        tax_type: currentRecord.tax_type || "GST",
        tax_percentage: taxPct,
        invoice_date: invDate,
        due_date: formatDateForInput(currentRecord.due_date),
        invoice_no: currentRecord.invoice_no || "",
        total_amount: Number(currentRecord.total_amount) || 0,
        discount_type: currentRecord.discount_type || "fixed",
        discount: Number(currentRecord.discount) || 0,
        discount_amount: Number(currentRecord.discount_amount) || 0,
        tax_amount: Number(currentRecord.tax_amount) || 0,
        round_off: Number(currentRecord.round_off) || 0,
        final_amount: Number(currentRecord.final_amount) || 0,
        remarks: currentRecord.remarks || "",
        isActive: currentRecord.isActive !== undefined ? currentRecord.isActive : true,
      });

      const loadedItems = currentRecord.items || currentRecord.purchase_details || [];
      if (Array.isArray(loadedItems) && loadedItems.length > 0) {
        setItems(
          loadedItems.map((item: any) => ({
            id: item.id || item._id,
            _id: item._id || item.id,
            service_id:
              typeof item.service_id === "object" && item.service_id
                ? item.service_id.id || item.service_id._id || ""
                : item.service_id || "",
            unit_id:
              typeof item.unit_id === "object" && item.unit_id
                ? item.unit_id.id || item.unit_id._id || ""
                : item.unit_id || "",
            quantity: Number(item.quantity) || 1,
            rate: Number(item.rate) || 0,
            discount: Number(item.discount) || 0,
            total: Number(item.total) || 0,
          }))
        );
      }
    }
  }, [isEdit, currentRecord, recordId]);

  // Vendor options (from Party module)
  const vendorOptions: DropdownOption[] = useMemo(() => {
    return partyList
      .filter((p: PartyRecord) => {
        const type = (p.partyType || "").toLowerCase();
        return type === "vendor" || type === "both" || !type;
      })
      .map((p: PartyRecord) => {
        const phone = p.phone ? ` (${p.phone})` : "";
        return {
          value: String(p.id || p._id || ""),
          label: `${p.name || "Unnamed Party"}${phone}`,
        };
      });
  }, [partyList]);

  const selectedVendorId = useMemo(() => {
    if (!formData.vendor_id) return "";
    if (typeof formData.vendor_id === "object") {
      return String((formData.vendor_id as any)._id || (formData.vendor_id as any).id || "");
    }
    return String(formData.vendor_id);
  }, [formData.vendor_id]);

  const selectedVendorOption = useMemo(() => {
    if (!selectedVendorId) return null;
    const match = vendorOptions.find((v) => v.value === selectedVendorId);
    if (match) return match;
    const rawMatch = partyList.find((p: any) => String(p.id || p._id) === selectedVendorId);
    if (rawMatch) return { value: selectedVendorId, label: rawMatch.name };
    const poVendor = selectedPo?.vendor_id;
    if (
      typeof poVendor === "object" &&
      poVendor &&
      String((poVendor as any).id || (poVendor as any)._id || "") === selectedVendorId
    ) {
      return { value: selectedVendorId, label: (poVendor as any).name || "Selected Vendor" };
    }
    return { value: selectedVendorId, label: "Selected Vendor" };
  }, [selectedVendorId, vendorOptions, partyList, selectedPo]);

  const selectedVendorRecord = useMemo(() => {
    if (!selectedVendorId) return null;
    const partyMatch = partyList.find((p: any) => String(p.id || p._id) === selectedVendorId);
    if (partyMatch) return partyMatch;
    const poVendor = selectedPo?.vendor_id;
    if (
      typeof poVendor === "object" &&
      poVendor &&
      String((poVendor as any).id || (poVendor as any)._id || "") === selectedVendorId
    ) {
      return poVendor as any;
    }
    return null;
  }, [selectedVendorId, partyList, selectedPo]);

  // Currency options (from Currency module)
  const currencyOptions: DropdownOption[] = useMemo(() => {
    return currencyList
      .filter((c: CurrencyRecord) => c.isActive !== false)
      .map((c: CurrencyRecord) => {
        const code = c.code ? ` (${c.code})` : "";
        const sym = c.symbol ? ` ${c.symbol}` : "";
        return {
          value: String(c.id || c._id || ""),
          label: `${c.name || "Currency"}${code}${sym}`,
        };
      });
  }, [currencyList]);

  const selectedCurrencyId = useMemo(() => {
    if (!formData.currency_id) return "";
    if (typeof formData.currency_id === "object") {
      return String((formData.currency_id as any)._id || (formData.currency_id as any).id || "");
    }
    return String(formData.currency_id);
  }, [formData.currency_id]);

  const selectedCurrencyOption = useMemo(() => {
    if (!selectedCurrencyId) return null;
    const match = currencyOptions.find((c) => c.value === selectedCurrencyId);
    if (match) return match;
    const rawMatch = currencyList.find((c: any) => String(c.id || c._id) === selectedCurrencyId);
    if (rawMatch) return { value: selectedCurrencyId, label: rawMatch.name || "Selected Currency" };
    const poCurrency = selectedPo?.currency_id;
    if (
      typeof poCurrency === "object" &&
      poCurrency &&
      String((poCurrency as any).id || (poCurrency as any)._id || "") === selectedCurrencyId
    ) {
      return { value: selectedCurrencyId, label: (poCurrency as any).name || (poCurrency as any).code || "Selected Currency" };
    }
    return null;
  }, [selectedCurrencyId, currencyOptions, currencyList, selectedPo]);

  const currentCurrencyRecord = useMemo(() => {
    if (!selectedCurrencyId) return null;
    const match = currencyList.find((c: any) => String(c.id || c._id) === selectedCurrencyId);
    if (match) return match;
    const poCurrency = selectedPo?.currency_id;
    if (
      typeof poCurrency === "object" &&
      poCurrency &&
      String((poCurrency as any).id || (poCurrency as any)._id || "") === selectedCurrencyId
    ) {
      return poCurrency as any;
    }
    return null;
  }, [selectedCurrencyId, currencyList, selectedPo]);

  const currencySymbol = useMemo(() => {
    if (currentCurrencyRecord?.symbol) return currentCurrencyRecord.symbol;
    if (currentCurrencyRecord?.code) return currentCurrencyRecord.code;
    return "₹";
  }, [currentCurrencyRecord]);

  // Handle vendor change: auto-set Currency, Tax Type (GST/VAT), and Tax Percentage
  const handleVendorChange = (vendorId: string) => {
    if (!vendorId) {
      handleFieldChange("vendor_id", "");
      return;
    }

    const vendor = partyList.find((p: any) => String(p.id || p._id) === String(vendorId));
    let newCurrencyId = formData.currency_id || "";
    let newTaxType = formData.tax_type || "GST";
    let newTaxPct = Number(formData.tax_percentage) || 0;

    if (vendor) {
      // 1. Currency from vendor
      if (vendor.currency_id) {
        if (typeof vendor.currency_id === "object") {
          newCurrencyId = String(vendor.currency_id.id || vendor.currency_id._id || "");
        } else {
          newCurrencyId = String(vendor.currency_id);
        }
      }

      // 2. Tax Type from vendor
      const vTax = (vendor.taxType || vendor.tax_type || "").toUpperCase();
      newTaxType = vTax === "VAT" ? "VAT" : "GST";

      // 3. Tax Rate from taxrate module for this taxType
      const defaultTax = (taxrateList || []).find(
        (t: any) =>
          t.isActive !== false &&
          (t.taxType || "GST").toUpperCase() === newTaxType &&
          t.isDefault &&
          t.rate !== undefined
      );

      if (defaultTax) {
        newTaxPct = Number(defaultTax.rate);
      } else {
        newTaxPct = newTaxType === "VAT" ? 5 : 18;
      }
    }

    setFormData((prev) => ({
      ...prev,
      vendor_id: vendorId,
      currency_id: newCurrencyId || prev.currency_id || "",
      tax_type: newTaxType,
      tax_percentage: newTaxPct,
    }));

    if (validationErrors.vendor_id) {
      setValidationErrors((prev) => ({ ...prev, vendor_id: "" }));
    }
  };

  // Service options (from Service module: Service Name - Category Name - Subcategory Name)
  const serviceOptions: DropdownOption[] = useMemo(() => {
    return serviceList
      .filter((s: ServiceRecord) => s.isActive !== false)
      .map((s: ServiceRecord) => ({
        value: String(s.id || s._id || ""),
        label: formatServiceDisplayLabel(
          s,
          serviceList,
          categoryList,
          subcategoryList,
          s.name || "Unnamed Service",
        ),
      }));
  }, [serviceList, categoryList, subcategoryList]);

  // Unit options (from Unit module)
  const unitOptions: DropdownOption[] = useMemo(() => {
    return unitList
      .filter((u: UnitRecord) => u.isActive !== false)
      .map((u: UnitRecord) => ({
        value: String(u.id || u._id || ""),
        label: u.name || "Unnamed Unit",
      }));
  }, [unitList]);

  // Current tax regime dynamically derived from selected vendor
  const currentTaxType = useMemo(() => {
    if (selectedVendorRecord) {
      const vTax = (selectedVendorRecord.taxType || selectedVendorRecord.tax_type || "").toUpperCase();
      return vTax === "VAT" ? "VAT" : "GST";
    }
    return (formData.tax_type || "GST").toUpperCase() === "VAT" ? "VAT" : "GST";
  }, [selectedVendorRecord, formData.tax_type]);

  // Quick percentage slabs dynamically obtained from Taxrate module
  const taxSlabs: number[] = useMemo(() => {
    const activeRates = (taxrateList || [])
      .filter(
        (r: TaxrateRecord) =>
          r.isActive !== false &&
          (r.taxType || "GST").toUpperCase() === currentTaxType &&
          r.rate !== undefined &&
          r.rate !== null
      )
      .map((r: TaxrateRecord) => Number(r.rate));

    if (activeRates.length > 0) {
      return Array.from(new Set<number>(activeRates)).sort((a: number, b: number) => a - b);
    }
    return currentTaxType === "VAT" ? [0, 5, 10, 12, 15] : [0, 5, 12, 18, 28];
  }, [currentTaxType, taxrateList]);

  // Add Item Row
  const handleAddItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        service_id: "",
        unit_id: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        total: 0,
      },
    ]);
  }, []);

  // Remove Item Row
  const handleRemoveItem = useCallback((indexToRemove: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  }, []);

  // Item Field Change
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      // Recalculate row total
      const qty = Number(current.quantity) || 0;
      const rate = Number(current.rate) || 0;
      const disc = Number(current.discount) || 0;
      const subtotal = qty * rate;
      const rowTotal = Math.max(0, subtotal - disc);
      current.total = Number(rowTotal.toFixed(2));

      updated[index] = current;
      return updated;
    });
  };

  // Recalculate Totals whenever items, discount, discount_type, tax_percentage, or round_off change
  useEffect(() => {
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const subTotal = Number(totalAmount.toFixed(2));

    // Discount Amount
    const discInput = Number(formData.discount) || 0;
    let discAmount = 0;
    if (formData.discount_type === "percentage") {
      discAmount = Number(((subTotal * discInput) / 100).toFixed(2));
    } else {
      discAmount = Math.min(discInput, subTotal);
    }
    discAmount = Number(discAmount.toFixed(2));

    // Taxable base
    const taxableAmount = Math.max(0, subTotal - discAmount);

    // Tax amount calculated from tax_percentage
    const taxPct = Number(formData.tax_percentage) || 0;
    const taxAmount = Number(((taxableAmount * taxPct) / 100).toFixed(2));

    const netBeforeRound = taxableAmount + taxAmount;

    // Final amount
    const roundOff = Number(Number(formData.round_off || 0).toFixed(2));
    const finalAmount = Number(Math.max(0, netBeforeRound + roundOff).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      total_amount: subTotal,
      discount_amount: discAmount,
      tax_amount: taxAmount,
      final_amount: finalAmount,
    }));
  }, [items, formData.discount, formData.discount_type, formData.tax_percentage, formData.round_off]);

  const handleAutoRoundOff = () => {
    const subTotal = formData.total_amount || 0;
    const discAmount = formData.discount_amount || 0;
    const taxAmount = formData.tax_amount || 0;
    const net = subTotal - discAmount + taxAmount;
    const rounded = Math.round(net);
    const diff = Number((rounded - net).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      round_off: diff,
    }));
  };

  const handleFieldChange = (field: keyof PurchaseRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const selectedPurchaseorderId = useMemo(() => {
    if (!formData.purchaseorder_id) return "";
    if (typeof formData.purchaseorder_id === "object") {
      return String(
        (formData.purchaseorder_id as any)._id ||
          (formData.purchaseorder_id as any).id ||
          ""
      );
    }
    return String(formData.purchaseorder_id);
  }, [formData.purchaseorder_id]);

  const linkedPoNo = useMemo(() => {
    if (selectedPo) {
      return selectedPo.purchase_order_no || selectedPo.purchase_no || "";
    }
    if (
      isEdit &&
      currentRecord?.purchaseorder_id &&
      typeof currentRecord.purchaseorder_id === "object"
    ) {
      return (
        (currentRecord.purchaseorder_id as any).purchase_order_no ||
        (currentRecord.purchaseorder_id as any).purchase_no ||
        ""
      );
    }
    return "";
  }, [selectedPo, isEdit, currentRecord]);

  const handleInvoiceDateChange = (dateVal: string) => {
    invoiceDateDirtyRef.current = true;
    const dateFY = getFinancialYear(dateVal || new Date());
    const effectiveFY = (selectedFinYear && selectedFinYear !== "All") ? selectedFinYear : dateFY;
    setFormData((prev) => {
      const updated = {
        ...prev,
        invoice_date: dateVal,
        fin_year: effectiveFY,
      };
      if (!isEdit) {
        updated.due_date = addOneMonth(dateVal);
        if (!prev.purchase_no || prev.purchase_no.startsWith(`${purchasePrefix}/`)) {
          updated.purchase_no = generateDefaultPurchaseNo(purchaseRecords, dateVal, effectiveFY, purchasePrefix);
        }
      }
      return updated;
    });

    if (validationErrors.invoice_date) {
      setValidationErrors((prev) => ({ ...prev, invoice_date: "" }));
    }

    if (!isEdit && dateVal) {
      dispatch(fetchNextPurchaseNo({ invoiceDate: dateVal, finYear: effectiveFY, prefix: purchasePrefix }))
        .unwrap()
        .then((serverNo) => {
          if (serverNo) {
            setFormData((prev) => ({ ...prev, purchase_no: serverNo }));
          }
        })
        .catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.purchase_no?.trim()) {
      errors.purchase_no = "Purchase number is required";
    }

    if (!selectedVendorId) {
      errors.vendor_id = "Vendor is required";
    }

    if (!formData.invoice_date) {
      errors.invoice_date = "Invoice date is required";
    }

    // Validate Items
    if (!items || items.length === 0) {
      errors.items = "Please add at least one item";
    } else {
      let hasItemError = false;
      items.forEach((item, idx) => {
        const sId = typeof item.service_id === "object" ? (item.service_id as any)._id || (item.service_id as any).id : item.service_id;
        const uId = typeof item.unit_id === "object" ? (item.unit_id as any)._id || (item.unit_id as any).id : item.unit_id;
        if (!sId) {
          errors[`item_service_${idx}`] = "Service is required";
          hasItemError = true;
        }
        if (!uId) {
          errors[`item_unit_${idx}`] = "Unit is required";
          hasItemError = true;
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          errors[`item_qty_${idx}`] = "Qty > 0";
          hasItemError = true;
        }
      });
      if (hasItemError) {
        errors.items = "Please fill all required item details";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors({});
    setErrorMessage("");
    setSubmitting(true);

    try {
      const payload: PurchaseRecord = {
        purchase_no: formData.purchase_no?.trim(),
        purchaseorder_id: selectedPurchaseorderId || null,
        fin_year: formData.fin_year || getFinancialYear(formData.invoice_date || new Date()),
        vendor_id: selectedVendorId,
        currency_id: selectedCurrencyId || null,
        tax_type: formData.tax_type || "GST",
        tax_percentage: Number(formData.tax_percentage) || 0,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        invoice_no: formData.invoice_no ? formData.invoice_no.trim() : "",
        total_amount: formData.total_amount || 0,
        discount_type: formData.discount_type || "fixed",
        discount: Number(formData.discount) || 0,
        discount_amount: Number(formData.discount_amount) || 0,
        tax_amount: Number(formData.tax_amount) || 0,
        round_off: Number(formData.round_off) || 0,
        final_amount: Number(formData.final_amount) || 0,
        remarks: formData.remarks ? formData.remarks.trim() : "",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        items: items.map((item) => ({
          service_id: typeof item.service_id === "object" ? (item.service_id as any)._id || (item.service_id as any).id : item.service_id,
          unit_id: typeof item.unit_id === "object" ? (item.unit_id as any)._id || (item.unit_id as any).id : item.unit_id,
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          discount: Number(item.discount) || 0,
          total: Number(item.total) || 0,
        })),
      };

      if (!isEdit && selectedPurchaseorderId) {
        payload.sync_po_invoice_date = invoiceDateDirtyRef.current;
      }

      if (isEdit && (formData.id || recordId)) {
        await dispatch(
          updatePurchase({ ...payload, id: formData.id || recordId })
        ).unwrap();
      } else {
        await dispatch(addPurchase(payload)).unwrap();
      }

      if (selectedPurchaseorderId) {
        dispatch(fetchPurchaseorder({ fin_year: selectedFinYear }));
      }

      setSaved(true);
      setTimeout(() => {
        router.push("/admin/purchase");
      }, 1000);
    } catch (err: any) {
      console.error("Purchase save error:", err);
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error. Please verify input.");
      } else {
        setErrorMessage(err?.message || "Failed to save purchase.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPurchaseOrder = useCallback(
    async (po: PurchaseorderRecord, alreadyFetched = false) => {
      const poId = po.id || po._id;
      if (!poId) return;

      setLoadingPoId(poId);
      setErrorMessage("");
      try {
        // Fetch full authoritative PO details (populates line items from purchaseorder_details)
        const fullPo = alreadyFetched ? po : await dispatch(getPurchaseorderById(poId)).unwrap();
        const targetPo = fullPo || po;

        // 1. Resolve Vendor ID and record
        let vId = "";
        let vendorObj: any = null;
        if (typeof targetPo.vendor_id === "object" && targetPo.vendor_id) {
          vendorObj = targetPo.vendor_id;
          vId = String(vendorObj.id || vendorObj._id || "");
        } else if (typeof targetPo.vendor_id === "string") {
          vId = targetPo.vendor_id;
          vendorObj = partyList.find((p: any) => String(p.id || p._id) === vId) || null;
        }

        // 2. Resolve Currency ID (with fallback from Vendor if needed)
        let cId = "";
        if (typeof targetPo.currency_id === "object" && targetPo.currency_id) {
          cId = String((targetPo.currency_id as any).id || (targetPo.currency_id as any)._id || "");
        } else if (typeof targetPo.currency_id === "string") {
          cId = targetPo.currency_id;
        }
        if (!cId && vendorObj?.currency_id) {
          cId =
            typeof vendorObj.currency_id === "object"
              ? String(vendorObj.currency_id.id || vendorObj.currency_id._id || "")
              : String(vendorObj.currency_id);
        }

        const poNo = targetPo.purchase_order_no || targetPo.purchase_no || "";

        // Resolve Tax Type and Rate (derive fallback % from tax_amount if needed)
        const taxType = targetPo.tax_type || vendorObj?.taxType || vendorObj?.tax_type || "GST";
        let taxPct = Number(targetPo.tax_percentage) || 0;
        if (!taxPct && targetPo.tax_amount && targetPo.total_amount) {
          const taxable = Math.max(
            0,
            Number(targetPo.total_amount) - (Number(targetPo.discount_amount) || 0)
          );
          if (taxable > 0) {
            taxPct = Number(((Number(targetPo.tax_amount) / taxable) * 100).toFixed(2));
          }
        }

        // 3. Resolve line items from purchaseorder_details
        const rawItems =
          targetPo.items ||
          (targetPo as any).purchaseorder_details ||
          (targetPo as any).purchase_details ||
          [];

        if (Array.isArray(rawItems) && rawItems.length > 0) {
          setItems(
            rawItems.map((item: any) => {
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.rate) || 0;
              const disc = Number(item.discount) || 0;
              const rowTotal =
                item.total !== undefined && item.total !== null
                  ? Number(item.total)
                  : Math.max(0, Number((qty * rate - disc).toFixed(2)));
              return {
                service_id:
                  typeof item.service_id === "object" && item.service_id
                    ? String((item.service_id as any).id || (item.service_id as any)._id || "")
                    : String(item.service_id || ""),
                unit_id:
                  typeof item.unit_id === "object" && item.unit_id
                    ? String((item.unit_id as any).id || (item.unit_id as any)._id || "")
                    : String(item.unit_id || ""),
                quantity: qty,
                rate,
                discount: disc,
                total: rowTotal,
              };
            })
          );
        } else {
          setItems([
            {
              service_id: "",
              unit_id: "",
              quantity: 1,
              rate: 0,
              discount: 0,
              total: 0,
            },
          ]);
        }

        // 4. Prepopulate formData in Add mode (preserving generated purchase_no and fin_year)
        invoiceDateDirtyRef.current = false;
        setFormData((prev) => ({
          ...prev,
          purchaseorder_id: String(poId),
          vendor_id: vId,
          currency_id: cId || "",
          tax_type: taxType,
          tax_percentage: taxPct,
          due_date: formatDateForInput(targetPo.due_date) || prev.due_date,
          invoice_no: targetPo.invoice_no || targetPo.reference_no || "",
          discount_type: targetPo.discount_type || "fixed",
          discount: Number(targetPo.discount) || 0,
          round_off: Number(targetPo.round_off) || 0,
          total_amount: Number(targetPo.total_amount) || 0,
          discount_amount: Number(targetPo.discount_amount) || 0,
          tax_amount: Number(targetPo.tax_amount) || 0,
          final_amount: Number(targetPo.final_amount) || 0,
          remarks: targetPo.remarks || "",
          isActive: targetPo.isActive !== undefined ? targetPo.isActive : true,
        }));

        setSelectedPo(targetPo);
        setValidationErrors({});
        setShowPoSelector(false);

        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err: any) {
        console.error("Failed to load PO details:", err);
        setErrorMessage(err?.message || (typeof err === "string" ? err : "Failed to load selected purchase order details."));
      } finally {
        setLoadingPoId(null);
      }
    },
    [dispatch, partyList]
  );

  const handleClearPrepopulatedPo = () => {
    setSelectedPo(null);
    setValidationErrors({});
    invoiceDateDirtyRef.current = false;
    setFormData((prev) => ({
      ...prev,
      purchaseorder_id: null,
      vendor_id: "",
      currency_id: "",
      tax_type: "GST",
      tax_percentage: 0,
      due_date: addOneMonth(prev.invoice_date || new Date().toISOString().split("T")[0]),
      invoice_no: "",
      total_amount: 0,
      discount_type: "fixed",
      discount: 0,
      discount_amount: 0,
      tax_amount: 0,
      round_off: 0,
      final_amount: 0,
      remarks: "",
      isActive: true,
    }));
    setItems([
      {
        service_id: "",
        unit_id: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const initialPoLoadedRef = React.useRef(false);

  // Auto-load Purchase Proforma if ?poId=... is passed in query string
  useEffect(() => {
    if (!isEdit && !initialPoLoadedRef.current && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qPoId = urlParams.get("poId") || urlParams.get("po_id");
      if (qPoId) {
        initialPoLoadedRef.current = true;
        Promise.resolve().then(() => {
          setShowPoSelector(false);
          setLoadingInitialPo(true);
          dispatch(getPurchaseorderById(qPoId))
            .unwrap()
            .then((res) => {
              if (res) {
                return handleSelectPurchaseOrder(res, true);
              }
            })
            .catch((err: unknown) => {
              const msg =
                typeof err === "string"
                  ? err
                  : err && typeof err === "object" && "message" in err
                  ? String((err as { message?: unknown }).message)
                  : "Failed to load selected purchase order.";
              setErrorMessage(msg);
              setShowPoSelector(true);
            })
            .finally(() => {
              setLoadingInitialPo(false);
            });
        });
      }
    }
  }, [isEdit, dispatch, handleSelectPurchaseOrder]);

  const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "38px",
      height: "auto",
      borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
      boxShadow: state.isFocused ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)" : "none",
    }),
    singleValue: (base: any) => ({
      ...base,
      whiteSpace: "normal",
      wordBreak: "break-word",
      lineHeight: 1.3,
    }),
    option: (base: any) => ({
      ...base,
      whiteSpace: "normal",
      wordBreak: "break-word",
    }),
  };

  return (
    <div className="container-fluid pb-4">
      <PageBreadcrumb
        title={isEdit ? "Edit" : "Add New"}
        subtitle="Purchase"
      />

      {!isEdit && loadingInitialPo ? (
        <Card className="shadow-sm border-0">
          <CardBody className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-muted fs-13">Loading purchase order details...</div>
          </CardBody>
        </Card>
      ) : !isEdit && showPoSelector ? (
        <>
          {errorMessage && (
            <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3" dismissible onClose={() => setErrorMessage("")}>
              <Icon icon="alert-circle" className="fs-18 flex-shrink-0" />
              <span>{errorMessage}</span>
            </Alert>
          )}
          <PurchaseOrderSelectList
            loadingPoId={loadingPoId}
            selectedPoId={selectedPo?.id || selectedPo?._id || null}
            onSelectOrder={(po) => handleSelectPurchaseOrder(po)}
            onSkipPo={() => {
              if (selectedPo) {
                handleClearPrepopulatedPo();
              }
              setErrorMessage("");
              setShowPoSelector(false);
            }}
          />
        </>
      ) : (
        <>
          {/* Linked Purchase Proforma Confirmation / Sync Banner */}
          {!isEdit && selectedPo && (
            <Alert variant="success" className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 py-2 px-3 shadow-sm border-success">
              <div className="d-flex align-items-center gap-2">
                <Icon icon="check-circle" className="text-success fs-18 flex-shrink-0" />
                <div>
                  <strong>Prepopulated from Purchase Proforma:</strong>{" "}
                  <span className="badge bg-success font-monospace fs-12 ms-1">
                    {selectedPo.purchase_order_no || selectedPo.purchase_no}
                  </span>
                  <span className="text-muted ms-2 fs-13">
                    ({items.length} item(s) loaded — any changes will also update this Purchase Proforma)
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Button
                  size="sm"
                  variant="outline-success"
                  type="button"
                  onClick={() => setShowPoSelector(true)}
                  className="d-flex align-items-center gap-1"
                >
                  <Icon icon="list" className="fs-14" /> Change PI
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  type="button"
                  onClick={handleClearPrepopulatedPo}
                  className="d-flex align-items-center gap-1"
                >
                  <Icon icon="x" className="fs-14" /> Clear PI
                </Button>
              </div>
            </Alert>
          )}
          {isEdit && selectedPurchaseorderId && (
            <Alert variant="info" className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 py-2 px-3 shadow-sm">
              <div className="d-flex align-items-center gap-2">
                <Icon icon="shopping-cart" className="text-info fs-18 flex-shrink-0" />
                <div>
                  <strong>Linked Proforma Invoice:</strong>{" "}
                  <span className="badge bg-info font-monospace fs-12 ms-1">
                    {linkedPoNo || selectedPurchaseorderId}
                  </span>
                  <span className="text-muted ms-2 fs-13">
                    (Any changes saved here will also update the linked Purchase Proforma Invoice)
                  </span>
                </div>
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Alerts */}
            {saved && (
              <Alert variant="success" className="d-flex align-items-center gap-2 mb-3">
                <Icon icon="check-circle" className="fs-18 flex-shrink-0" />
                <span>Purchase saved successfully! Redirecting to list...</span>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3" dismissible onClose={() => setErrorMessage("")}>
                <Icon icon="alert-circle" className="fs-18 flex-shrink-0" />
                <span>{errorMessage}</span>
              </Alert>
            )}

            {/* Header Information Card */}
            <Card id="purchase-details-card" className="shadow-sm border-0 mb-4">
              <CardHeader className="bg-light py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="file-text" className="text-primary fs-18" />
                  <h5 className="mb-0 fw-bold">Purchase Details</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {!isEdit && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      type="button"
                      onClick={() => setShowPoSelector(true)}
                      className="d-flex align-items-center gap-1"
                    >
                      <Icon icon="shopping-cart" className="fs-14" /> Select From PI
                    </Button>
                  )}
                  {isEdit && (recordId || formData.id) && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="d-flex align-items-center gap-1"
                    >
                      <Icon icon="printer" className="fs-14" /> Print Invoice
                    </Button>
                  )}
                  <Link href="/admin/purchase" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                    <Icon icon="arrow-left" className="fs-14" /> Back to List
                  </Link>
                </div>
              </CardHeader>

          <CardBody className="p-4">
            <Row className="g-3">
              {/* Purchase No */}
              <Col lg={3} md={6}>
                <FormLabel className="fw-semibold d-flex align-items-center justify-content-between mb-1">
                  <span>
                    Purchase No <span className="text-danger">*</span>
                  </span>
                </FormLabel>
                <FormControl
                  type="text"
                  placeholder={`e.g. ${purchasePrefix}/2026-2027/1`}
                  value={formData.purchase_no || ""}
                  onChange={(e) => handleFieldChange("purchase_no", e.target.value)}
                  isInvalid={!!validationErrors.purchase_no}
                />
                {validationErrors.purchase_no && (
                  <div className="text-danger fs-12 mt-1">{validationErrors.purchase_no}</div>
                )}
              </Col>

              {/* Vendor (from Party module) */}
              <Col lg={3} md={6}>
                <FormLabel className="fw-semibold">
                  Vendor <span className="text-danger">*</span>
                </FormLabel>
                <Select
                  options={vendorOptions}
                  value={selectedVendorOption}
                  onChange={(option) => handleVendorChange(option ? option.value : "")}
                  placeholder="Select Vendor..."
                  isClearable
                  styles={selectStyles}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  className={validationErrors.vendor_id ? "is-invalid" : ""}
                />
                {validationErrors.vendor_id && (
                  <div className="text-danger fs-12 mt-1">{validationErrors.vendor_id}</div>
                )}
              </Col>

              {/* Invoice Date */}
              <Col lg={2} md={4}>
                <FormLabel className="fw-semibold">
                  Invoice Date <span className="text-danger">*</span>
                </FormLabel>
                <FormControl
                  type="date"
                  value={formData.invoice_date || ""}
                  onChange={(e) => handleInvoiceDateChange(e.target.value)}
                  isInvalid={!!validationErrors.invoice_date}
                />
                {validationErrors.invoice_date && (
                  <div className="text-danger fs-12 mt-1">{validationErrors.invoice_date}</div>
                )}
              </Col>

              {/* Due Date */}
              <Col lg={2} md={4}>
                <FormLabel className="fw-semibold">Due Date</FormLabel>
                <FormControl
                  type="date"
                  value={formData.due_date || ""}
                  onChange={(e) => handleFieldChange("due_date", e.target.value)}
                />
              </Col>

              {/* Vendor Bill No */}
              <Col lg={2} md={4}>
                <FormLabel className="fw-semibold">Vendor Bill No</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Vendor Bill #"
                  value={formData.invoice_no || ""}
                  onChange={(e) => handleFieldChange("invoice_no", e.target.value)}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Line Items Section (Purchase Details) */}
        <Card className="shadow-sm border-0 mb-4">
          <CardHeader className="bg-light py-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Icon icon="shopping-cart" className="text-primary fs-18" />
              <h5 className="mb-0 fw-bold">Items & Services</h5>
            </div>
            {validationErrors.items && (
              <span className="badge bg-danger-subtle text-danger px-2 py-1 fs-12">
                {validationErrors.items}
              </span>
            )}
          </CardHeader>

          <CardBody className="p-0">
            <div className="table-responsive">
              <Table className="table-hover align-middle mb-0 text-nowrap">
                <thead className="table-light fs-13 text-secondary">
                  <tr>
                    <th style={{ width: "4%" }} className="text-center">#</th>
                    <th style={{ width: "32%" }}>
                      Service / Product <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "16%" }}>
                      Unit <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "12%" }} className="text-end">
                      Quantity <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "12%" }} className="text-end">
                      Rate ({currencySymbol}) <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "11%" }} className="text-end">Discount</th>
                    <th style={{ width: "13%" }} className="text-end">Total ({currencySymbol})</th>
                    <th style={{ width: "70px" }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const poRawItems =
                      selectedPo?.items ||
                      (selectedPo as any)?.purchaseorder_details ||
                      (selectedPo as any)?.purchase_details ||
                      [];

                    const currentServiceId = typeof item.service_id === "object" ? (item.service_id as any)._id || (item.service_id as any).id || "" : String(item.service_id || "");
                    const poServiceMatch = Array.isArray(poRawItems)
                      ? poRawItems.find(
                          (pi: any) =>
                            typeof pi?.service_id === "object" &&
                            pi.service_id &&
                            String(pi.service_id.id || pi.service_id._id || "") === currentServiceId
                        )?.service_id
                      : null;
                    const editServiceMatch = isEdit && Array.isArray(currentRecord?.items)
                      ? currentRecord.items.find(
                          (ci: any) =>
                            (item.id && String(ci?.id || ci?._id || "") === String(item.id)) ||
                            (typeof ci?.service_id === "object" &&
                              ci.service_id &&
                              String(ci.service_id.id || ci.service_id._id || "") === currentServiceId)
                        )?.service_id
                      : null;
                    const selectedService =
                      serviceOptions.find((s) => s.value === currentServiceId) ||
                      (currentServiceId
                        ? (() => {
                            const rawService =
                              serviceList.find((s: any) => String(s.id || s._id) === currentServiceId) ||
                              poServiceMatch ||
                              editServiceMatch;
                            if (!rawService) return null;
                            return {
                              value: currentServiceId,
                              label: formatServiceDisplayLabel(
                                rawService,
                                serviceList,
                                categoryList,
                                subcategoryList,
                                rawService?.name || "Service",
                              ),
                            };
                          })()
                        : null);

                    const currentUnitId = typeof item.unit_id === "object" ? (item.unit_id as any)._id || (item.unit_id as any).id || "" : String(item.unit_id || "");
                    const selectedUnit =
                      unitOptions.find((u) => u.value === currentUnitId) ||
                      (currentUnitId
                        ? (() => {
                            const raw = unitList.find((u: any) => String(u.id || u._id) === currentUnitId);
                            if (raw) return { value: currentUnitId, label: raw.name || "Unit" };
                            const poItemMatch = Array.isArray(poRawItems)
                              ? poRawItems.find(
                                  (pi: any) =>
                                    typeof pi?.unit_id === "object" &&
                                    pi.unit_id &&
                                    String(pi.unit_id.id || pi.unit_id._id || "") === currentUnitId
                                )
                              : null;
                            return poItemMatch?.unit_id?.name
                              ? { value: currentUnitId, label: poItemMatch.unit_id.name }
                              : null;
                          })()
                        : null);

                    const isLastRow = index === items.length - 1;

                    return (
                      <tr key={index}>
                        {/* Index */}
                        <td className="text-center fw-semibold text-muted fs-13">
                          {index + 1}
                        </td>

                        {/* Service / Product */}
                        <td style={{ minWidth: "260px" }}>
                          <Select
                            options={serviceOptions}
                            value={selectedService}
                            onChange={(option) => handleItemChange(index, "service_id", option ? option.value : "")}
                            placeholder="Select Service..."
                            isClearable
                            styles={selectStyles}
                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                          />
                          {validationErrors[`item_service_${index}`] && (
                            <div className="text-danger fs-11 mt-1">
                              {validationErrors[`item_service_${index}`]}
                            </div>
                          )}
                        </td>

                        {/* Unit */}
                        <td>
                          <Select
                            options={unitOptions}
                            value={selectedUnit}
                            onChange={(option) => handleItemChange(index, "unit_id", option ? option.value : "")}
                            placeholder="Select Unit..."
                            isClearable
                            styles={selectStyles}
                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                          />
                          {validationErrors[`item_unit_${index}`] && (
                            <div className="text-danger fs-11 mt-1">
                              {validationErrors[`item_unit_${index}`]}
                            </div>
                          )}
                        </td>

                        {/* Quantity */}
                        <td>
                          <FormControl
                            type="number"
                            min="0.001"
                            step="any"
                            className="text-end"
                            value={item.quantity === 0 ? "0" : item.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            isInvalid={!!validationErrors[`item_qty_${index}`]}
                          />
                        </td>

                        {/* Rate */}
                        <td>
                          <FormControl
                            type="number"
                            min="0"
                            step="any"
                            className="text-end"
                            value={item.rate === 0 ? "0" : item.rate || ""}
                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          />
                        </td>

                        {/* Discount */}
                        <td>
                          <FormControl
                            type="number"
                            min="0"
                            step="any"
                            className="text-end"
                            value={item.discount === 0 ? "0" : item.discount || ""}
                            onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                          />
                        </td>

                        {/* Total (calculated) */}
                        <td className="text-end fw-semibold text-dark fs-14 pe-3 font-monospace">
                          {currencySymbol}{Number(item.total || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Action: Add button on last row, Replace with Remove on previous rows */}
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {/* Remove button: Shown on earlier rows, or if last row and multiple rows exist */}
                            {items.length > 1 && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip id={`tooltip-remove-row-${index}`}>Remove</Tooltip>}
                              >
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  type="button"
                                  className="btn-icon rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: "32px", height: "32px" }}
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <Icon icon="trash-2" className="fs-14" />
                                </Button>
                              </OverlayTrigger>
                            )}

                            {/* Add button: Exclusively displayed on the last row */}
                            {isLastRow && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip id={`tooltip-add-row-${index}`}>Add New</Tooltip>}
                              >
                                <Button
                                  variant="success"
                                  size="sm"
                                  type="button"
                                  className="btn-icon rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                  style={{ width: "32px", height: "32px" }}
                                  onClick={handleAddItem}
                                >
                                  <Icon icon="plus" className="fs-16" />
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>

        {/* Calculation Summary & Remarks Section */}
        <Row className="g-4 mb-4">
          {/* Remarks & Notes */}
          <Col lg={7}>
            <Card className="shadow-sm border-0 h-100">
              <CardHeader className="bg-light py-3 border-bottom">
                <h5 className="mb-0 fw-bold fs-15">Remarks & Terms</h5>
              </CardHeader>
              <CardBody className="p-3 d-flex flex-column gap-3">
                <div>
                  <FormLabel className="fw-semibold">Notes / Remarks</FormLabel>
                  <FormControl
                    as="textarea"
                    rows={4}
                    placeholder="Enter any additional notes, vendor delivery terms, or internal comments..."
                    value={formData.remarks || ""}
                    onChange={(e) => handleFieldChange("remarks", e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <FormCheck
                    type="switch"
                    id="purchase-status-switch"
                    label={
                      <span className="fw-semibold text-dark">
                        Active Purchase Record ({formData.isActive ? "Active" : "Inactive"})
                      </span>
                    }
                    checked={formData.isActive !== false}
                    onChange={(e) => handleFieldChange("isActive", e.target.checked)}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Amount Calculation Panel */}
          <Col lg={5}>
            <Card className="shadow-sm border-0 h-100">
              <CardHeader className="bg-light py-3 border-bottom d-flex align-items-center justify-content-between">
                <h5 className="mb-0 fw-bold fs-15">Payment Summary</h5>
                {/* {selectedVendorRecord ? (
                  <div className="d-flex align-items-center gap-1">
                    <span className="badge bg-primary-subtle text-primary fs-11" title="Vendor Tax Regime">
                      {formData.tax_type || "GST"}
                    </span>
                    <span className="badge bg-info-subtle text-info fs-11 font-monospace" title="Vendor Currency">
                      {currentCurrencyRecord?.code || "INR"} ({currencySymbol})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted fs-11 font-monospace">Currency: ₹ (INR)</span>
                )} */}
              </CardHeader>
              <CardBody className="p-4">
                <div className="d-flex flex-column gap-3">
                  {/* Vendor Currency & Tax Details Profile */}
                  {/* <div className="p-3 rounded bg-light border d-flex flex-column gap-2 fs-12">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Icon icon="user" className="text-primary fs-13" /> Vendor:
                      </span>
                      <span className="fw-bold text-dark text-truncate" style={{ maxWidth: "200px" }}>
                        {selectedVendorRecord ? selectedVendorRecord.name : "Select a vendor above"}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Icon icon="coins" className="text-info fs-13" /> Currency:
                      </span>
                      <span className="fw-bold text-dark font-monospace">
                        {currentCurrencyRecord
                          ? `${currentCurrencyRecord.name || "Currency"} (${currentCurrencyRecord.code || ""}) - ${currencySymbol}`
                          : `INR (₹)`}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Icon icon="file-text" className="text-success fs-13" /> Tax Regime:
                      </span>
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-primary-subtle text-primary fw-semibold">
                          {formData.tax_type || selectedVendorRecord?.taxType || "GST"}
                        </span>
                        {selectedVendorRecord?.gstin && (
                          <span className="badge bg-white text-secondary border font-monospace" title="Tax Identification Number">
                            {formData.tax_type === "VAT" ? "VAT: " : "GSTIN: "}{selectedVendorRecord.gstin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div> */}

                  {/* Total Amount (Subtotal) */}
                  <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
                    <span className="text-secondary fw-semibold">Total Amount (Subtotal):</span>
                    <span className="fw-bold fs-15 text-dark font-monospace">
                      {currencySymbol}{Number(formData.total_amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Discount Section */}
                  <Row className="g-2 align-items-center">
                    <Col xs={4}>
                      <span className="text-secondary fw-semibold fs-13">Discount Type:</span>
                    </Col>
                    <Col xs={4}>
                      <FormSelect
                        size="sm"
                        value={formData.discount_type || "fixed"}
                        onChange={(e) => handleFieldChange("discount_type", e.target.value)}
                      >
                        <option value="fixed">Fixed ({currencySymbol})</option>
                        <option value="percentage">Percent (%)</option>
                      </FormSelect>
                    </Col>
                    <Col xs={4}>
                      <FormControl
                        type="number"
                        size="sm"
                        min="0"
                        step="any"
                        className="text-end"
                        placeholder="0"
                        value={formData.discount === 0 ? "0" : formData.discount || ""}
                        onChange={(e) => handleFieldChange("discount", e.target.value)}
                      />
                    </Col>
                  </Row>

                  {/* Discount Amount */}
                  <div className="d-flex align-items-center justify-content-between py-1 border-bottom text-muted fs-13">
                    <span>Discount Amount:</span>
                    <span className="text-danger fw-semibold font-monospace">
                      -{currencySymbol}{Number(formData.discount_amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Tax Section (GST / VAT) */}
                  <div className="py-2 border-top border-bottom bg-light bg-opacity-50 px-2 rounded">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-1">
                        <span className="text-secondary fw-semibold fs-13">
                          {currentTaxType} Rate (%):
                        </span>
                        <span className="badge bg-primary-subtle text-primary fs-11">
                          {currentTaxType}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-1" style={{ maxWidth: "140px" }}>
                        <FormControl
                          type="number"
                          size="sm"
                          min="0"
                          max="100"
                          step="any"
                          className="text-end font-monospace fw-semibold"
                          placeholder="0"
                          value={formData.tax_percentage === 0 ? "0" : formData.tax_percentage || ""}
                          onChange={(e) => handleFieldChange("tax_percentage", e.target.value)}
                        />
                        <span className="badge bg-secondary-subtle text-dark fs-12">%</span>
                      </div>
                    </div>

                    {/* Quick percentage slab buttons from Taxrate module */}
                    <div className="d-flex align-items-center gap-1 mb-2 flex-wrap">
                      <span className="text-muted fs-11 me-1">Slabs:</span>
                      {taxSlabs.map((pct) => (
                        <Button
                          key={pct}
                          variant={Number(formData.tax_percentage) === pct ? "primary" : "outline-secondary"}
                          size="sm"
                          className="py-0 px-2 fs-11"
                          onClick={() => handleFieldChange("tax_percentage", pct)}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>

                    {/* Calculated Tax Amount display */}
                    <div className="d-flex align-items-center justify-content-between text-muted fs-13">
                      <span>Tax Amount:</span>
                      <span className="text-dark fw-bold font-monospace">
                        +{currencySymbol}{Number(formData.tax_amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Round Off */}
                  <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-secondary fw-semibold fs-13">Round Off:</span>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id="tooltip-auto-round">Auto calculate round off</Tooltip>}
                      >
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-none fs-11"
                          onClick={handleAutoRoundOff}
                        >
                          [Auto Round]
                        </Button>
                      </OverlayTrigger>
                    </div>
                   <div className="col-md-4">
                      <FormControl
                        type="number"
                        size="sm"
                        step="any"
                        className="text-end font-monospace"
                        placeholder="0.00"
                        value={formData.round_off === 0 ? "0" : formData.round_off || ""}
                        onChange={(e) => handleFieldChange("round_off", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Final Amount (Grand Total) */}
                  <div className="d-flex align-items-center justify-content-between py-2 bg-light px-3 rounded border border-primary border-opacity-25">
                    <span className="fw-bold fs-16 text-primary">Final Amount:</span>
                    <span className="fw-bold fs-18 text-primary font-monospace">
                      {currencySymbol}{Number(formData.final_amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Footer Actions */}
        <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
          <Link href="/admin/purchase" className="btn btn-outline-secondary px-4">
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            className="px-4 fw-semibold d-flex align-items-center gap-2"
            disabled={submitting || purchaseLoading}
          >
            {submitting ? (
              <>
                <Spinner size="sm" animation="border" />
                Saving Purchase...
              </>
            ) : (
              <>
                <Icon icon="check" className="fs-16" />
                {isEdit ? "Update Purchase" : "Save Purchase"}
              </>
            )}
          </Button>
        </div>
      </form>
        </>
      )}

      {showInvoiceModal && (
        <PurchaseInvoice
          purchaseId={recordId || formData.id}
          purchase={{ ...formData, items }}
          show={showInvoiceModal}
          onHide={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};

export default PurchaseForm;
