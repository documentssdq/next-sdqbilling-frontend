import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface EmailTemplate {
  id?: string;
  _id?: string;
  title: string;
  unique_code: string;
  subject: string;
  from_email: string;
  from_name: string;
  message: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchTemplatesResponse {
  data: EmailTemplate[];
  total: number;
}

interface EmailTemplateState {
  templates: EmailTemplate[];
  total: number;
  loading: boolean;
  error: string | null;
  currentTemplate: EmailTemplate | null;
}

const initialState: EmailTemplateState = {
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

export const fetchEmailTemplates = createAsyncThunk<
  FetchTemplatesResponse,
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>(
  "emailTemplates/fetchEmailTemplates",
  async (args, { rejectWithValue }) => {
    try {
      const page = args?.page || 1;
      const limit = args?.limit || 10;
      const token = getToken();
      
      const res = await fetch(`${API_BASE_URL}/admin/emailtemplate?page=${page}&limit=${limit}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch email templates");
      const json = await res.json();
      if (json.success && json.data) {
        // API might return { data: [], total: number } based on the backend
        return {
          data: json.data,
          total: json.pagination?.total || json.meta?.total || json.total || json.data.length,
        };
      }
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch email templates");
    }
  }
);

export const fetchEmailTemplateById = createAsyncThunk<
  EmailTemplate,
  string,
  { rejectValue: string }
>(
  "emailTemplates/fetchEmailTemplateById",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/emailtemplate/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch email template");
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch email template");
    }
  }
);

export const addEmailTemplate = createAsyncThunk<
  EmailTemplate,
  EmailTemplate,
  { rejectValue: string }
>(
  "emailTemplates/addEmailTemplate",
  async (templateData: EmailTemplate, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/emailtemplate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(templateData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add email template");
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add email template");
    }
  }
);

export const updateEmailTemplate = createAsyncThunk<
  EmailTemplate,
  { id: string; templateData: Partial<EmailTemplate> },
  { rejectValue: string }
>(
  "emailTemplates/updateEmailTemplate",
  async ({ id, templateData }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/emailtemplate/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(templateData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update email template");
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update email template");
    }
  }
);

export const updateEmailTemplateStatus = createAsyncThunk<
  EmailTemplate,
  { id: string; status: boolean | number },
  { rejectValue: string }
>(
  "emailTemplates/updateEmailTemplateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/emailtemplate/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update email template status");
      if (json.success && json.data) return json.data;
      return rejectWithValue(json.message || "Invalid data received");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update email template status");
    }
  }
);

export const deleteEmailTemplate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "emailTemplates/deleteEmailTemplate",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/emailtemplate/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete email template");
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete email template");
    }
  }
);

const emailTemplateSlice = createSlice({
  name: "emailTemplates",
  initialState,
  reducers: {
    clearEmailTemplateError: (state) => {
      state.error = null;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Templates
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action: PayloadAction<FetchTemplatesResponse>) => {
        state.loading = false;
        state.templates = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Template by ID
      .addCase(fetchEmailTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplateById.fulfilled, (state, action: PayloadAction<EmailTemplate>) => {
        state.loading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchEmailTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Template
      .addCase(addEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEmailTemplate.fulfilled, (state, action: PayloadAction<EmailTemplate>) => {
        state.loading = false;
        state.templates.unshift(action.payload);
        state.total += 1;
      })
      .addCase(addEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Template
      .addCase(updateEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmailTemplate.fulfilled, (state, action: PayloadAction<EmailTemplate>) => {
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
      .addCase(updateEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Template Status
      .addCase(updateEmailTemplateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmailTemplateStatus.fulfilled, (state, action: PayloadAction<EmailTemplate>) => {
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
      .addCase(updateEmailTemplateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Template
      .addCase(deleteEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmailTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.templates = state.templates.filter(
          (t) => (t._id || t.id) !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEmailTemplateError, clearCurrentTemplate } = emailTemplateSlice.actions;
export default emailTemplateSlice.reducer;
