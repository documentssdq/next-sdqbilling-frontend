"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardFooter, Spinner, OverlayTrigger, Tooltip, Button, Dropdown, Alert, FormSelect } from "react-bootstrap";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchPages, deletePage, PageRecord } from "@/redux/slices/admin/pageSlice";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import Swal from "sweetalert2";
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

const PageListContent = () => {
  const dispatch = useAppDispatch();
  const { records, pagination: reduxPagination, loading, error } = useAppSelector((state) => state.page || { records: [], loading: false, error: null });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPages());

    const flashMsg = sessionStorage.getItem("pageAlertMsg");
    if (flashMsg) {
      setAlertMsg(flashMsg);
      sessionStorage.removeItem("pageAlertMsg");
    }
  }, [dispatch]);

  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  const handleConfirmDeleteSingle = (page: PageRecord) => {
    Swal.fire({
      title: "Delete Page?",
      text: `Are you sure you want to delete "${page.pageName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (page.id) {
          const res = await dispatch(deletePage(page.id));
          if (deletePage.fulfilled.match(res)) {
            setAlertMsg(`Page "${page.pageName}" has been deleted.`);
            Swal.fire({
              title: "Deleted!",
              text: `Page "${page.pageName}" has been deleted.`,
              icon: "success",
              timer: 1200,
              showConfirmButton: false,
            });
          }
        }
      }
    });
  };

  const handleConfirmBulkDelete = () => {
    const selectedIds = Object.keys(selectedRowIds);
    if (selectedIds.length === 0) return;

    Swal.fire({
      title: "Delete Selected Pages?",
      text: `Are you sure you want to delete ${selectedIds.length} page${selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.`,
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
          const res = await dispatch(deletePage(id));
          if (deletePage.fulfilled.match(res)) {
            deletedCount++;
          }
        }
        setAlertMsg(`Successfully deleted ${deletedCount} page${deletedCount > 1 ? "s" : ""}.`);
        setSelectedRowIds({});
        Swal.fire({
          title: "Deleted!",
          text: `${deletedCount} page${deletedCount > 1 ? "s have" : " has"} been deleted.`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        (r.pageName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.slug || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.content || "").toLowerCase().includes(searchTerm.toLowerCase());

      const isActiveStatus = r.isActive ? "Active" : "Inactive";
      const matchesStatus = statusFilter === "All" || isActiveStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const columnHelper = createColumnHelper<PageRecord>();

  const columns: ColumnDef<PageRecord, any>[] = [
    columnHelper.display({
      id: "selection",
      header: ({ table }: { table: TableType<PageRecord> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<PageRecord> }) => (
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
    // columnHelper.accessor("id", {
    //   header: "ID",
    //   cell: ({ row }) => (
    //     <span className="fw-semibold text-muted fs-13">{row.original.id?.substring(0, 8)}...</span>
    //   ),
    // }),
    columnHelper.accessor("pageName", {
      header: "Page Name & Slug",
      cell: ({ row }) => (
        <div>
          <div className="fw-semibold text-dark fs-14">{row.original.pageName || 'N/A'}</div>
          <div className="text-muted fs-12">{row.original.slug || 'N/A'}</div>
        </div>
      ),
    }),
    columnHelper.accessor("content", {
      header: "Content",
      cell: ({ row }) => {
        const contentStr = row.original.content || "";
        // Strip HTML tags for preview and truncate to 50 chars
        const strippedContent = contentStr.replace(/(<([^>]+)>)/gi, "");
        const preview = strippedContent.length > 50 ? strippedContent.substring(0, 50) + '...' : strippedContent;
        return <span className="fs-13 text-muted">{preview || 'N/A'}</span>;
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
            <span className={`badge bg-${variant}-subtle text-${variant} badge-label d-inline-flex align-items-center gap-1`}>
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
      cell: ({ row }: { row: TableRow<PageRecord> }) => (
        <div className="d-flex align-items-center gap-1">
          <OverlayTrigger placement="top" overlay={<Tooltip id={`edit-${row.original.id}`}>Edit</Tooltip>}>
            <Link href={`/admin/page/edit/${row.original.id}`} className="btn btn-sm btn-default btn-icon rounded-circle">
              <Icon icon="square-pen" className="fs-lg text-secondary" />
            </Link>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip id={`del-${row.original.id}`}>Delete</Tooltip>}>
            <Button
              size="sm"
              className="btn-default btn-icon rounded-circle"
              onClick={() => handleConfirmDeleteSingle(row.original)}
            >
              <Icon icon="trash-2" className="fs-lg text-danger" />
            </Button>
          </OverlayTrigger>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection: selectedRowIds,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getRowId: (row) => row.id || '',
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
        <Alert variant="success" onClose={() => setAlertMsg(null)} dismissible className="d-flex align-items-center gap-2 mb-3">
          <Icon icon="check-circle" className="fs-18 flex-shrink-0" />
          <span>{alertMsg}</span>
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <div className="p-3 border-bottom">
          <h5 className="mb-1 fw-bold">Manage Pages</h5>
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
                  <option key={size} value={size}>{size}</option>
                ))}
              </FormSelect>
            </div>

            <span className="ms-2 me-1 fw-semibold text-muted fs-xs d-flex align-items-center gap-1">
              <Icon icon="filter" className="fs-xs text-primary" /> Filter By:
            </span>

            <Dropdown className="d-inline-block">
              <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1 my-1 my-md-0">
                <span className="fw-semibold">
                  {statusFilter === "All" ? "All Statuses" : statusFilter}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item active={statusFilter === "All"} onClick={() => setStatusFilter("All")}>
                  All Statuses
                </Dropdown.Item>
                <Dropdown.Item active={statusFilter === "Active"} onClick={() => setStatusFilter("Active")}>
                  Active
                </Dropdown.Item>
                <Dropdown.Item active={statusFilter === "Inactive"} onClick={() => setStatusFilter("Inactive")}>
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
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Icon icon="search" className="app-search-icon text-muted" />
            </div>

            {Object.keys(selectedRowIds).length > 0 && (
              <Button variant="danger" size="sm" onClick={handleConfirmBulkDelete}>
                Delete ({Object.keys(selectedRowIds).length})
              </Button>
            )}

            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-reset">Reset Filters</Tooltip>}>
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                  table.setPageSize(8);
                }}
                title="Reset"
              >
                <Icon icon="rotate-ccw" className="fs-sm" />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-add-new">Add New Page</Tooltip>}>
              <Link href="/admin/page/add" className="btn btn-primary btn-sm d-flex align-items-center gap-1 fw-semibold">
                <Icon icon="plus" className="fs-sm" /> Add New
              </Link>
            </OverlayTrigger>
          </div>
        </CardHeader>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <DataTable<PageRecord> table={table} emptyMessage="No pages found matching your criteria." />
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
                  itemsName="pages"
                />
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </>
  );
};

export default PageListContent;
