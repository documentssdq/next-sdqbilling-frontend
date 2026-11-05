import React from "react";
import CurrencyForm from "../../components/CurrencyForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Currency" };

const EditCurrency = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Currency">
      <CurrencyForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditCurrency;
