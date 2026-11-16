import React from "react";
import UnitForm from "../../components/UnitForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Unit" };

const EditUnit = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Unit">
      <UnitForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditUnit;
