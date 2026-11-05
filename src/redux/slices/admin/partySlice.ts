import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartyRecord {
  id?: string;
  _id?: string;
  name?: string;
  partyType?: "customer" | "vendor" | "both" | string;
  phone?: string;
  email?: string;
  taxType?: "GST" | "VAT" | string;
  currency_id?: string | { id?: string; _id?: string; name?: string; code?: string; symbol?: string; [key: string]: any } | null;
  gstin?: string;
  country_id?: string | { id?: string; _id?: string; name?: string; [key: string]: any } | null;
  city_id?: string | { id?: string; _id?: string; name?: string; country_id?: any; [key: string]: any } | null;
  address?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface PartyState {
  records: PartyRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: PartyState = {
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

export const fetchPartys = createAsyncThunk<
  PartyRecord[],
  void,
  { rejectValue: string }
>("party/fetchPartys", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/partys`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch partys");
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
    return rejectWithValue(error.message || "Error fetching partys");
  }
});

export const addParty = createAsyncThunk<
  PartyRecord,
  PartyRecord,
  { rejectValue: any }
>("party/addParty", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/partys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add party" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding party");
  }
});

export const updateParty = createAsyncThunk<
  PartyRecord,
  PartyRecord,
  { rejectValue: any }
>("party/updateParty", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/partys/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update party" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating party");
  }
});

export const deleteParty = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("party/deleteParty", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/partys/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete party");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete party");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting party");
  }
});

const partySlice = createSlice({
  name: "party",
  initialState,
  reducers: {
    clearPartyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchPartys.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPartys.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchPartys.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch partys";
    });

    // Add
    builder.addCase(addParty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addParty.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addParty.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add party";
      }
    });

    // Update
    builder.addCase(updateParty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateParty.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateParty.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update party";
      }
    });

    // Delete
    builder.addCase(deleteParty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteParty.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteParty.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete party";
    });
  },
});

export const { clearPartyError } = partySlice.actions;
export default partySlice.reducer;
