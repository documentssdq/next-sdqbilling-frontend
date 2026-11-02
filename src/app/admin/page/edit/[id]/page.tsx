import React from "react";
import PageForm from "../../components/PageForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = {
  title: "Edit Page",
};

const EditPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Pages">
      <PageForm mode="edit" pageId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditPage;
