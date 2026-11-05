"use client";

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
  fetchCountries,
  addCountries,
  updateCountries,
  deleteCountries,
  CountriesRecord,
} from "@/redux/slices/admin/countriesSlice";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import Swal from "sweetalert2";
import { useAccess } from "@/hooks/useAccess";
import CountriesModal from "./CountriesModal";
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

const CountriesListContent = () => {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector(
    (state: any) => state.countries || { records: [], loading: false, error: null }
  );

  const access = useAccess("Countriess");
  const fallbackAccess = useAccess("Countries");
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
  const [selectedCountries, setSelectedCountries] = useState<CountriesRecord | null>(null);

  const handleOpenAddModal = () => {
    setSelectedCountries(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (record: CountriesRecord) => {
    setSelectedCountries(record);
    setModalOpen(true);
  };

  const handleSaveCountries = async (record: CountriesRecord) => {
    if (selectedCountries && (selectedCountries.id || selectedCountries._id)) {
      const targetId = selectedCountries.id || selectedCountries._id;
      await dispatch(updateCountries({ ...record, id: targetId })).unwrap();
      setAlertMsg(`Countries "${record.name}" updated successfully.`);
    } else {
      const { id, _id, ...payload } = record;
      await dispatch(addCountries(payload)).unwrap();
      setAlertMsg(`Countries "${record.name}" created successfully.`);
    }
  };

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  const handleConfirmDeleteSingle = (record: CountriesRecord) => {
    const recordId = record.id || record._id;
    Swal.fire({
      title: "Delete Record?",
      text: `Are you sure you want to delete "${record.name || recordId}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed && recordId) {
        const res = await dispatch(deleteCountries(recordId));
        if (deleteCountries.fulfilled.match(res)) {
          setAlertMsg(`Record "${record.name || recordId}" has been deleted.`);
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
      text: `Are you sure you want to delete ${selectedIds.length} record(s)? This action cannot be undone.`,
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
          const res = await dispatch(deleteCountries(id));
          if (deleteCountries.fulfilled.match(res)) {
            deletedCount++;
          }
        }
        setAlertMsg(`Successfully deleted ${deletedCount} record(s).`);
        setSelectedRowIds({});
        Swal.fire({
          title: "Deleted!",
          text: `${deletedCount} record(s) have been deleted.`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r: CountriesRecord) => {
      const matchesSearch =
        (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const isActiveStatus = r.isActive ? "Active" : "Inactive";
      const matchesStatus = statusFilter === "All" || isActiveStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const columnHelper = createColumnHelper<CountriesRecord>();

  const columns: ColumnDef<CountriesRecord, any>[] = [
    columnHelper.display({
      id: "selection",
      header: ({ table }: { table: TableType<CountriesRecord> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<CountriesRecord> }) => (
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
      header: "Country Name",
      cell: ({ row }) => (
        <div className="fw-semibold text-dark fs-14">{row.original.name || "N/A"}</div>
      ),
    }),
    // columnHelper.accessor("description", {
    //   header: "Description",
    //   cell: ({ row }) => (
    //     <div className="text-muted fs-13 text-truncate" style={{ maxWidth: "250px" }}>
    //       {row.original.description || "—"}
    //     </div>
    //   ),
    // }),
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
      cell: ({ row }: { row: TableRow<CountriesRecord> }) => {
        const recordId = row.original.id || row.original._id || "";
        return (
          <div className="d-flex align-items-center gap-1">
            {canWrite && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`edit-${recordId}`}>Edit</Tooltip>}
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
        <div className="p-3 border-bottom">
          <h5 className="mb-1 fw-bold">Manage Countries</h5>
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
                        ? filteredRecords.filter((r: CountriesRecord) =>
                            selectedIds.includes(r.id || r._id || "")
                          )
                        : filteredRecords;

                    const csvRows = [
                      ["Name", "Description", "Status", "Created At"],
                      ...dataToExport.map((r: CountriesRecord) => [
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
                          .map((c: any) => `"${String(c).replace(/"/g, '""')}"`)
                          .join(",")
                      )
                      .join("\n");
                    const blob = new Blob([csvString], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `countries_export.csv`;
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
            <DataTable<CountriesRecord> table={table} emptyMessage="No records found." />
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

      <CountriesModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        countries={selectedCountries}
        onSave={handleSaveCountries}
      />
    </>
  );
};

export default CountriesListContent;
