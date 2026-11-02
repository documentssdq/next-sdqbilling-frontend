import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface SmsTemplate {
  id?: string;
  _id?: string;
  title: string;
  unique_code: string;
  subject?: string;
  template_id: string;
  message: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchSmsTemplatesResponse {
  data: SmsTemplate[];
  total: number;
}

interface SmsTemplateState {
  templates: SmsTemplate[];
  total: number;
  loading: boolean;
  error: string | null;
  currentTemplate: SmsTemplate | null;
}

const initialState: SmsTemplateState = {
  templates: [],
  total: 0,
  loading: false,
  error: null,
  currentTemplate: null,
};

const getToken = () => {
  return typeof window !== "undefined"
    ? localStorage.getItem("token") || sessionStorage.getItem("token")
    : null;
};

export const fetchSmsTemplates = createAsyncThunk<
  FetchSmsTemplatesResponse,
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>(
  "smsTemplates/fetchSmsTemplates",
  async (args, { rejectWithValue }) => {
    try {
      const page = args?.page || 1;
      const limit = args?.limit || 100;
      const token = getToken();
      
      const res = await fetch(`${API_BASE_URL}/admin/smstemplate?page=${page}&limit=${limit}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch sms templates");
      const json = await res.json();
      if (json.success && json.data) {
        return {
          data: json.data,
          total: json.pagination?.total || json.meta?.total || json.total || json.data.length,
        };
      }
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sms templates");
    }
  }
);

export const fetchSmsTemplateById = createAsyncThunk<
  SmsTemplate,
  string,
  { rejectValue: string }
>(
  "smsTemplates/fetchSmsTemplateById",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/smstemplate/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch sms template");
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sms template");
    }
  }
);

export const addSmsTemplate = createAsyncThunk<
  SmsTemplate,
  SmsTemplate,
  { rejectValue: string }
>(
  "smsTemplates/addSmsTemplate",
  async (templateData: SmsTemplate, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/smstemplate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(templateData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add sms template");
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add sms template");
    }
  }
);

export const updateSmsTemplate = createAsyncThunk<
  SmsTemplate,
  { id: string; templateData: Partial<SmsTemplate> },
  { rejectValue: string }
>(
  "smsTemplates/updateSmsTemplate",
  async ({ id, templateData }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/smstemplate/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(templateData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update sms template");
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update sms template");
    }
  }
);

export const updateSmsTemplateStatus = createAsyncThunk<
  SmsTemplate,
  { id: string; status: boolean | number },
  { rejectValue: string }
>(
  "smsTemplates/updateSmsTemplateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/smstemplate/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update sms template status");
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update sms template status");
    }
  }
);

export const deleteSmsTemplate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "smsTemplates/deleteSmsTemplate",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/smstemplate/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete sms template");
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete sms template");
    }
  }
);

const smsTemplateSlice = createSlice({
  name: "smsTemplates",
  initialState,
  reducers: {
    clearSmsTemplateError: (state) => {
      state.error = null;
    },
    clearCurrentSmsTemplate: (state) => {
      state.currentTemplate = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Templates
      .addCase(fetchSmsTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSmsTemplates.fulfilled, (state, action: PayloadAction<FetchSmsTemplatesResponse>) => {
        state.loading = false;
        state.templates = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchSmsTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Template by ID
      .addCase(fetchSmsTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSmsTemplateById.fulfilled, (state, action: PayloadAction<SmsTemplate>) => {
        state.loading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchSmsTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Template
      .addCase(addSmsTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSmsTemplate.fulfilled, (state, action: PayloadAction<SmsTemplate>) => {
        state.loading = false;
        state.templates.unshift(action.payload);
        state.total += 1;
      })
      .addCase(addSmsTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Template
      .addCase(updateSmsTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSmsTemplate.fulfilled, (state, action: PayloadAction<SmsTemplate>) => {
        state.loading = false;
        const index = state.templates.findIndex(
          (t) => (t._id || t.id) === (action.payload._id || action.payload.id)
        );
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.currentTemplate && (state.currentTemplate._id || state.currentTemplate.id) === (action.payload._id || action.payload.id)) {
            state.currentTemplate = action.payload;
        }
      })
      .addCase(updateSmsTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Template Status
      .addCase(updateSmsTemplateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSmsTemplateStatus.fulfilled, (state, action: PayloadAction<SmsTemplate>) => {
        state.loading = false;
        const index = state.templates.findIndex(
          (t) => (t._id || t.id) === (action.payload._id || action.payload.id)
        );
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.currentTemplate && (state.currentTemplate._id || state.currentTemplate.id) === (action.payload._id || action.payload.id)) {
            state.currentTemplate = action.payload;
        }
      })
      .addCase(updateSmsTemplateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Template
      .addCase(deleteSmsTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSmsTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.templates = state.templates.filter(
          (t) => (t._id || t.id) !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteSmsTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSmsTemplateError, clearCurrentSmsTemplate } = smsTemplateSlice.actions;
export default smsTemplateSlice.reducer;
