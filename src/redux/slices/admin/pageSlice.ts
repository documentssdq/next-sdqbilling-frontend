import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { PageRecord } from "@/app/admin/dataStore";
export type { PageRecord };
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PageState {
  records: PageRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: PageState = {
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

export const fetchPages = createAsyncThunk<
  PageRecord[],
  void,
  { rejectValue: string }
>("page/fetchPages", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/page`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch pages");
    }
    if (json && json.success && json.data) {
      return json.data.map((item: any) => ({ ...item, id: item.id || item._id }));
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching pages");
  }
});

export const addPage = createAsyncThunk<
  PageRecord,
  PageRecord,
  { rejectValue: any }
>("page/addPage", async (record, { rejectWithValue }) => {
  try {
    const { ...payload } = record as any;
    const res = await fetch(`${API_BASE_URL}/admin/page`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return rejectWithValue(json);
    }
    return { ...json.data, id: json.data.id || json.data._id };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding page");
  }
});

export const updatePage = createAsyncThunk<
  PageRecord,
  PageRecord,
  { rejectValue: any }
>("page/updatePage", async (record, { rejectWithValue }) => {
  try {
    const { ...payload } = record as any;
    const res = await fetch(`${API_BASE_URL}/admin/page/${record.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return rejectWithValue(json);
    }
    return { ...json.data, id: json.data.id || json.data._id };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating page");
  }
});

export const deletePage = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("page/deletePage", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/page/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to delete page");
    const json = await res.json();
    if (json.success) {
      return id;
    }
    return rejectWithValue(json.message || "Failed to delete page");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting page");
  }
});

const pageSlice = createSlice({
  name: "page",
  initialState,
  reducers: {
    clearPageError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchPages.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPages.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchPages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch pages";
    });

    // Add
    builder.addCase(addPage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addPage.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addPage.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add page";
      }
    });

    // Update
    builder.addCase(updatePage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updatePage.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updatePage.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update page";
      }
    });

    // Delete
    builder.addCase(deletePage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deletePage.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => r.id !== action.payload);
    });
    builder.addCase(deletePage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete page";
    });
  },
});

export const { clearPageError } = pageSlice.actions;
export default pageSlice.reducer;
