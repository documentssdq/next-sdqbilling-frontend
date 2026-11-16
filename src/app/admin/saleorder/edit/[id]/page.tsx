import React from "react";
import SaleorderForm from "../../components/SaleorderForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Sale Order" };

const EditSaleorder = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Saleorder">
      <SaleorderForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditSaleorder;
