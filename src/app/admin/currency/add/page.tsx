import React from "react";
import CurrencyForm from "../components/CurrencyForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const AddCurrency = () => {
  return (
    <ProtectedRoute moduleName="Currency">
      <CurrencyForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddCurrency;
