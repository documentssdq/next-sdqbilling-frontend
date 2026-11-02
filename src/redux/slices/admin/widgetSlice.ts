import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WidgetRecord {
  id?: string;
  mainTitle?: string;
  subTitle?: string;
  description?: string;
  externalUrl?: string;
  image?: string;
  displaySequence?: number;
  isActive?: boolean;
}

interface WidgetState {
  records: WidgetRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: WidgetState = {
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

export const fetchWidgets = createAsyncThunk<
  WidgetRecord[],
  void,
  { rejectValue: string }
>("widget/fetchWidgets", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/widget`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch widgets");
    }
    if (json && json.success && json.data) {
      return json.data;
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching widgets");
  }
});

export const addWidget = createAsyncThunk<
  WidgetRecord,
  WidgetRecord,
  { rejectValue: any }
>("widget/addWidget", async (record, { rejectWithValue }) => {
  try {
    const { id, ...payload } = record;
    const res = await fetch(`${API_BASE_URL}/admin/widget`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add widget" });
    }
    return json.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding widget");
  }
});

export const updateWidget = createAsyncThunk<
  WidgetRecord,
  WidgetRecord,
  { rejectValue: any }
>("widget/updateWidget", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/widget/${record.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update widget" });
    }
    return json.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating widget");
  }
});

export const deleteWidget = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("widget/deleteWidget", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/widget/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete widget");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete widget");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting widget");
  }
});

const widgetSlice = createSlice({
  name: "widget",
  initialState,
  reducers: {
    clearWidgetError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchWidgets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWidgets.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchWidgets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch widgets";
    });

    // Add
    builder.addCase(addWidget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addWidget.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addWidget.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add widget";
      }
    });

    // Update
    builder.addCase(updateWidget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateWidget.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateWidget.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update widget";
      }
    });

    // Delete
    builder.addCase(deleteWidget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteWidget.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => r.id !== action.payload);
    });
    builder.addCase(deleteWidget.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete widget";
    });
  },
});

export const { clearWidgetError } = widgetSlice.actions;
export default widgetSlice.reducer;
