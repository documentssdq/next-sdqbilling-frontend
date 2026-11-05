import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CurrencyRecord {
  id?: string;
  _id?: string;
  name?: string;
  code?: string;
  symbol?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface CurrencyState {
  records: CurrencyRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: CurrencyState = {
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

export const fetchCurrency = createAsyncThunk<
  CurrencyRecord[],
  void,
  { rejectValue: string }
>("currency/fetchCurrency", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/currency?page=1&limit=1000`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch currency");
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
    return rejectWithValue(error.message || "Error fetching currency");
  }
});

export const addCurrency = createAsyncThunk<
  CurrencyRecord,
  CurrencyRecord,
  { rejectValue: any }
>("currency/addCurrency", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/currency?page=1&limit=1000`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add currency" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding currency");
  }
});

export const updateCurrency = createAsyncThunk<
  CurrencyRecord,
  CurrencyRecord,
  { rejectValue: any }
>("currency/updateCurrency", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/currency/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update currency" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating currency");
  }
});

export const deleteCurrency = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("currency/deleteCurrency", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/currency/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete currency");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete currency");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting currency");
  }
});

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    clearCurrencyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchCurrency.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrency.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchCurrency.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch currency";
    });

    // Add
    builder.addCase(addCurrency.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addCurrency.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addCurrency.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add currency";
      }
    });

    // Update
    builder.addCase(updateCurrency.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCurrency.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateCurrency.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update currency";
      }
    });

    // Delete
    builder.addCase(deleteCurrency.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCurrency.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteCurrency.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete currency";
    });
  },
});

export const { clearCurrencyError } = currencySlice.actions;
export default currencySlice.reducer;
