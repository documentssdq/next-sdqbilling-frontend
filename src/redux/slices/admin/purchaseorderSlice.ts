import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseorderItem {
  id?: string;
  _id?: string;
  purchaseorder_id?: string;
  purchase_id?: string;
  service_id: string | { _id?: string; id?: string; name?: string; [key: string]: any };
  quantity: number;
  unit_id: string | { _id?: string; id?: string; name?: string; [key: string]: any };
  rate: number;
  discount: number;
  total: number;
}

export interface PurchaseorderRecord {
  id?: string;
  _id?: string;
  purchase_order_no?: string;
  purchase_no?: string;
  fin_year?: string;
  vendor_id?: string | { _id?: string; id?: string; name?: string; phone?: string; email?: string; gstin?: string; taxType?: string; currency_id?: any; [key: string]: any };
  currency_id?: string | { _id?: string; id?: string; name?: string; code?: string; symbol?: string; [key: string]: any } | null;
  tax_type?: "GST" | "VAT" | "None" | string;
  tax_percentage?: number;
  invoice_date?: string;
  order_date?: string;
  due_date?: string | null;
  invoice_no?: string;
  reference_no?: string;
  items?: PurchaseorderItem[];
  purchaseorder_details?: PurchaseorderItem[];
  purchase_details?: PurchaseorderItem[];
  total_amount?: number;
  discount_type?: "fixed" | "percentage" | string;
  discount?: number;
  discount_amount?: number;
  tax_amount?: number;
  round_off?: number;
  final_amount?: number;
  remarks?: string;
  isActive?: boolean;
  isUsedInPurchase?: boolean;
  has_purchase?: boolean;
  linked_purchase_no?: string;
  linked_purchases?: Array<{ id?: string; _id?: string; purchase_no?: string }>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface PurchaseorderState {
  records: PurchaseorderRecord[];
  financialYears: string[];
  currentRecord: PurchaseorderRecord | null;
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseorderState = {
  records: [],
  financialYears: [],
  currentRecord: null,
  loading: false,
  error: null,
};

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token") || sessionStorage.getItem("token")
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getFinancialYear = (date: string | Date = new Date()): string => {
  const d = new Date(date);
  const valid = !isNaN(d.getTime());
  const year = valid ? d.getFullYear() : new Date().getFullYear();
  const month = valid ? d.getMonth() : new Date().getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const generateDefaultPurchaseorderNo = (
  records: PurchaseorderRecord[] = [],
  targetDate: string | Date = new Date(),
  customFinYear?: string,
  customPrefix: string = "PO"
) => {
  const cleanPrefix = (customPrefix || "PO").replace(/\/+$/, "").trim();
  const fy = (customFinYear && customFinYear !== "All")
    ? customFinYear
    : getFinancialYear(targetDate);
  const prefix = `${cleanPrefix}/${fy}/`;
  const escaped = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}/${fy}/(\\d+)$`, "i");

  let maxSeq = 0;
  for (const r of records) {
    const no = r.purchase_order_no || r.purchase_no;
    if (no) {
      const match = no.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }
  return `${prefix}${maxSeq + 1}`;
};

export const fetchFinancialYears = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("purchaseorder/fetchFinancialYears", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchaseorder/financial-years`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (json && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [getFinancialYear()];
  } catch (error: any) {
    return [getFinancialYear()];
  }
});

export const fetchNextPurchaseorderNo = createAsyncThunk<
  string,
  { invoiceDate?: string; finYear?: string; prefix?: string } | string | undefined,
  { rejectValue: string }
>("purchaseorder/fetchNextPurchaseorderNo", async (payload, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (typeof payload === "string") {
      if (payload) params.append("invoice_date", payload);
    } else if (payload && typeof payload === "object") {
      if (payload.invoiceDate) params.append("invoice_date", payload.invoiceDate);
      if (payload.finYear && payload.finYear !== "All") params.append("fin_year", payload.finYear);
      if (payload.prefix) params.append("prefix", payload.prefix);
    }
    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin/purchaseorder/next-number${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (json && json.success && (json.data?.purchase_order_no || json.data?.purchase_no)) {
      return json.data.purchase_order_no || json.data.purchase_no;
    }
    return rejectWithValue("Failed to fetch next purchase order number");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching next purchase order number");
  }
});

export const fetchPurchaseorder = createAsyncThunk<
  PurchaseorderRecord[],
  { fin_year?: string; search?: string } | void,
  { rejectValue: string; state: any }
>("purchaseorder/fetchPurchaseorder", async (params, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const storedFinYear = typeof window !== "undefined" ? localStorage.getItem("global_fin_year") : null;
    const activeFinYear =
      params && typeof params.fin_year !== "undefined"
        ? params.fin_year
        : state.financialYear?.selectedFinYear || storedFinYear || getFinancialYear();

    const query = new URLSearchParams();
    if (activeFinYear && activeFinYear !== "All") {
      query.append("fin_year", activeFinYear);
    }
    if (params && params.search) {
      query.append("search", params.search);
    }
    const queryString = query.toString();
    const url = `${API_BASE_URL}/admin/purchaseorder${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch purchaseorder");
    }
    if (json && json.success && json.data) {
      return json.data.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        _id: item._id || item.id,
        purchase_order_no: item.purchase_order_no || item.purchase_no,
        purchase_no: item.purchase_no || item.purchase_order_no,
      }));
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching purchaseorder");
  }
});

export const getPurchaseorderById = createAsyncThunk<
  PurchaseorderRecord,
  string,
  { rejectValue: string }
>("purchaseorder/getPurchaseorderById", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchaseorder/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch purchase order details");
    }
    if (json && json.success && json.data) {
      return {
        ...json.data,
        id: json.data.id || json.data._id,
        _id: json.data._id || json.data.id,
        purchase_order_no: json.data.purchase_order_no || json.data.purchase_no,
        purchase_no: json.data.purchase_no || json.data.purchase_order_no,
      };
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching purchase order details");
  }
});

export const addPurchaseorder = createAsyncThunk<
  PurchaseorderRecord,
  PurchaseorderRecord,
  { rejectValue: any }
>("purchaseorder/addPurchaseorder", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchaseorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add purchase order" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
      purchase_order_no: json.data?.purchase_order_no || json.data?.purchase_no,
      purchase_no: json.data?.purchase_no || json.data?.purchase_order_no,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding purchase order");
  }
});

export const updatePurchaseorder = createAsyncThunk<
  PurchaseorderRecord,
  PurchaseorderRecord,
  { rejectValue: any }
>("purchaseorder/updatePurchaseorder", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/purchaseorder/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update purchase order" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
      purchase_order_no: json.data?.purchase_order_no || json.data?.purchase_no,
      purchase_no: json.data?.purchase_no || json.data?.purchase_order_no,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating purchase order");
  }
});

export const statusPurchaseorder = createAsyncThunk<
  { id: string; isActive: boolean },
  { id: string; status: boolean },
  { rejectValue: string }
>("purchaseorder/statusPurchaseorder", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchaseorder/status/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json?.message || "Failed to update status");
    }
    return { id, isActive: status };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating status");
  }
});

export const deletePurchaseorder = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("purchaseorder/deletePurchaseorder", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchaseorder/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete purchase order");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete purchase order");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting purchase order");
  }
});

const purchaseorderSlice = createSlice({
  name: "purchaseorder",
  initialState,
  reducers: {
    clearPurchaseorderError(state) {
      state.error = null;
    },
    clearCurrentPurchaseorder(state) {
      state.currentRecord = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchPurchaseorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPurchaseorder.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchPurchaseorder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch purchaseorder";
    });

    // Get by ID
    builder.addCase(getPurchaseorderById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getPurchaseorderById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentRecord = action.payload;
    });
    builder.addCase(getPurchaseorderById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch purchase order details";
    });

    // Add
    builder.addCase(addPurchaseorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addPurchaseorder.fulfilled, (state, action) => {
      state.loading = false;
      state.records.unshift(action.payload);
      state.currentRecord = action.payload;
    });
    builder.addCase(addPurchaseorder.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add purchase order";
      }
    });

    // Update
    builder.addCase(updatePurchaseorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updatePurchaseorder.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
      state.currentRecord = action.payload;
    });
    builder.addCase(updatePurchaseorder.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update purchase order";
      }
    });

    // Status
    builder.addCase(statusPurchaseorder.fulfilled, (state, action) => {
      const index = state.records.findIndex((r) => (r.id || r._id) === action.payload.id);
      if (index !== -1) {
        state.records[index].isActive = action.payload.isActive;
      }
      if (state.currentRecord && (state.currentRecord.id || state.currentRecord._id) === action.payload.id) {
        state.currentRecord.isActive = action.payload.isActive;
      }
    });

    // Delete
    builder.addCase(deletePurchaseorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deletePurchaseorder.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deletePurchaseorder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete purchase order";
    });

    // Financial Years
    builder.addCase(fetchFinancialYears.fulfilled, (state, action) => {
      state.financialYears = action.payload;
    });
  },
});

export const { clearPurchaseorderError, clearCurrentPurchaseorder } = purchaseorderSlice.actions;
export default purchaseorderSlice.reducer;
