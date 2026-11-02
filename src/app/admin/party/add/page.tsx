import React from "react";
import PartyForm from "../components/PartyForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add Party" };

const AddParty = () => {
  return (
    <ProtectedRoute moduleName="Partys">
      <PartyForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddParty;
