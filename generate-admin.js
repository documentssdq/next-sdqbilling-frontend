/* eslint-disable @typescript-eslint/no-require-imports */
// npm run generate:admin <module_name>
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
  console.log("=== Enterprise Admin Module Generator ===");
  const moduleName = process.argv[2] || await askQuestion("Enter module name (e.g., party, item, invoice, tax): ");
  if (!moduleName) {
    console.error("Module name is required.");
    process.exit(1);
  }

  const targetArea = 'admin';
  const camelName = toCamelCase(moduleName);
  const pascalName = toPascalCase(moduleName);
  const sliceName = camelName + 'Slice';
  const appFolder = 'admin';
  
  const rootDir = path.join(__dirname);
  const srcDir = path.join(rootDir, 'src');

  // Paths
  const sliceDir = path.join(srcDir, 'redux', 'slices', targetArea);
  const sliceFilePath = path.join(sliceDir, sliceName + '.ts');

  const appDir = path.join(srcDir, 'app', appFolder, camelName);
  const appPagePath = path.join(appDir, 'page.tsx');
  
  const compDir = path.join(appDir, 'components');
  const compPath = path.join(compDir, pascalName + 'ListContent.tsx');
  const modalPath = path.join(compDir, pascalName + 'Modal.tsx');
  const formPath = path.join(compDir, pascalName + 'Form.tsx');

  const addPageDir = path.join(appDir, 'add');
  const addPagePath = path.join(addPageDir, 'page.tsx');

  const editPageDir = path.join(appDir, 'edit', '[id]');
  const editPagePath = path.join(editPageDir, 'page.tsx');

  // Ensure directories exist
  [sliceDir, appDir, compDir, addPageDir, editPageDir].forEach(dir => {
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
    ? localStorage.getItem("token") || sessionStorage.getItem("token")
    : null;
  return token ? { Authorization: \`Bearer \${token}\` } : {};
};

export const fetch${pascalName} = createAsyncThunk<
  ${pascalName}Record[],
  void,
  { rejectValue: string }
>("${camelName}/fetch${pascalName}", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(\`\${API_BASE_URL}/${targetArea}/${camelName}\`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch ${camelName}");
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
    return rejectWithValue(error.message || "Error fetching ${camelName}");
  }
});

export const add${pascalName} = createAsyncThunk<
  ${pascalName}Record,
  ${pascalName}Record,
  { rejectValue: any }
>("${camelName}/add${pascalName}", async (record, { rejectWithValue }) => {
  try {
    const res = await fetch(\`\${API_BASE_URL}/${targetArea}/${camelName}\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to add ${camelName}" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error adding ${camelName}");
  }
});

export const update${pascalName} = createAsyncThunk<
  ${pascalName}Record,
  ${pascalName}Record,
  { rejectValue: any }
>("${camelName}/update${pascalName}", async (record, { rejectWithValue }) => {
  try {
    const targetId = record.id || record._id;
    const res = await fetch(\`\${API_BASE_URL}/${targetArea}/${camelName}/\${targetId}\`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(record),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return rejectWithValue(json || { message: "Failed to update ${camelName}" });
    }
    return {
      ...json.data,
      id: json.data?.id || json.data?._id,
      _id: json.data?._id || json.data?.id,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Error updating ${camelName}");
  }
});

export const delete${pascalName} = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("${camelName}/delete${pascalName}", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(\`\${API_BASE_URL}/${targetArea}/${camelName}/\${id}\`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to delete ${camelName}");
    }
    if (json && json.success) {
      return id;
    }
    return rejectWithValue(json?.message || "Failed to delete ${camelName}");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error deleting ${camelName}");
  }
});

const ${sliceName} = createSlice({
  name: "${camelName}",
  initialState,
  reducers: {
    clear${pascalName}Error(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetch${pascalName}.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetch${pascalName}.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetch${pascalName}.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch ${camelName}";
    });

    // Add
    builder.addCase(add${pascalName}.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(add${pascalName}.fulfilled, (state, action) => {
      state.loading = false;
      state.records.push(action.payload);
    });
    builder.addCase(add${pascalName}.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to add ${camelName}";
      }
    });

    // Update
    builder.addCase(update${pascalName}.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(update${pascalName}.fulfilled, (state, action) => {
      state.loading = false;
      const targetId = action.payload.id || action.payload._id;
      const index = state.records.findIndex((r) => (r.id || r._id) === targetId);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    });
    builder.addCase(update${pascalName}.rejected, (state, action) => {
      state.loading = false;
      if (typeof action.payload === "object" && action.payload?.errors) {
        state.error = null;
      } else {
        state.error = action.payload?.message || action.payload || "Failed to update ${camelName}";
      }
    });

    // Delete
    builder.addCase(delete${pascalName}.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(delete${pascalName}.fulfilled, (state, action) => {
      state.loading = false;
      state.records = state.records.filter((r) => (r.id || r._id) !== action.payload);
    });
    builder.addCase(delete${pascalName}.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete ${camelName}";
    });
  },
});

export const { clear${pascalName}Error } = ${sliceName}.actions;
export default ${sliceName}.reducer;
`;

  fs.writeFileSync(sliceFilePath, sliceTemplate);
  console.log(`✅ Created Redux Slice: ${sliceFilePath}`);

  // 2. Generate Modal Component (Add/Edit in Modal)
  const modalTemplate = `"use client";

import React, { useEffect, useState } from "react";
import Icon from "@/components/wrappers/Icon";
import {
  Modal,
  Button,
  Row,
  Col,
  FormLabel,
  FormControl,
  FormCheck,
  Alert,
  Spinner,
} from "react-bootstrap";
import { ${pascalName}Record } from "@/redux/slices/${targetArea}/${sliceName}";

interface ${pascalName}ModalProps {
  show: boolean;
  onHide: () => void;
  ${camelName}: ${pascalName}Record | null;
  onSave: (record: ${pascalName}Record) => Promise<void>;
}

const ${pascalName}Modal: React.FC<${pascalName}ModalProps> = ({
  show,
  onHide,
  ${camelName},
  onSave,
}) => {
  const isEdit = !!${camelName};

  const [formData, setFormData] = useState<${pascalName}Record>({
    id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (${camelName}) {
      setFormData({
        id: ${camelName}.id || ${camelName}._id || "",
        _id: ${camelName}._id || ${camelName}.id || "",
        name: ${camelName}.name || "",
        description: ${camelName}.description || "",
        isActive: ${camelName}.isActive !== undefined ? ${camelName}.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [${camelName}, show]);

  const handleChange = (field: keyof ${pascalName}Record, value: any) => {
    setFormData((prev: ${pascalName}Record) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errors.name = "${pascalName} name is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("");
      return;
    }

    setValidationErrors({});
    setErrorMessage("");
    setSubmitting(true);

    try {
      await onSave(formData);
      onHide();
    } catch (err: any) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error: Please check fields.");
      } else {
        setErrorMessage(err?.message || "Failed to save ${camelName}.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-16 d-flex align-items-center gap-2">
            <Icon
              icon={isEdit ? "square-pen" : "plus-circle"}
              className="text-primary"
            />
            {isEdit ? \`Edit ${pascalName}: \${${camelName}?.name || ""}\` : "Add ${pascalName}"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {errorMessage && (
            <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
              <Icon icon="alert-circle" className="me-2" />
              {errorMessage}
            </Alert>
          )}

          <Row className="g-3">
            <Col xs={12}>
              <FormLabel className="fw-semibold">
                ${pascalName} Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="Enter name..."
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                isInvalid={!!validationErrors.name}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.name}
              </FormControl.Feedback>
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold">Description</FormLabel>
              <FormControl
                as="textarea"
                rows={3}
                placeholder="Describe details..."
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                isInvalid={!!validationErrors.description}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.description}
              </FormControl.Feedback>
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold mb-2 d-block">Status</FormLabel>
              <FormCheck
                type="switch"
                id="${camelName}-status-switch"
                label={formData.isActive ? "Active" : "Inactive"}
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="fs-15 fw-semibold mt-1"
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="light" onClick={onHide} type="button" disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="d-flex align-items-center gap-1"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon={isEdit ? "save" : "plus"} />
                {isEdit ? "Save Changes" : "Create ${pascalName}"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default ${pascalName}Modal;
`;

  fs.writeFileSync(modalPath, modalTemplate);
  console.log(`✅ Created Modal Component: ${modalPath}`);

  // 3. Generate Page wrapper for List
  const pageTemplate = `import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import ${pascalName}ListContent from "./components/${pascalName}ListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "${pascalName} List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="${pascalName}">
      <PageBreadcrumb title="List" subtitle="${pascalName}" />
      <Row>
        <Col xs={12}>
          <${pascalName}ListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
`;

  fs.writeFileSync(appPagePath, pageTemplate);
  console.log(`✅ Created Page: ${appPagePath}`);

  // 4. Generate Component List with Modal Add/Edit, Search, CSV, and Bulk Delete
  const compTemplate = `"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardFooter,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Button,
  Dropdown,
  Alert,
  FormSelect,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetch${pascalName},
  add${pascalName},
  update${pascalName},
  delete${pascalName},
  ${pascalName}Record,
} from "@/redux/slices/${targetArea}/${sliceName}";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import Swal from "sweetalert2";
import { useAccess } from "@/hooks/useAccess";
import ${pascalName}Modal from "./${pascalName}Modal";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Row as TableRow,
  Table as TableType,
  useReactTable,
} from "@tanstack/react-table";

const ${pascalName}ListContent = () => {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector(
    (state: any) => state.${camelName} || { records: [], loading: false, error: null }
  );

  const access = useAccess("${pascalName}");
  const fallbackAccess = useAccess("${pascalName}");
  const canWrite = access.write || fallbackAccess.write;
  const canDelete = access.delete || fallbackAccess.delete;
  const canExport = access.export || fallbackAccess.export;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected${pascalName}, setSelected${pascalName}] = useState<${pascalName}Record | null>(null);

  const handleOpenAddModal = () => {
    setSelected${pascalName}(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (record: ${pascalName}Record) => {
    setSelected${pascalName}(record);
    setModalOpen(true);
  };

  const handleSave${pascalName} = async (record: ${pascalName}Record) => {
    if (selected${pascalName} && (selected${pascalName}.id || selected${pascalName}._id)) {
      const targetId = selected${pascalName}.id || selected${pascalName}._id;
      await dispatch(update${pascalName}({ ...record, id: targetId })).unwrap();
      setAlertMsg(\`${pascalName} "\${record.name}" updated successfully.\`);
    } else {
      const { id, _id, ...payload } = record;
      await dispatch(add${pascalName}(payload)).unwrap();
      setAlertMsg(\`${pascalName} "\${record.name}" created successfully.\`);
    }
  };

  useEffect(() => {
    dispatch(fetch${pascalName}());
  }, [dispatch]);

  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  const handleConfirmDeleteSingle = (record: ${pascalName}Record) => {
    const recordId = record.id || record._id;
    Swal.fire({
      title: "Delete Record?",
      text: \`Are you sure you want to delete "\${record.name || recordId}"? This action cannot be undone.\`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed && recordId) {
        const res = await dispatch(delete${pascalName}(recordId));
        if (delete${pascalName}.fulfilled.match(res)) {
          setAlertMsg(\`Record "\${record.name || recordId}" has been deleted.\`);
          Swal.fire({
            title: "Deleted!",
            text: "Record has been deleted.",
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      }
    });
  };

  const handleConfirmBulkDelete = () => {
    const selectedIds = Object.keys(selectedRowIds);
    if (selectedIds.length === 0) return;

    Swal.fire({
      title: "Delete Selected?",
      text: \`Are you sure you want to delete \${selectedIds.length} record(s)? This action cannot be undone.\`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        let deletedCount = 0;
        for (const id of selectedIds) {
          const res = await dispatch(delete${pascalName}(id));
          if (delete${pascalName}.fulfilled.match(res)) {
            deletedCount++;
          }
        }
        setAlertMsg(\`Successfully deleted \${deletedCount} record(s).\`);
        setSelectedRowIds({});
        Swal.fire({
          title: "Deleted!",
          text: \`\${deletedCount} record(s) have been deleted.\`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r: ${pascalName}Record) => {
      const matchesSearch =
        (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const isActiveStatus = r.isActive ? "Active" : "Inactive";
      const matchesStatus = statusFilter === "All" || isActiveStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const columnHelper = createColumnHelper<${pascalName}Record>();

  const columns: ColumnDef<${pascalName}Record, any>[] = [
    columnHelper.display({
      id: "selection",
      header: ({ table }: { table: TableType<${pascalName}Record> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<${pascalName}Record> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ row }) => (
        <div className="fw-semibold text-dark fs-14">{row.original.name || "N/A"}</div>
      ),
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: ({ row }) => (
        <div className="text-muted fs-13 text-truncate" style={{ maxWidth: "250px" }}>
          {row.original.description || "—"}
        </div>
      ),
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const variant = isActive ? "success" : "danger";
        const label = isActive ? "Active" : "Inactive";
        const icon = isActive ? "check-circle" : "alert-triangle";
        return (
          <div className="d-inline-flex align-items-center gap-1">
            <span
              className={\`badge bg-\${variant}-subtle text-\${variant} badge-label d-inline-flex align-items-center gap-1\`}
            >
              <Icon icon={icon} className="fs-xs" />
              <span>{label}</span>
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: TableRow<${pascalName}Record> }) => {
        const recordId = row.original.id || row.original._id || "";
        return (
          <div className="d-flex align-items-center gap-1">
            {canWrite && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={\`edit-\${recordId}\`}>Edit</Tooltip>}
              >
                <Button
                  size="sm"
                  className="btn-default btn-icon rounded-circle"
                  onClick={() => handleOpenEditModal(row.original)}
                >
                  <Icon icon="square-pen" className="fs-lg text-secondary" />
                </Button>
              </OverlayTrigger>
            )}
            {canDelete && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={\`del-\${recordId}\`}>Delete</Tooltip>}
              >
                <Button
                  size="sm"
                  className="btn-default btn-icon rounded-circle"
                  onClick={() => handleConfirmDeleteSingle(row.original)}
                >
                  <Icon icon="trash-2" className="fs-lg text-danger" />
                </Button>
              </OverlayTrigger>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: { sorting, pagination, rowSelection: selectedRowIds },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getRowId: (row) => row.id || row._id || "",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalItems = filteredRecords.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          <Icon icon="alert-triangle" className="me-2" />
          {error}
        </Alert>
      )}
      {alertMsg && (
        <Alert
          variant="success"
          onClose={() => setAlertMsg(null)}
          dismissible
          className="d-flex align-items-center gap-2 mb-3"
        >
          <Icon icon="check-circle" className="fs-18 flex-shrink-0" />
          <span>{alertMsg}</span>
        </Alert>
      )}
      <Card className="shadow-sm border-0">
        <div className="p-3 border-bottom">
          <h5 className="mb-1 fw-bold">Manage ${pascalName}</h5>
        </div>
        <CardHeader className="border-light justify-content-between align-items-center flex-wrap gap-2 py-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="d-flex align-items-center gap-1">
              <span className="text-muted fw-semibold fs-xs">Show</span>
              <FormSelect
                className="form-select form-select-sm my-1 my-md-0"
                style={{ width: "auto" }}
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 15, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </FormSelect>
            </div>
            <span className="ms-2 me-1 fw-semibold text-muted fs-xs d-flex align-items-center gap-1">
              <Icon icon="filter" className="fs-xs text-primary" /> Filter By:
            </span>
            <Dropdown className="d-inline-block">
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-1 my-1 my-md-0"
              >
                <span className="fw-semibold">
                  {statusFilter === "All" ? "All Statuses" : statusFilter}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  active={statusFilter === "All"}
                  onClick={() => setStatusFilter("All")}
                >
                  All Statuses
                </Dropdown.Item>
                <Dropdown.Item
                  active={statusFilter === "Active"}
                  onClick={() => setStatusFilter("Active")}
                >
                  Active
                </Dropdown.Item>
                <Dropdown.Item
                  active={statusFilter === "Inactive"}
                  onClick={() => setStatusFilter("Inactive")}
                >
                  Inactive
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="app-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Icon icon="search" className="app-search-icon text-muted" />
            </div>
            {canDelete && Object.keys(selectedRowIds).length > 0 && (
              <Button variant="danger" size="sm" onClick={handleConfirmBulkDelete}>
                Delete ({Object.keys(selectedRowIds).length})
              </Button>
            )}
            {canExport && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tooltip-export-csv">Export to CSV</Tooltip>}
              >
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => {
                    const selectedIds = Object.keys(selectedRowIds);
                    const dataToExport =
                      selectedIds.length > 0
                        ? filteredRecords.filter((r: ${pascalName}Record) =>
                            selectedIds.includes(r.id || r._id || "")
                          )
                        : filteredRecords;

                    const csvRows = [
                      ["Name", "Description", "Status", "Created At"],
                      ...dataToExport.map((r: ${pascalName}Record) => [
                        r.name || "",
                        r.description || "",
                        r.isActive ? "Active" : "Inactive",
                        r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "",
                      ]),
                    ];
                    const csvString = csvRows
                      .map((row) =>
                        row
                          .map((c: any) => \`"\${String(c).replace(/"/g, '""')}"\`)
                          .join(",")
                      )
                      .join("\\n");
                    const blob = new Blob([csvString], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = \`${camelName}_export.csv\`;
                    link.click();
                  }}
                  className="d-flex align-items-center gap-1"
                >
                  <Icon icon="download" className="fs-sm" /> Export
                </Button>
              </OverlayTrigger>
            )}
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="tooltip-reset">Reset Filters</Tooltip>}
            >
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                  table.setPageSize(10);
                }}
              >
                <Icon icon="rotate-ccw" className="fs-sm" />
              </Button>
            </OverlayTrigger>
            {canWrite && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tooltip-add-new">Add New</Tooltip>}
              >
                <Button
                  variant="primary"
                  size="sm"
                  className="d-flex align-items-center gap-1 fw-semibold"
                  onClick={handleOpenAddModal}
                >
                  <Icon icon="plus" className="fs-sm" /> Add New
                </Button>
              </OverlayTrigger>
            )}
          </div>
        </CardHeader>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <DataTable<${pascalName}Record> table={table} emptyMessage="No records found." />
            {filteredRecords.length > 0 && (
              <CardFooter className="border-0 bg-white pt-2 pb-4 px-4">
                <TablePagination
                  totalItems={totalItems}
                  start={start}
                  end={end}
                  previousPage={() => table.previousPage()}
                  canPreviousPage={table.getCanPreviousPage()}
                  pageCount={table.getPageCount()}
                  pageIndex={table.getState().pagination.pageIndex}
                  setPageIndex={(index) => table.setPageIndex(index)}
                  nextPage={() => table.nextPage()}
                  canNextPage={table.getCanNextPage()}
                  showInfo={true}
                  itemsName="records"
                />
              </CardFooter>
            )}
          </>
        )}
      </Card>

      <${pascalName}Modal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        ${camelName}={selected${pascalName}}
        onSave={handleSave${pascalName}}
      />
    </>
  );
};

export default ${pascalName}ListContent;
`;
  fs.writeFileSync(compPath, compTemplate);
  console.log(`✅ Created List Component: ${compPath}`);

  // 5. Generate Standalone Form Component (Full page fallback)
  const formTemplate = `"use client";
import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Icon from "@/components/wrappers/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  FormCheck,
  FormControl,
  FormLabel,
  Row,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  add${pascalName},
  update${pascalName},
  fetch${pascalName},
  ${pascalName}Record,
} from "@/redux/slices/${targetArea}/${sliceName}";

interface ${pascalName}FormProps {
  mode: "add" | "edit";
  recordId?: string;
}

const ${pascalName}Form: React.FC<${pascalName}FormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.${camelName} || { records: [] }
  );

  const [formData, setFormData] = useState<${pascalName}Record>({
    id: recordId || "",
    name: "",
    description: "",
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetch${pascalName}());
    }
  }, [dispatch, records.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: ${pascalName}Record) => (r.id || r._id) === recordId);
      if (found) {
        setFormData({ ...found, id: found.id || found._id || recordId });
      }
    }
  }, [isEdit, recordId, records]);

  const handleChange = (field: keyof ${pascalName}Record, value: any) => {
    setFormData((prev: ${pascalName}Record) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = "${pascalName} name is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields.");
      return;
    }
    setValidationErrors({});
    setErrorMessage("");

    try {
      if (isEdit && (formData.id || recordId)) {
        await dispatch(update${pascalName}({ ...formData, id: formData.id || recordId })).unwrap();
      } else {
        const { id, _id, ...payload } = formData;
        await dispatch(add${pascalName}(payload)).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        router.push(\`/${appFolder}/${camelName}\`);
      }, 1200);
    } catch (err: any) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error: Please check fields.");
      } else {
        setErrorMessage(err?.message || "Failed to save record.");
      }
    }
  };

  return (
    <>
      <PageBreadcrumb
        title={isEdit ? "Update" : "Create"}
        subtitle="${pascalName}"
      />

      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
          <Icon icon="alert-circle" className="me-2" />
          {errorMessage}
        </Alert>
      )}

      {saved && (
        <Alert variant="success">
          <Icon icon="check-circle" className="me-2" />
          Saved successfully! Redirecting...
        </Alert>
      )}

      <Row className="justify-content-center">
        <Col lg={12}>
          <form onSubmit={handleSubmit}>
            <Card className="mb-4 border-0 shadow-sm">
              <CardHeader className="d-flex justify-content-between align-items-center bg-light-subtle py-3 px-4">
                <h5 className="mb-0 fw-bold">
                  {isEdit ? "Update ${pascalName}" : "Add ${pascalName}"}
                </h5>
                <Link href={\`/${appFolder}/${camelName}\`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Name <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="Enter name..."
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      isInvalid={!!validationErrors.name}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.name}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">Description</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={3}
                      placeholder="Describe details..."
                      value={formData.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold mb-2 d-block">Status</FormLabel>
                    <FormCheck
                      type="switch"
                      label={formData.isActive ? "Active" : "Inactive"}
                      checked={formData.isActive}
                      onChange={(e) => handleChange("isActive", e.target.checked)}
                      className="fs-15 fw-semibold mt-1"
                    />
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Link href={\`/${appFolder}/${camelName}\`} className="btn btn-light px-4">
                    Cancel
                  </Link>
                  <Button type="submit" variant="primary" className="px-4 fw-semibold">
                    <Icon icon={isEdit ? "save" : "plus"} className="me-1" />
                    {isEdit ? "Save Changes" : "Create"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </Col>
      </Row>
    </>
  );
};

export default ${pascalName}Form;
`;
  fs.writeFileSync(formPath, formTemplate);
  console.log(`✅ Created Standalone Form: ${formPath}`);

  // 6. Generate Add Page
  const addPageTemplate = `import React from "react";
import ${pascalName}Form from "../components/${pascalName}Form";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const Add${pascalName} = () => {
  return (
    <ProtectedRoute moduleName="${pascalName}">
      <${pascalName}Form mode="add" />
    </ProtectedRoute>
  );
};

export default Add${pascalName};
`;
  fs.writeFileSync(addPagePath, addPageTemplate);
  console.log(`✅ Created Add Route: ${addPagePath}`);

  // 7. Generate Edit Page
  const editPageTemplate = `import React from "react";
import ${pascalName}Form from "../../components/${pascalName}Form";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit ${pascalName}" };

const Edit${pascalName} = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="${pascalName}">
      <${pascalName}Form mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default Edit${pascalName};
`;
  fs.writeFileSync(editPagePath, editPageTemplate);
  console.log(`✅ Created Edit Route: ${editPagePath}`);

  // 8. Update Redux store.ts (Auto-inject reducer)
  const storePath = path.join(srcDir, 'redux', 'store.ts');
  if (fs.existsSync(storePath)) {
    let storeContent = fs.readFileSync(storePath, 'utf8');
    
    // Check if it already has this slice
    if (!storeContent.includes(`${camelName}:`) && !storeContent.includes(`${camelName}Reducer`)) {
      const importStatement = `import ${camelName}Reducer from "./slices/${targetArea}/${sliceName}";`;
      
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
        const reducerLine = `\n    ${camelName}: ${camelName}Reducer,`;
        storeContent = storeContent.slice(0, insertIndex) + reducerLine + storeContent.slice(insertIndex);
        fs.writeFileSync(storePath, storeContent);
        console.log(`✅ Updated Redux Store: ${storePath}`);
      } else {
        console.log(`⚠️ Could not find reducer object in store.ts. Please add ${camelName}: ${camelName}Reducer manually.`);
      }
    } else {
      console.log(`⚠️ ${camelName} reducer already registered in store.ts.`);
    }
  }

  console.log("\n🎉 Admin Module '" + moduleName + "' created successfully!");
  console.log("Features included:");
  console.log("  • Modal-based Add & Edit (${pascalName}Modal.tsx)");
  console.log("  • Full-page Fallback Routes (/add & /edit/[id])");
  console.log("  • TanStack DataTable with Search, Filter & CSV Export");
  console.log("  • Single & Bulk Delete with SweetAlert2 Confirmation");
  console.log("  • Normalized id/_id handling & Strict TypeScript types");
  console.log("  • ProtectedRoute & useAccess RBAC integration");
  
  rl.close();
}

main().catch(console.error);