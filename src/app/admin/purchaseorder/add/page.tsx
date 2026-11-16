import React from "react";
import PurchaseorderForm from "../components/PurchaseorderForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add Purchase Proforma" };

const AddPurchaseorder = () => {
  return (
    <ProtectedRoute moduleName="Purchaseorder">
      <PurchaseorderForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddPurchaseorder;
