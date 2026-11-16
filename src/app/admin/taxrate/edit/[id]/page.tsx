import React from "react";
import TaxrateForm from "../../components/TaxrateForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Taxrate" };

const EditTaxrate = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Taxrate">
      <TaxrateForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditTaxrate;
