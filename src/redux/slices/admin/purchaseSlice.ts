import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseItem {
  id?: string;
  _id?: string;
  purchase_id?: string;
  service_id: string | { _id?: string; id?: string; name?: string; [key: string]: any };
  quantity: number;
  unit_id: string | { _id?: string; id?: string; name?: string; [key: string]: any };
  rate: number;
  discount: number;
  total: number;
}

export interface PurchaseRecord {
  id?: string;
  _id?: string;
  purchase_no?: string;
  purchaseorder_id?:
    | string
    | {
        _id?: string;
        id?: string;
        purchase_order_no?: string;
        purchase_no?: string;
        invoice_date?: string;
        final_amount?: number;
        isActive?: boolean;
        [key: string]: any;
      }
    | null;
  fin_year?: string;
  vendor_id?: string | { _id?: string; id?: string; name?: string; phone?: string; email?: string; gstin?: string; taxType?: string; currency_id?: any; [key: string]: any };
  currency_id?: string | { _id?: string; id?: string; name?: string; code?: string; symbol?: string; [key: string]: any } | null;
  tax_type?: "GST" | "VAT" | "None" | string;
  tax_percentage?: number;
  invoice_date?: string;
  due_date?: string | null;
  invoice_no?: string;
  items?: PurchaseItem[];
  purchase_details?: PurchaseItem[];
  total_amount?: number;
  discount_type?: "fixed" | "percentage" | string;
  discount?: number;
  discount_amount?: number;
  tax_amount?: number;
  round_off?: number;
  final_amount?: number;
  remarks?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface PurchaseState {
  records: PurchaseRecord[];
  financialYears: string[];
  currentRecord: PurchaseRecord | null;
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseState = {
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

export const generateDefaultPurchaseNo = (
  records: PurchaseRecord[] = [],
  targetDate: string | Date = new Date(),
  customFinYear?: string,
  customPrefix: string = "BILL/P"
) => {
  const cleanPrefix = (customPrefix || "BILL/P").replace(/\/+$/, "").trim();
  const fy = (customFinYear && customFinYear !== "All")
    ? customFinYear
    : getFinancialYear(targetDate);
  const prefix = `${cleanPrefix}/${fy}/`;
  const escaped = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}/${fy}/(\\d+)$`, "i");

  let maxSeq = 0;
  for (const r of records) {
    if (r.purchase_no) {
      const match = r.purchase_no.match(regex);
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
>("purchase/fetchFinancialYears", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchase/financial-years`, {
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

export const fetchNextPurchaseNo = createAsyncThunk<
  string,
  { invoiceDate?: string; finYear?: string; prefix?: string } | string | undefined,
  { rejectValue: string }
>("purchase/fetchNextPurchaseNo", async (payload, { rejectWithValue }) => {
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
    const url = `${API_BASE_URL}/admin/purchase/next-number${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (json && json.success && json.data?.purchase_no) {
      return json.data.purchase_no;
    }
    return rejectWithValue("Failed to fetch next purchase number");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching next purchase number");
  }
});

export const fetchPurchase = createAsyncThunk<
  PurchaseRecord[],
  { fin_year?: string; search?: string } | void,
  { rejectValue: string; state: any }
>("purchase/fetchPurchase", async (params, { getState, rejectWithValue }) => {
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
    const url = `${API_BASE_URL}/admin/purchase${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch purchase");
    }
    if (json && json.success && json.data) {
      return json.data.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        _id: item._id || item.id,
      }));
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching purchase");
  }
});

export const getPurchaseById = createAsyncThunk<
  PurchaseRecord,
  string,
  { rejectValue: string }
>("purchase/getPurchaseById", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchase/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch purchase details");
    }
    if (json && json.success && json.data) {
      return {
        ...json.data,
        id: json.data.id || json.data._id,
        _id: json.data._id || json.data.id,
      };
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching purchase details");
  }
});

export const addPurchase = createAsyncThunk<
  PurchaseRecord,
  PurchaseRecord,
  { rejectValue: any }
>("purchase/addPurchase", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add purchase" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding purchase");
  }
});

export const updatePurchase = createAsyncThunk<
  PurchaseRecord,
  PurchaseRecord,
  { rejectValue: any }
>("purchase/updatePurchase", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/purchase/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update purchase" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating purchase");
  }
});

export const deletePurchase = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("purchase/deletePurchase", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchase/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete purchase");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete purchase");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting purchase");
  }
});

const purchaseSlice = createSlice({
  name: "purchase",
  initialState,
  reducers: {
    clearPurchaseError(state) {
      state.error = null;
    },
    clearCurrentPurchase(state) {
      state.currentRecord = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchPurchase.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPurchase.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchPurchase.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch purchase";
    });

    // Get by ID
    builder.addCase(getPurchaseById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getPurchaseById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentRecord = action.payload;
    });
    builder.addCase(getPurchaseById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch purchase details";
    });

    // Add
    builder.addCase(addPurchase.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addPurchase.fulfilled, (state, action) => {
      state.loading = false;
      state.records.unshift(action.payload);
      state.currentRecord = action.payload;
    });
    builder.addCase(addPurchase.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add purchase";
      }
    });

    // Update
    builder.addCase(updatePurchase.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updatePurchase.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
      state.currentRecord = action.payload;
    });
    builder.addCase(updatePurchase.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update purchase";
      }
    });

    // Delete
    builder.addCase(deletePurchase.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deletePurchase.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deletePurchase.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete purchase";
    });

    // Financial Years
    builder.addCase(fetchFinancialYears.fulfilled, (state, action) => {
      state.financialYears = action.payload;
    });
  },
});

export const { clearPurchaseError, clearCurrentPurchase } = purchaseSlice.actions;
export default purchaseSlice.reducer;
