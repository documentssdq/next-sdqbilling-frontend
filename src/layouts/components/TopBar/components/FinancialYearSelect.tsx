"use client";

import React, { useEffect, useMemo, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { components, ControlProps, OptionProps, SingleValueProps, StylesConfig } from "react-select";
import Icon from "@/components/wrappers/Icon";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchFinancialYears,
  setSelectedFinYear,
  addFinancialYear,
  getFinancialYear,
  formatFinancialYearInput,
} from "@/redux/slices/admin/financialYearSlice";

export interface FYOption {
  value: string;
  label: string;
  isCurrent?: boolean;
}

const CustomControl = ({ children, ...props }: ControlProps<FYOption, false>) => (
  <components.Control {...props}>
    <span className="d-flex align-items-center ps-2 pe-1 text-primary">
      <Icon icon="calendar" className="fs-14" />
    </span>
    {children}
  </components.Control>
);

const CustomSingleValue = (props: SingleValueProps<FYOption, false>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <span className="fw-semibold text-truncate">
        {data.label || data.value}
      </span>
    </components.SingleValue>
  );
};

const CustomOption = (props: OptionProps<FYOption, false>) => {
  const { data, isSelected } = props;
  return (
    <components.Option {...props}>
      <div className="d-flex align-items-center justify-content-between w-100">
        <span className={isSelected ? "fw-bold" : "fw-medium"}>
          {data.label}
        </span>
        {data.isCurrent && (
          <span
            className={`badge ${
              isSelected ? "bg-light text-dark" : "bg-success-subtle text-success"
            } fs-10 py-0 px-1 ms-2`}
          >
            Current
          </span>
        )}
      </div>
    </components.Option>
  );
};

const FinancialYearSelect: React.FC = () => {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const currentFY = useMemo(() => getFinancialYear(), []);

  const { selectedFinYear, availableFinYears, loading } = useAppSelector(
    (state: any) =>
      state.financialYear || {
        selectedFinYear: currentFY,
        availableFinYears: [],
        loading: false,
      }
  );

  useEffect(() => {
    setMounted(true);
    // Check localStorage; if not found or older than start year 2026, select current financial year (2026-2027)
    try {
      const saved = localStorage.getItem("global_fin_year");
      if (saved && saved.trim()) {
        const val = saved.trim();
        const startY = parseInt(val.split("-")[0], 10);
        if (val === "All" || (!isNaN(startY) && startY >= 2026)) {
          if (val !== selectedFinYear) {
            dispatch(setSelectedFinYear(val));
          }
        } else {
          dispatch(setSelectedFinYear(currentFY));
        }
      } else {
        // By default, current fin_year selected!
        dispatch(setSelectedFinYear(currentFY));
      }
    } catch (e) {
      dispatch(setSelectedFinYear(currentFY));
    }
    // Fetch distinct financial years from backend
    dispatch(fetchFinancialYears());
  }, [dispatch, currentFY]);

  const options: FYOption[] = useMemo(() => {
    const list: FYOption[] = [
      { value: "All", label: "All", isCurrent: false },
    ];
    availableFinYears.forEach((fy: string) => {
      const isCurrent = fy === currentFY;
      // Plain format e.g. "2026-2027" as requested
      list.push({
        value: fy,
        label: fy,
        isCurrent,
      });
    });
    return list;
  }, [availableFinYears, currentFY]);

  const selectedOption: FYOption = useMemo(() => {
    const matched = options.find((opt) => opt.value === selectedFinYear);
    if (matched) return matched;
    return {
      value: selectedFinYear,
      label: selectedFinYear,
      isCurrent: selectedFinYear === currentFY,
    };
  }, [options, selectedFinYear, currentFY]);

  const handleChange = (opt: FYOption | null) => {
    if (opt) {
      dispatch(setSelectedFinYear(opt.value));
    }
  };

  const handleCreateOption = (inputValue: string) => {
    const formatted = formatFinancialYearInput(inputValue);
    dispatch(addFinancialYear(formatted));
  };

  const customStyles: StylesConfig<FYOption, false> = {
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),
    control: (base, state) => ({
      ...base,
      minHeight: "34px",
      height: "34px",
      fontSize: "0.8125rem",
      backgroundColor: "var(--bs-tertiary-bg, var(--bs-body-bg, #ffffff))",
      borderColor: state.isFocused
        ? "var(--bs-primary, #3e60d5)"
        : "var(--bs-border-color, #dee2e6)",
      borderRadius: "0.375rem",
      boxShadow: state.isFocused
        ? "0 0 0 0.15rem rgba(62, 96, 213, 0.2)"
        : "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "var(--bs-primary, #3e60d5)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 4px",
      height: "34px",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--bs-body-color, #313a46)",
      fontWeight: 600,
      fontSize: "0.8125rem",
      margin: 0,
    }),
    input: (base) => ({
      ...base,
      color: "var(--bs-body-color, #313a46)",
      margin: 0,
      padding: 0,
      fontSize: "0.8125rem",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "34px",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "3px 6px",
      color: "var(--bs-secondary-color, #98a6ad)",
      "&:hover": {
        color: "var(--bs-primary, #3e60d5)",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--bs-body-bg, #ffffff)",
      border: "1px solid var(--bs-border-color, #dee2e6)",
      boxShadow: "0 0.5rem 1.25rem rgba(0, 0, 0, 0.15)",
      borderRadius: "0.375rem",
      minWidth: "160px",
      padding: "4px",
      zIndex: 99999,
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.8125rem",
      padding: "6px 10px",
      borderRadius: "0.25rem",
      cursor: "pointer",
      backgroundColor: state.isSelected
        ? "var(--bs-primary, #3e60d5)"
        : state.isFocused
        ? "rgba(var(--bs-primary-rgb, 62, 96, 213), 0.12)"
        : "transparent",
      color: state.isSelected ? "#ffffff" : "var(--bs-body-color, #313a46)",
      fontWeight: state.isSelected ? 600 : 400,
      "&:active": {
        backgroundColor: "var(--bs-primary, #3e60d5)",
        color: "#ffffff",
      },
    }),
  };

  if (!mounted) {
    return (
      <div
        className="topbar-item d-flex align-items-center"
        style={{ width: 145, height: 34 }}
      >
        <span className="text-muted fs-xs">{currentFY}</span>
      </div>
    );
  }

  return (
    <div
      className="topbar-item d-flex align-items-center"
      title="Financial Year"
    >
      <div style={{ width: 145 }}>
        <CreatableSelect<FYOption, false>
          instanceId="global-financial-year-select"
          options={options}
          value={selectedOption}
          onChange={handleChange}
          onCreateOption={handleCreateOption}
          isLoading={loading}
          isSearchable={true}
          isClearable={false}
          placeholder="Select FY"
          formatCreateLabel={(input) => `Add "${formatFinancialYearInput(input)}"`}
          styles={customStyles}
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          menuPosition="fixed"
          components={{
            Control: CustomControl,
            SingleValue: CustomSingleValue,
            Option: CustomOption,
          }}
        />
      </div>
    </div>
  );
};

export default FinancialYearSelect;
