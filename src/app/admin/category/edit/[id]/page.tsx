import React from "react";
import CategoryForm from "../../components/CategoryForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Category" };

const EditCategory = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Categorys">
      <CategoryForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditCategory;

