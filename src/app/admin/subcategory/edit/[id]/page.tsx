import React from "react";
import SubcategoryForm from "../../components/SubcategoryForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Subcategory" };

const EditSubcategory = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Subcategorys">
      <SubcategoryForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditSubcategory;
