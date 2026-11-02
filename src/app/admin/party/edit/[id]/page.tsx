import React from "react";
import PartyForm from "../../components/PartyForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Party" };

const EditParty = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Partys">
      <PartyForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditParty;
