import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SaleorderItem {
  id?: string;
  _id?: string;
  saleorder_id?: string;
  sale_id?: string;
  service_id: string | { _id?: string; id?: string; name?: string; [key: string]: any };
  quantity: number;
  unit_id: string | { _id?: string; id?: string; name?: string; [key: string]: any };
  rate: number;
  discount: number;
  total: number;
}

export interface SaleorderRecord {
  id?: string;
  _id?: string;
  sale_order_no?: string;
  sale_no?: string;
  fin_year?: string;
  customer_id?:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        phone?: string;
        email?: string;
        gstin?: string;
        taxType?: string;
        currency_id?: any;
        [key: string]: any;
      };
  currency_id?:
    | string
    | { _id?: string; id?: string; name?: string; code?: string; symbol?: string; [key: string]: any }
    | null;
  tax_type?: "GST" | "VAT" | "None" | string;
  tax_percentage?: number;
  invoice_date?: string;
  order_date?: string;
  challan_date?: string | null;
  due_date?: string | null;
  invoice_no?: string;
  reference_no?: string;
  items?: SaleorderItem[];
  saleorder_details?: SaleorderItem[];
  sale_details?: SaleorderItem[];
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

interface SaleorderState {
  records: SaleorderRecord[];
  financialYears: string[];
  currentRecord: SaleorderRecord | null;
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: SaleorderState = {
  records: [],
  financialYears: [],
  currentRecord: null,
  loading: false,
  error: null,
};

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined"
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

export const generateDefaultSaleorderNo = (
  records: SaleorderRecord[] = [],
  targetDate: string | Date = new Date(),
  customFinYear?: string,
  customPrefix: string = "SO"
) => {
  const cleanPrefix = (customPrefix || "SO").replace(/\/+$/, "").trim();
  const fy =
    customFinYear && customFinYear !== "All"
      ? customFinYear
      : getFinancialYear(targetDate);
  const prefix = `${cleanPrefix}/${fy}/`;
  const escaped = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}/${fy}/(\\d+)$`, "i");

  let maxSeq = 0;
  for (const r of records) {
    const no = r.sale_order_no || r.sale_no;
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

export const fetchSaleorderFinancialYears = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("saleorder/fetchFinancialYears", async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/saleorder/financial-years`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (json && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [getFinancialYear()];
  } catch {
    return [getFinancialYear()];
  }
});

export const fetchNextSaleorderNo = createAsyncThunk<
  string,
  { invoiceDate?: string; finYear?: string; prefix?: string } | string | undefined,
  { rejectValue: string }
>("saleorder/fetchNextSaleorderNo", async (payload, { rejectWithValue }) => {
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
    const url = `${API_BASE_URL}/admin/saleorder/next-number${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (json && json.success && (json.data?.sale_order_no || json.data?.sale_no)) {
      return json.data.sale_order_no || json.data.sale_no;
    }
    return rejectWithValue("Failed to fetch next sale order number");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching next sale order number");
  }
});

export const fetchSaleorder = createAsyncThunk<
  SaleorderRecord[],
  { fin_year?: string; search?: string } | void,
  { rejectValue: string; state: any }
>("saleorder/fetchSaleorder", async (params, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const storedFinYear =
      typeof window !== "undefined" ? localStorage.getItem("global_fin_year") : null;
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
    const url = `${API_BASE_URL}/admin/saleorder${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch saleorder");
    }
    if (json && json.success && json.data) {
      return json.data.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        _id: item._id || item.id,
        sale_order_no: item.sale_order_no || item.sale_no,
        sale_no: item.sale_no || item.sale_order_no,
      }));
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching saleorder");
  }
});

export const getSaleorderById = createAsyncThunk<
  SaleorderRecord,
  string,
  { rejectValue: string }
>("saleorder/getSaleorderById", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/saleorder/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch sale order details");
    }
    if (json && json.success && json.data) {
      return {
        ...json.data,
        id: json.data.id || json.data._id,
        _id: json.data._id || json.data.id,
        sale_order_no: json.data.sale_order_no || json.data.sale_no,
        sale_no: json.data.sale_no || json.data.sale_order_no,
      };
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching sale order details");
  }
});

export const addSaleorder = createAsyncThunk<
  SaleorderRecord,
  SaleorderRecord,
  { rejectValue: any }
>("saleorder/addSaleorder", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/saleorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add sale order" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
      sale_order_no: json.data?.sale_order_no || json.data?.sale_no,
      sale_no: json.data?.sale_no || json.data?.sale_order_no,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding sale order");
  }
});

export const updateSaleorder = createAsyncThunk<
  SaleorderRecord,
  SaleorderRecord,
  { rejectValue: any }
>("saleorder/updateSaleorder", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/saleorder/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update sale order" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
      sale_order_no: json.data?.sale_order_no || json.data?.sale_no,
      sale_no: json.data?.sale_no || json.data?.sale_order_no,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating sale order");
  }
});

export const statusSaleorder = createAsyncThunk<
  { id: string; isActive: boolean },
  { id: string; status: boolean },
  { rejectValue: string }
>("saleorder/statusSaleorder", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/saleorder/status/${id}`, {
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

export const deleteSaleorder = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("saleorder/deleteSaleorder", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/saleorder/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete sale order");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete sale order");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting sale order");
  }
});

const saleorderSlice = createSlice({
  name: "saleorder",
  initialState,
  reducers: {
    clearSaleorderError(state) {
      state.error = null;
    },
    clearCurrentSaleorder(state) {
      state.currentRecord = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchSaleorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSaleorder.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchSaleorder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch saleorder";
    });

    // Get by ID
    builder.addCase(getSaleorderById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getSaleorderById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentRecord = action.payload;
    });
    builder.addCase(getSaleorderById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch sale order details";
    });

    // Add
    builder.addCase(addSaleorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addSaleorder.fulfilled, (state, action) => {
      state.loading = false;
      state.records.unshift(action.payload);
      state.currentRecord = action.payload;
    });
    builder.addCase(addSaleorder.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add sale order";
      }
    });

    // Update
    builder.addCase(updateSaleorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateSaleorder.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
      state.currentRecord = action.payload;
    });
    builder.addCase(updateSaleorder.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update sale order";
      }
    });

    // Status
    builder.addCase(statusSaleorder.fulfilled, (state, action) => {
      const index = state.records.findIndex((r) => (r.id || r._id) === action.payload.id);
      if (index !== -1) {
        state.records[index].isActive = action.payload.isActive;
      }
      if (
        state.currentRecord &&
        (state.currentRecord.id || state.currentRecord._id) === action.payload.id
      ) {
        state.currentRecord.isActive = action.payload.isActive;
      }
    });

    // Delete
    builder.addCase(deleteSaleorder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteSaleorder.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteSaleorder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete sale order";
    });

    // Financial Years
    builder.addCase(fetchSaleorderFinancialYears.fulfilled, (state, action) => {
      state.financialYears = action.payload;
    });
  },
});

export const { clearSaleorderError, clearCurrentSaleorder } = saleorderSlice.actions;
export default saleorderSlice.reducer;
