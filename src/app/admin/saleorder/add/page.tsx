import React from "react";
import SaleorderForm from "../components/SaleorderForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add Sale Order" };

const AddSaleorder = () => {
  return (
    <ProtectedRoute moduleName="Saleorder">
      <SaleorderForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddSaleorder;
