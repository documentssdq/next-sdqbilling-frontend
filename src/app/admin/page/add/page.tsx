import React from "react";
import PageForm from "../components/PageForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = {
  title: "Add New Page",
};

const AddPage = () => {
  return (
    <ProtectedRoute moduleName="Pages">
      <PageForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddPage;
