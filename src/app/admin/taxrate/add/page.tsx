import React from "react";
import TaxrateForm from "../components/TaxrateForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const AddTaxrate = () => {
  return (
    <ProtectedRoute moduleName="Taxrate">
      <TaxrateForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddTaxrate;
