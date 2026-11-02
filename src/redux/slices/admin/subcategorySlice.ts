import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubcategoryRecord {
  id?: string;
  _id?: string;
  category_id?: string | { id?: string; _id?: string; name?: string; [key: string]: any };
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface SubcategoryState {
  records: SubcategoryRecord[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: SubcategoryState = {
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

export const fetchSubcategorys = createAsyncThunk<
  SubcategoryRecord[],
  void,
  { rejectValue: string }
>("subcategory/fetchSubcategorys", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/subcategorys`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch subcategorys");
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
    return rejectWithValue(error.message || "Error fetching subcategorys");
  }
});

export const addSubcategory = createAsyncThunk<
  SubcategoryRecord,
  SubcategoryRecord,
  { rejectValue: any }
>("subcategory/addSubcategory", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/subcategorys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add subcategory" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding subcategory");
  }
});

export const updateSubcategory = createAsyncThunk<
  SubcategoryRecord,
  SubcategoryRecord,
  { rejectValue: any }
>("subcategory/updateSubcategory", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(`${API_BASE_URL}/admin/subcategorys/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update subcategory" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating subcategory");
  }
});

export const deleteSubcategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("subcategory/deleteSubcategory", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/subcategorys/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete subcategory");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete subcategory");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting subcategory");
  }
});

const subcategorySlice = createSlice({
  name: "subcategory",
  initialState,
  reducers: {
    clearSubcategoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchSubcategorys.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSubcategorys.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchSubcategorys.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch subcategorys";
    });

    // Add
    builder.addCase(addSubcategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addSubcategory.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(addSubcategory.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add subcategory";
      }
    });

    // Update
    builder.addCase(updateSubcategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateSubcategory.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(updateSubcategory.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update subcategory";
      }
    });

    // Delete
    builder.addCase(deleteSubcategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteSubcategory.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(deleteSubcategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete subcategory";
    });
  },
});

export const { clearSubcategoryError } = subcategorySlice.actions;
export default subcategorySlice.reducer;
