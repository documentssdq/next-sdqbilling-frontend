import React from "react";
import CityForm from "../components/CityForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const AddCity = () => {
  return (
    <ProtectedRoute moduleName="City">
      <CityForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddCity;
