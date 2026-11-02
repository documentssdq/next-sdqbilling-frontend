import React from "react";
import ServiceForm from "../../components/ServiceForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Service" };

const EditService = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Services">
      <ServiceForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditService;
