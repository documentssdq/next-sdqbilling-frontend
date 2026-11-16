import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TAX_TYPES = ["GST", "VAT"] as const;
export type TaxType = (typeof TAX_TYPES)[number];

export interface TaxrateRecord {
  id?: string;
  _id?: string;
  name?: string;
  rate?: number;
  taxType?: TaxType | string;
  isDefault?: boolean;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface TaxrateState {
  records: TaxrateRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: TaxrateState = {
  records: [],
  loading: false,
  error: null,
};

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token") || sessionStorage.getItem("token")
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchTaxrate = createAsyncThunk<
  TaxrateRecord[],
  void,
  { rejectValue: string }
>("taxrate/fetchTaxrate", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/taxrate?page=1&limit=1000`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch taxrate");
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
    return rejectWithValue(error.message || "Error fetching taxrate");
  }
});

export const addTaxrate = createAsyncThunk<
  TaxrateRecord,
  TaxrateRecord,
  { rejectValue: any }
>("taxrate/addTaxrate", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/taxrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add taxrate" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding taxrate");
  }
});

export const updateTaxrate = createAsyncThunk<
  TaxrateRecord,
  TaxrateRecord,
  { rejectValue: any }
>("taxrate/updateTaxrate", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/taxrate/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update taxrate" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating taxrate");
  }
});

export const deleteTaxrate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("taxrate/deleteTaxrate", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/taxrate/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete taxrate");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete taxrate");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting taxrate");
  }
});

const taxrateSlice = createSlice({
  name: "taxrate",
  initialState,
  reducers: {
    clearTaxrateError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchTaxrate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTaxrate.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchTaxrate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch taxrate";
    });

    // Add
    builder.addCase(addTaxrate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addTaxrate.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addTaxrate.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add taxrate";
      }
    });

    // Update
    builder.addCase(updateTaxrate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTaxrate.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateTaxrate.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update taxrate";
      }
    });

    // Delete
    builder.addCase(deleteTaxrate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteTaxrate.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteTaxrate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete taxrate";
    });
  },
});

export const { clearTaxrateError } = taxrateSlice.actions;
export default taxrateSlice.reducer;
