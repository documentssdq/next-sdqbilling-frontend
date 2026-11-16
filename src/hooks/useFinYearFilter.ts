import { useCallback, useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { getFinancialYear } from "@/redux/slices/admin/financialYearSlice";

export interface RecordWithFinYear {
  fin_year?: string;
  [key: string]: any;
}

/**
 * Universal Financial Year Hook providing a standardized WHERE condition base
 * across all module tables and forms that utilize the `fin_year` field.
 */
export const useFinYearFilter = <T extends RecordWithFinYear = RecordWithFinYear>() => {
  const currentFY = useMemo(() => getFinancialYear(), []);

  const reduxFinYear = useAppSelector(
    (state: any) => state.financialYear?.selectedFinYear
  );

  const selectedFinYear = useMemo(() => {
    if (reduxFinYear && reduxFinYear.trim()) {
      return reduxFinYear.trim();
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("global_fin_year");
        if (stored && stored.trim()) {
          return stored.trim();
        }
      } catch (e) {
        // ignore
      }
    }
    return currentFY;
  }, [reduxFinYear, currentFY]);

  const isAll = selectedFinYear === "All";

  /**
   * Generates URL search params / query object WHERE condition for API requests
   */
  const getFinYearWhereParams = useCallback((): Record<string, string> => {
    if (!selectedFinYear || selectedFinYear === "All") {
      return {};
    }
    return { fin_year: selectedFinYear };
  }, [selectedFinYear]);

  /**
   * Predicate to check if an individual record satisfies the WHERE condition
   */
  const matchesFinYearWhere = useCallback(
    (record: T): boolean => {
      if (!selectedFinYear || selectedFinYear === "All") {
        return true;
      }
      return record.fin_year === selectedFinYear;
    },
    [selectedFinYear]
  );

  /**
   * Filters a list of records using the WHERE condition
   */
  const applyFinYearWhere = useCallback(
    (records: T[]): T[] => {
      if (!Array.isArray(records)) return [];
      if (!selectedFinYear || selectedFinYear === "All") {
        return records;
      }
      return records.filter((r) => r.fin_year === selectedFinYear);
    },
    [selectedFinYear]
  );

  return {
    selectedFinYear,
    currentFY,
    isAll,
    getFinYearWhereParams,
    matchesFinYearWhere,
    applyFinYearWhere,
  };
};

export default useFinYearFilter;
