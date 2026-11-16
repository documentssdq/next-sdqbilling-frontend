"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
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
import type { RootState } from "@/redux/store";
import {
  fetchPurchaseorder,
  PurchaseorderRecord,
} from "@/redux/slices/admin/purchaseorderSlice";
import type { PartyRecord } from "@/redux/slices/admin/partySlice";
import { setAvailableFinYears } from "@/redux/slices/admin/financialYearSlice";
import useFinYearFilter from "@/hooks/useFinYearFilter";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import PurchaseorderInvoice from "../../purchaseorder/components/PurchaseorderInvoice";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Row as TableRow,
  useReactTable,
} from "@tanstack/react-table";

interface PurchaseOrderSelectListProps {
  loadingPoId: string | null;
  selectedPoId?: string | null;
  onSelectOrder: (po: PurchaseorderRecord) => void;
  onSkipPo: () => void;
}

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

const PurchaseOrderSelectList: React.FC<PurchaseOrderSelectListProps> = ({
  loadingPoId,
  selectedPoId,
  onSelectOrder,
  onSkipPo,
}) => {
  const dispatch = useAppDispatch();
  const { records, error } = useAppSelector(
    (state: RootState) => state.purchaseorder || { records: [], loading: false, error: null }
  );
  const { records: partyList } = useAppSelector(
    (state: RootState) => state.party || { records: [] }
  );

  // Universal WHERE condition hook based on fin_year
  const { selectedFinYear, matchesFinYearWhere } = useFinYearFilter<PurchaseorderRecord>();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);
  const [fetchingList, setFetchingList] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setFetchingList(true);
      dispatch(fetchPurchaseorder({ fin_year: selectedFinYear }))
        .finally(() => {
          if (active) setFetchingList(false);
        });
    });
    return () => {
      active = false;
    };
  }, [dispatch, selectedFinYear]);

  useEffect(() => {
    const yearsInRecords = (records || [])
      .map((r: PurchaseorderRecord) => r.fin_year)
      .filter((y): y is string => typeof y === "string" && y.trim().length > 0);
    if (yearsInRecords.length > 0) {
      dispatch(setAvailableFinYears(yearsInRecords));
    }
  }, [records, dispatch]);

  const getVendorName = useCallback(
    (record: PurchaseorderRecord) => {
      if (typeof record.vendor_id === "object" && record.vendor_id) {
        return record.vendor_id.name || "";
      }
      const vId = String(record.vendor_id || "");
      if (!vId) return "";
      const match = (partyList || []).find(
        (p: PartyRecord) => String(p.id || p._id) === vId
      );
      return match?.name || vId;
    },
    [partyList]
  );

  const getCurrencySymbol = (record: PurchaseorderRecord) => {
    if (typeof record.currency_id === "object" && record.currency_id) {
      return record.currency_id.symbol || record.currency_id.code || "₹";
    }
    return "₹";
  };

  const filteredRecords = useMemo(() => {
    return (records || []).filter((r: PurchaseorderRecord) => {
      const term = searchTerm.toLowerCase();
      const vendorName = getVendorName(r).toLowerCase();
      const orderNo = (r.purchase_order_no || r.purchase_no || "").toLowerCase();
      const invoiceNo = (r.invoice_no || r.reference_no || "").toLowerCase();
      const remarks = (r.remarks || "").toLowerCase();
      const finYear = (r.fin_year || "").toLowerCase();

      const matchesSearch =
        orderNo.includes(term) ||
        invoiceNo.includes(term) ||
        remarks.includes(term) ||
        finYear.includes(term) ||
        vendorName.includes(term);

      const isActiveStatus = r.isActive !== false ? "Active" : "Inactive";
      const matchesStatus = statusFilter === "All" || isActiveStatus === statusFilter;
      const matchesFinYear = matchesFinYearWhere(r);
      return matchesSearch && matchesStatus && matchesFinYear;
    });
  }, [records, searchTerm, statusFilter, matchesFinYearWhere, getVendorName]);

  const columnHelper = createColumnHelper<PurchaseorderRecord>();

  const columns = [
    columnHelper.accessor("purchase_order_no", {
      header: "Purchase Proforma No",
      cell: ({ row }) => {
        const recordId = row.original.id || row.original._id || "";
        const isCurrentlySelected = !!selectedPoId && selectedPoId === recordId;
        return (
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold text-dark fs-13 font-monospace">
              {row.original.purchase_order_no || row.original.purchase_no || "—"}
            </div>
            {isCurrentlySelected && (
              <span className="badge bg-success-subtle text-success fs-10">Selected</span>
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
        <div className="text-secondary fs-13">
          {formatDate(row.original.invoice_date || row.original.order_date)}
        </div>
      ),
    }),
    columnHelper.accessor("invoice_no", {
      header: "Vendor Bill #",
      cell: ({ row }) => (
        <div className="text-muted fs-13 font-monospace">
          {row.original.invoice_no || row.original.reference_no || "—"}
        </div>
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
              {sym}
              {Number(row.original.final_amount || 0).toLocaleString("en-IN", {
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
        const isActive = row.original.isActive !== false;
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
        const isLoadingThis = loadingPoId === recordId;
        return (
          <div className="d-flex align-items-center gap-1">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`po-preview-${recordId}`}>Print Invoice</Tooltip>}
            >
              <Button
                size="sm"
                type="button"
                className="btn-default btn-icon rounded-circle"
                onClick={() => setPrintInvoiceId(recordId)}
              >
                <Icon icon="printer" className="fs-lg text-primary" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`po-add-${recordId}`}>Add to Purchase Form</Tooltip>}
            >
              <Button
                size="sm"
                type="button"
                variant="primary"
                disabled={!!loadingPoId}
                onClick={() => onSelectOrder(row.original)}
                className="d-inline-flex align-items-center gap-1 fw-semibold px-2 py-1"
              >
                {isLoadingThis ? (
                  <>
                    <Spinner size="sm" animation="border" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="plus" className="fs-sm" />
                    <span>Add</span>
                  </>
                )}
              </Button>
            </OverlayTrigger>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
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
      <Card className="shadow-sm border-0">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h5 className="mb-1 fw-bold d-flex align-items-center gap-2">
              <Icon icon="shopping-cart" className="text-primary fs-18" />
              <span>Select Purchase Proforma</span>
              <span className="badge bg-primary-subtle text-primary fs-11">
                {filteredRecords.length}
              </span>
            </h5>
            <p className="mb-0 text-muted fs-12">
              Click <strong>Add</strong> in the Actions column to prepopulate the Purchase Form in Add mode, or create a purchase directly without a PO.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={onSkipPo}
              className="d-flex align-items-center gap-1 fw-semibold"
            >
              <Icon icon="file-plus" className="fs-sm" /> Add Without PO
            </Button>
            <Link
              href="/admin/purchase"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            >
              <Icon icon="arrow-left" className="fs-sm" /> Back to List
            </Link>
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
                  onClick={() => {
                    setStatusFilter("All");
                    table.setPageIndex(0);
                  }}
                >
                  All Statuses
                </Dropdown.Item>
                <Dropdown.Item
                  active={statusFilter === "Active"}
                  onClick={() => {
                    setStatusFilter("Active");
                    table.setPageIndex(0);
                  }}
                >
                  Active
                </Dropdown.Item>
                <Dropdown.Item
                  active={statusFilter === "Inactive"}
                  onClick={() => {
                    setStatusFilter("Inactive");
                    table.setPageIndex(0);
                  }}
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
                placeholder="Search purchase order #, FY, vendor, bill #..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  table.setPageIndex(0);
                }}
              />
              <Icon icon="search" className="app-search-icon text-muted" />
            </div>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="tooltip-po-reset">Reset Filters</Tooltip>}
            >
              <Button
                variant="light"
                size="sm"
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                  table.setPageSize(10);
                  table.setPageIndex(0);
                  setFetchingList(true);
                  dispatch(fetchPurchaseorder({ fin_year: selectedFinYear })).finally(() => {
                    setFetchingList(false);
                  });
                }}
              >
                <Icon icon="rotate-ccw" className="fs-sm" />
              </Button>
            </OverlayTrigger>
          </div>
        </CardHeader>

        {fetchingList ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <DataTable<PurchaseorderRecord>
              table={table}
              emptyMessage={
                <div className="py-3">
                  <div className="mb-2">No purchase order records found.</div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    type="button"
                    onClick={onSkipPo}
                  >
                    Create Purchase Without PO
                  </Button>
                </div>
              }
            />
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

export default PurchaseOrderSelectList;
