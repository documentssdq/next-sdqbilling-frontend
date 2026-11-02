import React from "react";
import StateForm from "../../components/StateForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit State" };

const EditState = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="State">
      <StateForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditState;
