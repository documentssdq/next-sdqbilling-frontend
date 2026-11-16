import React from "react";
import PurchaseorderForm from "../../components/PurchaseorderForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Purchase Proforma" };

const EditPurchaseorder = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Purchaseorder">
      <PurchaseorderForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditPurchaseorder;
