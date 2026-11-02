import React from "react";
import CountriesForm from "../../components/CountriesForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Countries" };

const EditCountries = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Countries">
      <CountriesForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditCountries;
