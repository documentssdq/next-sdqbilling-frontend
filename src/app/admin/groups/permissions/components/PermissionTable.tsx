"use client";
import DataTable from "@/components/table/DataTable";
import TablePagination from "@/components/table/TablePagination";
import Icon from "@/components/wrappers/Icon";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Row as TableRow,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  Alert,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Dropdown,
  FormCheck,
  FormControl,
  FormSelect,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { ManagementType } from "./data";
import PermissionModal from "./PermissionModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchPermissions,
  addPermission,
  updatePermission,
  deletePermission,
  statusPermission,
  clearPermissionError,
} from "@/redux/slices/admin/permissionSlice";
import { fetchGroups } from "@/redux/slices/admin/groupSlice";
import { checkAuth } from "@/redux/slices/authSlice";
import { usePageAccess, useAccess } from "@/hooks/useAccess";

const PermissionTable = () => {
  const access = usePageAccess("Permissions");
  const { read: canReadGroupAccess } = useAccess("Group Access");
  const dispatch = useAppDispatch();
  const {
    permissions: data,
    error,
  } = useAppSelector((state) => state.permissions);
  const { groups } = useAppSelector((state) => state.groups);

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {},
  );
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<ManagementType | null>(null);

  useEffect(() => {
    dispatch(fetchPermissions());
    if (groups.length === 0) {
      dispatch(fetchGroups());
    }
  }, [dispatch, groups.length]);

  useEffect(() => {
    if (error) {
      Swal.fire("Error", error, "error");
      dispatch(clearPermissionError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  const handleOpenAdd = () => {
    setSelectedPermission(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (perm: ManagementType) => {
    setSelectedPermission(perm);
    setModalOpen(true);
  };

  const handleSavePermission = async (record: ManagementType) => {
    try {
      if (selectedPermission) {
        await dispatch(updatePermission(record)).unwrap();
        setAlertMsg(`Permission "${record.name}" updated.`);
      } else {
        await dispatch(addPermission(record)).unwrap();
        setAlertMsg(`Permission "${record.name}" added successfully.`);
      }
      await dispatch(checkAuth());
    } catch (err: any) {
      console.error("Error saving permission:", err);
      Swal.fire("Error", err || "Failed to save permission", "error");
      throw err;
    }
  };

  const handleToggleStatus = async (perm: ManagementType) => {
    const permId = perm.id || (perm as any)._id;
    if (!permId) return;
    const nextIsActive = !(perm.isActive !== false);
    setTogglingId(permId);
    try {
      await dispatch(statusPermission({ id: permId, isActive: nextIsActive })).unwrap();
      setAlertMsg(
        `Permission "${perm.name}" marked as ${nextIsActive ? "Active" : "Inactive"}.`,
      );
      await dispatch(checkAuth());
    } catch (err: any) {
      Swal.fire("Error", err || "Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return (data || []).filter((item) => {
      const itemStatus = item.isActive !== false ? "Active" : "Inactive";
      return statusFilter === "All" || itemStatus === statusFilter;
    });
  }, [data, statusFilter]);

  const columnHelper = createColumnHelper<ManagementType>();

  const columns: ColumnDef<ManagementType, any>[] = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ row }) => (
        <span className="fw-semibold text-dark">{row.original.name}</span>
      ),
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: ({ row }) => (
        <span className="text-muted">
          {row.original.category || "Management"}
        </span>
      ),
    }),
    columnHelper.accessor("roles", {
      header: "Assign To",
      cell: ({ row }) => (
        <div className="d-flex gap-1 flex-wrap">
          {row.original.roles.map((role: any, idx) => {
            const grpName = groups.find(g => g.id === role.groupId)?.name || role.groupId;
            return (
              <span
                key={idx}
                className={clsx(
                  "badge badge-label fs-xxs fw-semibold",
                  role.className,
                )}
              >
                {grpName}
              </span>
            );
          })}
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("date", {
      header: "Last Modified",
      cell: ({ row }) => (
        <>
          {row.original.date},{" "}
          <span className="text-muted">{row.original.time}</span>
        </>
      ),
    }),
    columnHelper.accessor("users", {
      header: "Users",
      cell: ({ row }) => (
        <span className="badge bg-light text-dark border px-2 py-1">
          {row.original.users} Users
        </span>
      ),
    }),
    columnHelper.accessor((row) => (row.isActive !== false ? "Active" : "Inactive"), {
      id: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive !== false;
        const rowId = row.original.id || (row.original as any)._id;
        const permId = rowId || row.original.name;
        const variant = isActive ? "success" : "danger";
        const label = isActive ? "Active" : "Inactive";
        const icon = isActive ? "check-circle" : "alert-triangle";
        return (
          <div className="d-inline-flex align-items-center gap-2">
            <span
              className={`badge bg-${variant}-subtle text-${variant} badge-label d-inline-flex align-items-center gap-1`}
            >
              <Icon icon={icon} className="fs-xs" />
              <span>{label}</span>
            </span>
            {access.write && rowId && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id={`tooltip-status-${permId}`}>
                    {isActive ? "Set Inactive (Hide from Left Menu)" : "Set Active (Show in Left Menu)"}
                  </Tooltip>
                }
              >
                <span className="d-inline-flex align-items-center">
                  <FormCheck
                    type="switch"
                    id={`perm-status-switch-${permId}`}
                    checked={isActive}
                    disabled={togglingId === rowId}
                    onChange={() => handleToggleStatus(row.original)}
                    aria-label={`Toggle status for ${row.original.name}`}
                    className="mb-0"
                  />
                </span>
              </OverlayTrigger>
            )}
          </div>
        );
      },
    }),
    {
      header: "Actions",
      cell: ({ row }: { row: TableRow<ManagementType> }) => (
        <div className="d-flex gap-1">
          {access.write && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-edit-${row.id}`}>Edit</Tooltip>}
            >
              <Button
                variant="light"
                size="sm"
                className="btn-icon rounded-circle"
                onClick={() => handleOpenEdit(row.original)}
              >
                <Icon icon="edit" className="fs-14 text-primary" />
              </Button>
            </OverlayTrigger>
          )}
          {access.delete && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`tooltip-delete-${row.id}`}>
                  Delete Permission
                </Tooltip>
              }
            >
              <Button
                variant="light"
                size="sm"
                className="btn-icon rounded-circle"
                onClick={() => handleConfirmDeleteSingle(row.original)}
              >
                <Icon icon="trash-2" className="fs-14 text-danger" />
              </Button>
            </OverlayTrigger>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, pagination, rowSelection: selectedRowIds },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getRowId: (row) => row.id || row.name,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    enableRowSelection: true,
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalItems = table.getFilteredRowModel().rows.length;

  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);

  const handleConfirmDeleteSingle = (perm: ManagementType) => {
    Swal.fire({
      title: "Delete Permission?",
      text: `Are you sure you want to delete permission "${perm.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const actionResult = await dispatch(
          deletePermission(perm.id || perm.name),
        );
        if (deletePermission.fulfilled.match(actionResult)) {
          setAlertMsg(`Permission "${perm.name}" has been deleted.`);
          dispatch(checkAuth());
          Swal.fire({
            title: "Deleted!",
            text: `Permission "${perm.name}" has been deleted.`,
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      }
    });
  };

  const handleConfirmDeleteBulk = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds));
    const itemsToDelete = data.filter((item) =>
      selectedIds.has(item.id || item.name),
    );
    const count = itemsToDelete.length;
    if (count === 0) return;

    Swal.fire({
      title: "Delete Selected Permissions?",
      text: `Are you sure you want to delete ${count} selected permission(s)? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        for (const item of itemsToDelete) {
          await dispatch(deletePermission(item.id || item.name));
        }

        setSelectedRowIds({});
        setPagination({ ...pagination, pageIndex: 0 });
        setAlertMsg(`${count} permission(s) have been deleted.`);
        dispatch(checkAuth());
        Swal.fire({
          title: "Deleted!",
          text: `${count} permission(s) have been deleted.`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <>
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

      <Card>
        <div className="p-3 border-bottom">
          <h5 className="mb-1 fw-bold">Manage Permissions</h5>
        </div>
        <CardHeader className="border-light justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <div className="d-flex align-items-center gap-1">
              <span className="text-muted fs-12">Show</span>
              <FormSelect
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="form-select-sm"
                style={{ width: "75px" }}
              >
                {[10, 15 , 20, 50].map((size) => (
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

            {access.delete && Object.keys(selectedRowIds).length > 0 && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-delete-selected">
                    Delete Selected Permissions
                  </Tooltip>
                }
              >
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDeleteBulk}
                >
                  Delete Selected
                </Button>
              </OverlayTrigger>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="app-search" style={{ width: "220px" }}>
              <FormControl
                type="search"
                placeholder="Search permissions..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="form-control-sm"
              />
              <Icon icon="search" className="app-search-icon text-muted" />
            </div>

            {access.write && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-add-permission">
                    Add Permission
                  </Tooltip>
                }
              >
                <Button
                  variant="primary"
                  size="sm"
                  className="d-flex align-items-center gap-1 fw-semibold"
                  onClick={handleOpenAdd}
                >
                  <Icon icon="plus" /> Add Permission
                </Button>
              </OverlayTrigger>
            )}

            {canReadGroupAccess && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-matrix">View Access</Tooltip>
                }
              >
                <Link
                  href="/admin/group-access"
                  className="btn btn-dark btn-sm d-flex align-items-center gap-1 fw-semibold"
                >
                  <Icon icon="shield" /> Group Access
                </Link>
              </OverlayTrigger>
            )}
          </div>
        </CardHeader>
        <DataTable<ManagementType>
          table={table}
          emptyMessage="No records found"
        />
        {table.getRowModel().rows.length > 0 && (
          <CardFooter className="border-0">
            <TablePagination
              totalItems={totalItems}
              start={start}
              end={end}
              itemsName="permissions"
              showInfo
              previousPage={table.previousPage}
              canPreviousPage={table.getCanPreviousPage()}
              pageCount={table.getPageCount()}
              pageIndex={table.getState().pagination.pageIndex}
              setPageIndex={table.setPageIndex}
              nextPage={table.nextPage}
              canNextPage={table.getCanNextPage()}
            />
          </CardFooter>
        )}
      </Card>

      <PermissionModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        permission={selectedPermission}
        onSave={handleSavePermission}
      />
    </>
  );
};

export default PermissionTable;
