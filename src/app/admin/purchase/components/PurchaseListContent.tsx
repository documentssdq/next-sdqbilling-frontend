"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  fetchPurchase,
  deletePurchase,
  PurchaseRecord,
} from "@/redux/slices/admin/purchaseSlice";
import { setAvailableFinYears } from "@/redux/slices/admin/financialYearSlice";
import useFinYearFilter from "@/hooks/useFinYearFilter";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import Swal from "sweetalert2";
import { useAccess } from "@/hooks/useAccess";
import PurchaseInvoice from "./PurchaseInvoice";
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

const formatDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};

const PurchaseListContent = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector(
    (state: any) => state.purchase || { records: [], loading: false, error: null }
  );
  // Universal WHERE condition hook based on fin_year
  const { selectedFinYear, matchesFinYearWhere } = useFinYearFilter<PurchaseRecord>();

  const access = useAccess("Purchase");
  const fallbackAccess = useAccess("Purchase");
  const canWrite = access.write || fallbackAccess.write;
  const canDelete = access.delete || fallbackAccess.delete;
  const canExport = access.export || fallbackAccess.export;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);

  // Automatically applies WHERE fin_year condition
  useEffect(() => {
    dispatch(fetchPurchase({ fin_year: selectedFinYear }));
  }, [dispatch, selectedFinYear]);

  useEffect(() => {
    const yearsInRecords = records
      .map((r: PurchaseRecord) => r.fin_year)
      .filter((y: any): y is string => typeof y === "string" && y.trim().length > 0);
    if (yearsInRecords.length > 0) {
      dispatch(setAvailableFinYears(yearsInRecords));
    }
  }, [records, dispatch]);

  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  const handleConfirmDeleteSingle = (record: PurchaseRecord) => {
    const recordId = record.id || record._id;
    const displayName = record.purchase_no || record.name || recordId;
    Swal.fire({
      title: "Delete Purchase?",
      text: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed && recordId) {
        const res = await dispatch(deletePurchase(recordId));
        if (deletePurchase.fulfilled.match(res)) {
          setAlertMsg(`Purchase "${displayName}" has been deleted.`);
          Swal.fire({
            title: "Deleted!",
            text: "Purchase record has been deleted.",
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
      title: "Delete Selected Purchases?",
      text: `Are you sure you want to delete ${selectedIds.length} purchase record(s)? This action cannot be undone.`,
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
          const res = await dispatch(deletePurchase(id));
          if (deletePurchase.fulfilled.match(res)) {
            deletedCount++;
          }
        }
        setAlertMsg(`Successfully deleted ${deletedCount} record(s).`);
        setSelectedRowIds({});
        Swal.fire({
          title: "Deleted!",
          text: `${deletedCount} purchase record(s) have been deleted.`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };

  const getVendorName = (record: PurchaseRecord) => {
    if (typeof record.vendor_id === "object" && record.vendor_id) {
      return record.vendor_id.name || "";
    }
    return String(record.vendor_id || "");
  };

  const getCurrencySymbol = (record: PurchaseRecord) => {
    if (typeof record.currency_id === "object" && record.currency_id) {
      return record.currency_id.symbol || record.currency_id.code || "₹";
    }
    return "₹";
  };

  const getPurchaseOrderNo = (record: PurchaseRecord) => {
    if (typeof record.purchaseorder_id === "object" && record.purchaseorder_id) {
      return record.purchaseorder_id.purchase_order_no || record.purchaseorder_id.purchase_no || "";
    }
    return "";
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r: PurchaseRecord) => {
      const term = searchTerm.toLowerCase();
      const vendorName = getVendorName(r).toLowerCase();
      const poNo = getPurchaseOrderNo(r).toLowerCase();
      const matchesSearch =
        (r.purchase_no || "").toLowerCase().includes(term) ||
        poNo.includes(term) ||
        (r.invoice_no || "").toLowerCase().includes(term) ||
        (r.remarks || "").toLowerCase().includes(term) ||
        (r.fin_year || "").toLowerCase().includes(term) ||
        vendorName.includes(term);

      const isActiveStatus = r.isActive ? "Active" : "Inactive";
      const matchesStatus = statusFilter === "All" || isActiveStatus === statusFilter;
      const matchesFinYear = matchesFinYearWhere(r);
      return matchesSearch && matchesStatus && matchesFinYear;
    });
  }, [records, searchTerm, statusFilter, matchesFinYearWhere]);

  const columnHelper = createColumnHelper<PurchaseRecord>();

  const columns: ColumnDef<PurchaseRecord, any>[] = [
    columnHelper.display({
      id: "selection",
      header: ({ table }: { table: TableType<PurchaseRecord> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<PurchaseRecord> }) => (
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
    columnHelper.accessor("purchase_no", {
      header: "Purchase No",
      cell: ({ row }) => {
        const poNo = getPurchaseOrderNo(row.original);
        return (
          <div>
            <div className="fw-bold text-dark fs-13 font-monospace">
              {row.original.purchase_no || "—"}
            </div>
            {poNo && (
              <div className="text-muted fs-11 font-monospace mt-1">
                PO: {poNo}
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("vendor_id", {
      header: "Vendor",
      cell: ({ row }) => {
        const vendor = row.original.vendor_id;
        const name = typeof vendor === "object" && vendor ? vendor.name : getVendorName(row.original) || "—";
        const phone = typeof vendor === "object" && vendor?.phone ? vendor.phone : null;
        const gstin = typeof vendor === "object" && vendor?.gstin ? vendor.gstin : null;
        const taxType = row.original.tax_type || (typeof vendor === "object" ? vendor?.taxType : null) || "GST";
        return (
          <div>
            <div className="fw-semibold text-dark fs-14">{name}</div>
            <div className="d-flex align-items-center gap-1 text-muted fs-11 mt-1 flex-wrap">
              {phone && <span>{phone}</span>}
              {gstin && (
                <span className="badge bg-light text-secondary border fs-10">
                  {taxType}: {gstin}
                </span>
              )}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("invoice_date", {
      header: "Invoice Date",
      cell: ({ row }) => (
        <div className="text-secondary fs-13">{formatDate(row.original.invoice_date)}</div>
      ),
    }),
    columnHelper.accessor("invoice_no", {
      header: "Vendor Bill #",
      cell: ({ row }) => (
        <div className="text-muted fs-13 font-monospace">{row.original.invoice_no || "—"}</div>
      ),
    }),
    columnHelper.accessor("final_amount", {
      header: "Final Amount",
      cell: ({ row }) => {
        const sym = getCurrencySymbol(row.original);
        const taxPct = Number(row.original.tax_percentage) || 0;
        return (
          <div className="text-end">
            <div className="fw-bold text-primary fs-14 font-monospace">
              {sym}{Number(row.original.final_amount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {taxPct > 0 && (
              <span className="badge bg-light text-muted border fs-10 mt-1">
                {row.original.tax_type || "Tax"} {taxPct}%
              </span>
            )}
          </div>
        );
      },
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
              className={`badge bg-${variant}-subtle text-${variant} badge-label d-inline-flex align-items-center gap-1`}
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
      cell: ({ row }: { row: TableRow<PurchaseRecord> }) => {
        const recordId = row.original.id || row.original._id || "";
        return (
          <div className="d-flex align-items-center gap-1">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`print-${recordId}`}>Print Invoice</Tooltip>}
            >
              <Button
                size="sm"
                className="btn-default btn-icon rounded-circle"
                onClick={() => setPrintInvoiceId(recordId)}
              >
                <Icon icon="printer" className="fs-lg text-primary" />
              </Button>
            </OverlayTrigger>
            {canWrite && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`edit-${recordId}`}>Edit</Tooltip>}
              >
                <Button
                  size="sm"
                  className="btn-default btn-icon rounded-circle"
                  onClick={() => router.push(`/admin/purchase/edit/${recordId}`)}
                >
                  <Icon icon="square-pen" className="fs-lg text-secondary" />
                </Button>
              </OverlayTrigger>
            )}
            {canDelete && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`del-${recordId}`}>Delete</Tooltip>}
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
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1 fw-bold">Manage Purchase</h5>
          </div>
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

            {/* Status Filter */}
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
                placeholder="Search purchase #, FY, vendor, bill #..."
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
                        ? filteredRecords.filter((r: PurchaseRecord) =>
                            selectedIds.includes(r.id || r._id || "")
                          )
                        : filteredRecords;

                    const csvRows = [
                      ["Purchase No", "Purchase Proforma No", "Financial Year", "Vendor", "Currency", "Tax Type", "Tax Rate (%)", "Invoice Date", "Invoice No", "Subtotal", "Discount Amount", "Tax Amount", "Final Amount", "Status", "Remarks"],
                      ...dataToExport.map((r: PurchaseRecord) => [
                        r.purchase_no || "",
                        getPurchaseOrderNo(r),
                        r.fin_year || "",
                        getVendorName(r),
                        typeof r.currency_id === "object" && r.currency_id ? r.currency_id.code || r.currency_id.name || "" : "",
                        r.tax_type || "GST",
                        r.tax_percentage || 0,
                        formatDate(r.invoice_date),
                        r.invoice_no || "",
                        r.total_amount || 0,
                        r.discount_amount || 0,
                        r.tax_amount || 0,
                        r.final_amount || 0,
                        r.isActive ? "Active" : "Inactive",
                        r.remarks || "",
                      ]),
                    ];
                    const csvString = csvRows
                      .map((row) =>
                        row
                          .map((c: any) => `"${String(c).replace(/"/g, '""')}"`)
                          .join(",")
                      )
                      .join("\n");
                    const blob = new Blob([csvString], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `purchases_export.csv`;
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
                  onClick={() => router.push("/admin/purchase/add")}
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
            <DataTable<PurchaseRecord> table={table} emptyMessage="No purchase records found." />
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
                  itemsName="purchases"
                />
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {printInvoiceId && (
        <PurchaseInvoice
          purchaseId={printInvoiceId}
          show={!!printInvoiceId}
          onHide={() => setPrintInvoiceId(null)}
        />
      )}
    </>
  );
};

export default PurchaseListContent;
