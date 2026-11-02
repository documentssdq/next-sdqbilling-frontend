import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CountriesRecord {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // TODO: Add extra ERP domain fields here (e.g. partyType, gstin, phone, address, etc.)
  [key: string]: any;
}

interface Countriestate {
  records: CountriesRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: Countriestate = {
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

export const fetchCountries = createAsyncThunk<
  CountriesRecord[],
  void,
  { rejectValue: string }
>("countries/fetchCountries", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/countries`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch countries");
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
    return rejectWithValue(error.message || "Error fetching countries");
  }
});

export const addCountries = createAsyncThunk<
  CountriesRecord,
  CountriesRecord,
  { rejectValue: any }
>("countries/addCountries", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/countries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add countries" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding countries");
  }
});

export const updateCountries = createAsyncThunk<
  CountriesRecord,
  CountriesRecord,
  { rejectValue: any }
>("countries/updateCountries", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/countries/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update countries" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating countries");
  }
});

export const deleteCountries = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("countries/deleteCountries", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete countries");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete countries");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting countries");
  }
});

const countrieslice = createSlice({
  name: "countries",
  initialState,
  reducers: {
    clearCountriesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchCountries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCountries.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchCountries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch countries";
    });

    // Add
    builder.addCase(addCountries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addCountries.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addCountries.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add countries";
      }
    });

    // Update
    builder.addCase(updateCountries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCountries.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateCountries.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update countries";
      }
    });

    // Delete
    builder.addCase(deleteCountries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCountries.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteCountries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete countries";
    });
  },
});

export const { clearCountriesError } = countrieslice.actions;
export default countrieslice.reducer;
