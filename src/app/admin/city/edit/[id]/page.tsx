import React from "react";
import CityForm from "../../components/CityForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit City" };

const EditCity = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="City">
      <CityForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditCity;
