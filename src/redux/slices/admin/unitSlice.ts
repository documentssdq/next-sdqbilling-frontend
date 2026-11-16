import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnitRecord {
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

interface UnitState {
  records: UnitRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: UnitState = {
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

export const fetchUnit = createAsyncThunk<
  UnitRecord[],
  void,
  { rejectValue: string }
>("unit/fetchUnit", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/unit`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch unit");
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
    return rejectWithValue(error.message || "Error fetching unit");
  }
});

export const addUnit = createAsyncThunk<
  UnitRecord,
  UnitRecord,
  { rejectValue: any }
>("unit/addUnit", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/unit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add unit" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding unit");
  }
});

export const updateUnit = createAsyncThunk<
  UnitRecord,
  UnitRecord,
  { rejectValue: any }
>("unit/updateUnit", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/unit/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update unit" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating unit");
  }
});

export const deleteUnit = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("unit/deleteUnit", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/unit/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete unit");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete unit");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting unit");
  }
});

const unitSlice = createSlice({
  name: "unit",
  initialState,
  reducers: {
    clearUnitError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchUnit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUnit.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchUnit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch unit";
    });

    // Add
    builder.addCase(addUnit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUnit.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addUnit.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add unit";
      }
    });

    // Update
    builder.addCase(updateUnit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUnit.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateUnit.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update unit";
      }
    });

    // Delete
    builder.addCase(deleteUnit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUnit.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteUnit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete unit";
    });
  },
});

export const { clearUnitError } = unitSlice.actions;
export default unitSlice.reducer;
