import React from "react";
import StateForm from "../components/StateForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const AddState = () => {
  return (
    <ProtectedRoute moduleName="State">
      <StateForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddState;
