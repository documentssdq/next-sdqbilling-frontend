import React from "react";
import CategoryForm from "../components/CategoryForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add New Category" };

const AddCategory = () => {
  return (
    <ProtectedRoute moduleName="Categorys">
      <CategoryForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddCategory;
