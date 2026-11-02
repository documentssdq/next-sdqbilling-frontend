import React from "react";
import SubcategoryForm from "../components/SubcategoryForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add New Subcategory" };

const AddSubcategory = () => {
  return (
    <ProtectedRoute moduleName="Subcategorys">
      <SubcategoryForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddSubcategory;
