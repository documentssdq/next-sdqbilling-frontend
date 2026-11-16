import React from "react";
import PurchaseForm from "../components/PurchaseForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add Purchase" };

const AddPurchase = () => {
  return (
    <ProtectedRoute moduleName="Purchase">
      <PurchaseForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddPurchase;
