import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CityRecord {
  id?: string;
  _id?: string;
  country_id?: string | { id?: string; _id?: string; name?: string; [key: string]: any };
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface CityState {
  records: CityRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: CityState = {
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

export const fetchCity = createAsyncThunk<
  CityRecord[],
  void,
  { rejectValue: string }
>("city/fetchCity", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/city?limit=1000`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch city");
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
    return rejectWithValue(error.message || "Error fetching city");
  }
});

export const addCity = createAsyncThunk<
  CityRecord,
  CityRecord,
  { rejectValue: any }
>("city/addCity", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/city`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add city" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding city");
  }
});

export const updateCity = createAsyncThunk<
  CityRecord,
  CityRecord,
  { rejectValue: any }
>("city/updateCity", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/city/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update city" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating city");
  }
});

export const deleteCity = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("city/deleteCity", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/city/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete city");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete city");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting city");
  }
});

const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    clearCityError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchCity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCity.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchCity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch city";
    });

    // Add
    builder.addCase(addCity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addCity.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addCity.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add city";
      }
    });

    // Update
    builder.addCase(updateCity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCity.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateCity.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update city";
      }
    });

    // Delete
    builder.addCase(deleteCity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCity.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteCity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete city";
    });
  },
});

export const { clearCityError } = citySlice.actions;
export default citySlice.reducer;
