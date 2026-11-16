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
  fetchPurchaseorder,
  deletePurchaseorder,
  PurchaseorderRecord,
} from "@/redux/slices/admin/purchaseorderSlice";
import { setAvailableFinYears } from "@/redux/slices/admin/financialYearSlice";
import useFinYearFilter from "@/hooks/useFinYearFilter";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import Swal from "sweetalert2";
import { useAccess } from "@/hooks/useAccess";
import PurchaseorderInvoice from "./PurchaseorderInvoice";
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

const PurchaseorderListContent = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector(
    (state: any) => state.purchaseorder || { records: [], loading: false, error: null }
  );
  // Universal WHERE condition hook based on fin_year
  const { selectedFinYear, matchesFinYearWhere } = useFinYearFilter<PurchaseorderRecord>();

  const access = useAccess("Purchaseorder");
  const fallbackAccess = useAccess("Purchaseorder");
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
    dispatch(fetchPurchaseorder({ fin_year: selectedFinYear }));
  }, [dispatch, selectedFinYear]);

  useEffect(() => {
    const yearsInRecords = records
      .map((r: PurchaseorderRecord) => r.fin_year)
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

  const isLinkedToPurchase = (record: PurchaseorderRecord) =>
    Boolean(record.isUsedInPurchase || record.has_purchase);

  const handleConfirmDeleteSingle = (record: PurchaseorderRecord) => {
    const recordId = record.id || record._id;
    const displayName = record.purchase_order_no || record.name || recordId;
    if (isLinkedToPurchase(record)) {
      Swal.fire({
        title: "Cannot Delete Proforma Invoice",
        text: `Proforma Invoice "${displayName}" is already linked to GST Invoice ${
          record.linked_purchase_no ? ` "${record.linked_purchase_no}"` : ""
        } and cannot be deleted.`,
        icon: "warning",
      });
      return;
    }

    Swal.fire({
      title: "Delete Proforma Invoice?",
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
        const res = await dispatch(deletePurchaseorder(recordId));
        if (deletePurchaseorder.fulfilled.match(res)) {
          setAlertMsg(`Proforma Invoice "${displayName}" has been deleted.`);
          Swal.fire({
            title: "Deleted!",
            text: "Proforma Invoice record has been deleted.",
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
        } else if (deletePurchaseorder.rejected.match(res)) {
          Swal.fire({
            title: "Cannot Delete",
            text: String(res.payload || "Failed to delete purchase order."),
            icon: "error",
          });
        }
      }
    });
  };

  const handleConfirmBulkDelete = () => {
    const selectedIds = Object.keys(selectedRowIds).filter((id) => selectedRowIds[id]);
    if (selectedIds.length === 0) return;

    const deletableIds = selectedIds.filter((id) => {
      const rec = records.find((r: PurchaseorderRecord) => (r.id || r._id) === id);
      return rec ? !isLinkedToPurchase(rec) : true;
    });

    if (deletableIds.length === 0) {
      Swal.fire({
        title: "Cannot Delete Proforma Invoice",
        text: "Selected Proforma Invoice(s) are already linked to GST Invoice(s) and cannot be deleted.",
        icon: "warning",
      });
      return;
    }

    const skippedCount = selectedIds.length - deletableIds.length;
    const promptText =
      skippedCount > 0
        ? `${deletableIds.length} proforma invoice record(s) will be deleted (${skippedCount} linked to Purchase will be skipped). This action cannot be undone.`
        : `Are you sure you want to delete ${deletableIds.length} proforma invoice record(s)? This action cannot be undone.`;

    Swal.fire({
      title: "Delete Selected Proforma Invoice?",
      text: promptText,
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
        const failedMessages: string[] = [];
        for (const id of deletableIds) {
          const res = await dispatch(deletePurchaseorder(id));
          if (deletePurchaseorder.fulfilled.match(res)) {
            deletedCount++;
          } else if (deletePurchaseorder.rejected.match(res)) {
            failedMessages.push(String(res.payload || "Delete blocked"));
          }
        }
        setSelectedRowIds({});
        if (deletedCount > 0) {
          setAlertMsg(`Successfully deleted ${deletedCount} record(s).`);
          Swal.fire({
            title: "Deleted!",
            text: `${deletedCount} proforma invoice record(s) have been deleted.${
              failedMessages.length > 0 ? ` (${failedMessages.length} blocked)` : ""
            }`,
            icon: failedMessages.length > 0 ? "warning" : "success",
            timer: failedMessages.length > 0 ? 2200 : 1200,
            showConfirmButton: failedMessages.length > 0,
          });
        } else if (failedMessages.length > 0) {
          Swal.fire({
            title: "Cannot Delete",
            text: failedMessages[0],
            icon: "error",
          });
        }
      }
    });
  };

  const getVendorName = (record: PurchaseorderRecord) => {
    if (typeof record.vendor_id === "object" && record.vendor_id) {
      return record.vendor_id.name || "";
    }
    return String(record.vendor_id || "");
  };

  const getCurrencySymbol = (record: PurchaseorderRecord) => {
    if (typeof record.currency_id === "object" && record.currency_id) {
      return record.currency_id.symbol || record.currency_id.code || "₹";
    }
    return "₹";
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r: PurchaseorderRecord) => {
      const term = searchTerm.toLowerCase();
      const vendorName = getVendorName(r).toLowerCase();
      const orderNo = (r.purchase_order_no || "").toLowerCase();
      const linkedPurchaseNo = (r.linked_purchase_no || "").toLowerCase();
      const invoiceNo = (r.invoice_no || r.reference_no || "").toLowerCase();
      const remarks = (r.remarks || "").toLowerCase();
      const finYear = (r.fin_year || "").toLowerCase();

      const matchesSearch =
        orderNo.includes(term) ||
        linkedPurchaseNo.includes(term) ||
        invoiceNo.includes(term) ||
        remarks.includes(term) ||
        finYear.includes(term) ||
        vendorName.includes(term);

      const isActiveStatus = r.isActive ? "Active" : "Inactive";
      const matchesStatus = statusFilter === "All" || isActiveStatus === statusFilter;
      const matchesFinYear = matchesFinYearWhere(r);
      return matchesSearch && matchesStatus && matchesFinYear;
    });
  }, [records, searchTerm, statusFilter, matchesFinYearWhere]);

  const columnHelper = createColumnHelper<PurchaseorderRecord>();

  const columns: ColumnDef<PurchaseorderRecord, any>[] = [
    columnHelper.display({
      id: "selection",
      header: ({ table }: { table: TableType<PurchaseorderRecord> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<PurchaseorderRecord> }) => {
        const canSelectRow = row.getCanSelect();
        return (
          <input
            type="checkbox"
            className="form-check-input form-check-input-light fs-14"
            checked={row.getIsSelected()}
            disabled={!canSelectRow}
            title={
              !canSelectRow
                ? `Linked to Purchase ${row.original.linked_purchase_no || ""}`.trim()
                : undefined
            }
            onChange={row.getToggleSelectedHandler()}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("purchase_order_no", {
      header: "Proforma Invoice No",
      cell: ({ row }) => {
        const isUsed = isLinkedToPurchase(row.original);
        return (
          <div>
            <div className="fw-bold text-dark fs-13 font-monospace">
              {row.original.purchase_order_no || "—"}
            </div>
            {isUsed && (
              <div className="text-info fs-11 font-monospace mt-1">
                Purchase: {row.original.linked_purchase_no || "Linked"}
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
        <div className="text-secondary fs-13">{formatDate(row.original.invoice_date || row.original.order_date)}</div>
      ),
    }),
    columnHelper.accessor("invoice_no", {
      header: "Vendor Bill #",
      cell: ({ row }) => (
        <div className="text-muted fs-13 font-monospace">{row.original.invoice_no || row.original.reference_no || "—"}</div>
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
      cell: ({ row }: { row: TableRow<PurchaseorderRecord> }) => {
        const recordId = row.original.id || row.original._id || "";
        const isUsed = isLinkedToPurchase(row.original);
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
            {!isUsed && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`convert-${recordId}`}>Convert to GST</Tooltip>}
              >
                <Button
                  size="sm"
                  className="btn-default btn-icon rounded-circle"
                  onClick={() => router.push(`/admin/purchase/add?poId=${recordId}`)}
                >
                  <Icon icon="receipt" className="fs-lg text-success" />
                </Button>
              </OverlayTrigger>
            )}
            {canWrite && !isUsed && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`edit-${recordId}`}>Edit</Tooltip>}
              >
                <Button
                  size="sm"
                  className="btn-default btn-icon rounded-circle"
                  onClick={() => router.push(`/admin/purchaseorder/edit/${recordId}`)}
                >
                  <Icon icon="square-pen" className="fs-lg text-secondary" />
                </Button>
              </OverlayTrigger>
            )}
            {canDelete && !isUsed && (
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
    enableRowSelection: (row) => !isLinkedToPurchase(row.original),
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
            <h5 className="mb-1 fw-bold">Purchase Proforma</h5>
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
                placeholder="Search PI #, FY, vendor, bill #..."
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
                        ? filteredRecords.filter((r: PurchaseorderRecord) =>
                            selectedIds.includes(r.id || r._id || "")
                          )
                        : filteredRecords;

                    const csvRows = [
                      ["Proforma No", "Financial Year", "Vendor", "Currency", "Tax Type", "Tax Rate (%)", "Invoice Date", "Invoice No", "Subtotal", "Discount Amount", "Tax Amount", "Final Amount", "Status", "Remarks"],
                      ...dataToExport.map((r: PurchaseorderRecord) => [
                        r.purchase_order_no || "",
                        r.fin_year || "",
                        getVendorName(r),
                        typeof r.currency_id === "object" && r.currency_id ? r.currency_id.code || r.currency_id.name || "" : "",
                        r.tax_type || "GST",
                        r.tax_percentage || 0,
                        formatDate(r.invoice_date || r.order_date),
                        r.invoice_no || r.reference_no || "",
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
                    link.download = `purchase_orders_export.csv`;
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
                  onClick={() => router.push("/admin/purchaseorder/add")}
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
            <DataTable<PurchaseorderRecord> table={table} emptyMessage="No proforma invoice records found." />
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
                  itemsName="purchase orders"
                />
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {printInvoiceId && (
        <PurchaseorderInvoice
          orderId={printInvoiceId}
          show={!!printInvoiceId}
          onHide={() => setPrintInvoiceId(null)}
        />
      )}
    </>
  );
};

export default PurchaseorderListContent;
