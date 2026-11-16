import React from "react";
import PurchaseForm from "../../components/PurchaseForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Purchase" };

const EditPurchase = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Purchase">
      <PurchaseForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditPurchase;
