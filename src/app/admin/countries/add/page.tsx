import React from "react";
import CountriesForm from "../components/CountriesForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Create" };

const AddCountries = () => {
  return (
    <ProtectedRoute moduleName="Countries">
      <CountriesForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddCountries;
