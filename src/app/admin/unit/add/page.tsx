import React from "react";
import UnitForm from "../components/UnitForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const AddUnit = () => {
  return (
    <ProtectedRoute moduleName="Unit">
      <UnitForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddUnit;
