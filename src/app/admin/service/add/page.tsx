import React from "react";
import ServiceForm from "../components/ServiceForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add New Service" };

const AddService = () => {
  return (
    <ProtectedRoute moduleName="Services">
      <ServiceForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddService;
