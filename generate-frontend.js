/* eslint-disable @typescript-eslint/no-require-imports */
// npm run generate:frontend <module_name>
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const toCamelCase = (str) => {
  const s = str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
  return s.charAt(0).toLowerCase() + s.slice(1);
};

const toPascalCase = (str) => {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

const askQuestion = (query) => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
  console.log("=== Enterprise Frontend Portal Module Generator ===");
  const moduleName = process.argv[2] || await askQuestion("Enter frontend module name (e.g., product, invoice, booking): ");
  if (!moduleName) {
    console.error("Module name is required.");
    process.exit(1);
  }

  const targetArea = 'frontEnd';
  const camelName = toCamelCase(moduleName);
  const pascalName = toPascalCase(moduleName);
  const sliceName = 'frontend' + pascalName + 'Slice';
  const sliceAlias = 'frontend' + pascalName;
  const appFolder = '(frontEnd)';
  
  const rootDir = path.join(__dirname);
  const srcDir = path.join(rootDir, 'src');

  // Paths
  const sliceDir = path.join(srcDir, 'redux', 'slices', targetArea);
  const sliceFilePath = path.join(sliceDir, sliceName + '.ts');

  const appDir = path.join(srcDir, 'app', appFolder, camelName);
  const appPagePath = path.join(appDir, 'page.tsx');
  
  const compDir = path.join(appDir, 'components');
  const compPath = path.join(compDir, pascalName + 'Content.tsx');

  // Ensure directories exist
  [sliceDir, appDir, compDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 1. Generate Redux Slice
  const sliceTemplate = `import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ${pascalName}Record {
  id: string;
  _id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // TODO: Add extra domain fields here
  [key: string]: any;
}

interface ${pascalName}State {
  records: ${pascalName}Record[];
  pagination?: PaginationInfo;
  loading: boolean;
  error: string | null;
}

const initialState: ${pascalName}State = {
  records: [],
  loading: false,
  error: null,
};

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("frontend_token") || localStorage.getItem("token")
    : null;
  return token ? { Authorization: \`Bearer \${token}\` } : {};
};

export const fetchFrontend${pascalName}s = createAsyncThunk<
  ${pascalName}Record[],
  void,
  { rejectValue: string }
>("frontend${pascalName}/fetch${pascalName}s", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(\`\${API_BASE_URL}/${camelName}s\`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch ${camelName}s");
    }
    if (json && json.success && json.data) {
      const items = Array.isArray(json.data) ? json.data : [json.data];
      return items.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        _id: item._id || item.id,
      }));
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching ${camelName}s");
  }
});

const ${sliceName} = createSlice({
  name: "frontend${pascalName}",
  initialState,
  reducers: {
    clear${pascalName}Error(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchFrontend${pascalName}s.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFrontend${pascalName}s.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchFrontend${pascalName}s.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch ${camelName}s";
    });
  },
});

export const { clear${pascalName}Error } = ${sliceName}.actions;
export default ${sliceName}.reducer;
`;

  fs.writeFileSync(sliceFilePath, sliceTemplate);
  console.log(`✅ Created Frontend Redux Slice: ${sliceFilePath}`);

  // 2. Generate Page wrapper for List
  const pageTemplate = `import type { Metadata } from "next";
import Footer from "../common/Footer";
import Header from "../common/Header";
import ${pascalName}Content from "./components/${pascalName}Content";

export const metadata: Metadata = { title: "${pascalName}s - Customer Portal" };

const ${pascalName}Page = () => {
  return (
    <div className="bg-body-secondary min-vh-100 d-flex flex-column">
      <Header />
      <main className="container py-5 mt-5 flex-grow-1">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">${pascalName}s</h2>
            <p className="text-muted mb-0">Browse and manage your ${camelName}s</p>
          </div>
        </div>
        <${pascalName}Content />
      </main>
      <Footer />
    </div>
  );
};

export default ${pascalName}Page;
`;

  fs.writeFileSync(appPagePath, pageTemplate);
  console.log(`✅ Created Frontend Page: ${appPagePath}`);

  // 3. Generate Component List with Search, Status, and Card Grid
  const compTemplate = `"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchFrontend${pascalName}s,
  ${pascalName}Record,
} from "@/redux/slices/frontEnd/${sliceName}";

const ${pascalName}Content = () => {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector(
    (state: any) => state.${sliceAlias} || { records: [], loading: false, error: null }
  );

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchFrontend${pascalName}s());
  }, [dispatch]);

  const filteredRecords = useMemo(() => {
    return records.filter((record: ${pascalName}Record) => {
      const name = (record.name || "").toLowerCase();
      const desc = (record.description || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [records, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center" role="alert">
        <div>{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="row mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search ${camelName}s..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center">
          <div className="card-body">
            <h5 className="text-muted mb-2">No ${camelName}s found</h5>
            <p className="text-muted fs-14 mb-0">
              {searchTerm ? "Try adjusting your search criteria." : "There are currently no records available."}
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredRecords.map((record: ${pascalName}Record) => {
            const recordId = record.id || record._id;
            return (
              <div key={recordId} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 hover-elevate transition-all">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title fw-bold text-dark mb-0">
                        {record.name || "Unnamed ${pascalName}"}
                      </h5>
                      {record.isActive !== undefined && (
                        <span
                          className={\`badge bg-\${record.isActive ? "success" : "secondary"}-subtle text-\${record.isActive ? "success" : "secondary"} fs-11 px-2 py-1\`}
                        >
                          {record.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                    <p className="card-text text-muted flex-grow-1 fs-14">
                      {record.description || "No description provided."}
                    </p>
                    {record.createdAt && (
                      <div className="text-muted fs-12 mb-3">
                        Added: {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    <button className="btn btn-primary btn-sm w-100 fw-semibold">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ${pascalName}Content;
`;

  fs.writeFileSync(compPath, compTemplate);
  console.log(`✅ Created Frontend Component: ${compPath}`);

  // 4. Update Redux store.ts (Auto-inject reducer)
  const storePath = path.join(srcDir, 'redux', 'store.ts');
  if (fs.existsSync(storePath)) {
    let storeContent = fs.readFileSync(storePath, 'utf8');
    
    // Check if it already has this slice
    if (!storeContent.includes(`${sliceAlias}:`) && !storeContent.includes(`${sliceAlias}Reducer`)) {
      const importStatement = `import ${sliceAlias}Reducer from "./slices/${targetArea}/${sliceName}";`;
      
      // Find last import
      const importMatches = [...storeContent.matchAll(/^import .*;$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const lastImportIndex = lastImport.index + lastImport[0].length;
        
        storeContent = storeContent.slice(0, lastImportIndex) + '\n' + importStatement + storeContent.slice(lastImportIndex);
      } else {
        storeContent = importStatement + '\n' + storeContent;
      }
      
      // Inject into reducer object
      const reducerMatch = storeContent.match(/reducer:\s*\{/);
      if (reducerMatch) {
        const insertIndex = reducerMatch.index + reducerMatch[0].length;
        const reducerLine = `\n    ${sliceAlias}: ${sliceAlias}Reducer,`;
        storeContent = storeContent.slice(0, insertIndex) + reducerLine + storeContent.slice(insertIndex);
        fs.writeFileSync(storePath, storeContent);
        console.log(`✅ Updated Redux Store: ${storePath}`);
      } else {
        console.log(`⚠️ Could not find reducer object in store.ts. Please add ${sliceAlias}: ${sliceAlias}Reducer manually.`);
      }
    } else {
      console.log(`⚠️ ${sliceAlias} reducer already registered in store.ts.`);
    }
  }

  console.log("\n🎉 Frontend Module '" + moduleName + "' created successfully!");
  
  rl.close();
}

main().catch(console.error);
