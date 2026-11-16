import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const START_FINANCIAL_YEAR = "2026-2027";
export const START_YEAR = 2026;

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || sessionStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Calculates current financial year (e.g. "2026-2027") from date.
 * Fiscal cycle starts April 1st (month index 3).
 */
export const getFinancialYear = (date: string | Date = new Date()): string => {
  const d = new Date(date);
  const valid = !isNaN(d.getTime());
  const year = valid ? d.getFullYear() : new Date().getFullYear();
  const month = valid ? d.getMonth() : new Date().getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

/**
 * Formats any loose input (e.g. "2027", "2027-28", "2027-2028") into standard "YYYY-YYYY" format.
 */
export const formatFinancialYearInput = (input: string): string => {
  const clean = input.trim();
  // If already YYYY-YYYY
  if (/^\d{4}-\d{4}$/.test(clean)) {
    return clean;
  }
  // If YYYY-YY (e.g. 2027-28)
  const matchShort = clean.match(/^(\d{4})-(\d{2})$/);
  if (matchShort) {
    const start = matchShort[1];
    const endPrefix = start.slice(0, 2);
    return `${start}-${endPrefix}${matchShort[2]}`;
  }
  // If single 4-digit year (e.g. 2027)
  const matchYear = clean.match(/^(\d{4})$/);
  if (matchYear) {
    const start = parseInt(matchYear[1], 10);
    return `${start}-${start + 1}`;
  }
  return clean;
};

/**
 * Generates financial years starting from 2026-2027 up to the current active financial year.
 * Does not generate previous years before 2026-2027.
 * Auto-increases automatically when the next financial year starts (e.g. April 1, 2027).
 */
export const generateDefaultFinancialYears = (): string[] => {
  const currentFY = getFinancialYear();
  const currentStartYear = parseInt(currentFY.split("-")[0], 10);

  // Software starts from 2026-2027. Do not generate previous years!
  const minStartYear = START_YEAR; // 2026
  const maxStartYear = Math.max(currentStartYear, minStartYear);

  const years: string[] = [];
  for (let y = maxStartYear; y >= minStartYear; y--) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
};

const filterValidYears = (years: string[]): string[] => {
  return years
    .map(formatFinancialYearInput)
    .filter((fy) => {
      const startY = parseInt(fy.split("-")[0], 10);
      return !isNaN(startY) && startY >= START_YEAR;
    });
};

export const fetchFinancialYears = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("financialYear/fetchFinancialYears", async (_, { }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/purchase/financial-years`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
    return generateDefaultFinancialYears();
  } catch (error: any) {
    return generateDefaultFinancialYears();
  }
});

export interface FinancialYearState {
  selectedFinYear: string; // Defaults to current FY e.g. "2026-2027", or "All"
  availableFinYears: string[];
  loading: boolean;
  error: string | null;
}

const currentFY = getFinancialYear();

const getInitialSelectedFinYear = (): string => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("global_fin_year");
      if (stored && stored.trim()) {
        const cleaned = stored.trim();
        if (cleaned === "All") return "All";
        const startY = parseInt(cleaned.split("-")[0], 10);
        if (!isNaN(startY) && startY >= START_YEAR) {
          return cleaned;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  // By default, current financial year (e.g. "2026-2027")
  return currentFY;
};

const defaultFYs = generateDefaultFinancialYears();

const initialState: FinancialYearState = {
  selectedFinYear: getInitialSelectedFinYear(),
  availableFinYears: defaultFYs,
  loading: false,
  error: null,
};

const financialYearSlice = createSlice({
  name: "financialYear",
  initialState,
  reducers: {
    setSelectedFinYear: (state, action: PayloadAction<string>) => {
      const formatted = action.payload === "All" ? "All" : formatFinancialYearInput(action.payload);
      state.selectedFinYear = formatted;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("global_fin_year", formatted);
        } catch (e) {
          // ignore
        }
      }
    },
    setAvailableFinYears: (state, action: PayloadAction<string[]>) => {
      const valid = filterValidYears(action.payload);
      const set = new Set<string>([...valid, ...state.availableFinYears]);
      state.availableFinYears = Array.from(set).sort().reverse();
    },
    addFinancialYear: (state, action: PayloadAction<string>) => {
      const formatted = formatFinancialYearInput(action.payload);
      const startY = parseInt(formatted.split("-")[0], 10);
      if (!isNaN(startY) && startY >= START_YEAR) {
        if (!state.availableFinYears.includes(formatted)) {
          state.availableFinYears = [formatted, ...state.availableFinYears].sort().reverse();
        }
        state.selectedFinYear = formatted;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("global_fin_year", formatted);
          } catch (e) {
            // ignore
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinancialYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinancialYears.fulfilled, (state, action) => {
        state.loading = false;
        const validApi = filterValidYears(action.payload);
        const set = new Set<string>([
          ...validApi,
          ...generateDefaultFinancialYears(),
        ]);
        state.availableFinYears = Array.from(set).sort().reverse();
      })
      .addCase(fetchFinancialYears.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch financial years";
      });
  },
});

export const { setSelectedFinYear, setAvailableFinYears, addFinancialYear } =
  financialYearSlice.actions;
export default financialYearSlice.reducer;
