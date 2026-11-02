import React from "react";
import WidgetForm from "../components/WidgetForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Add New Widget" };

const AddWidget = () => {
  return (
    <ProtectedRoute moduleName="Widgets">
      <WidgetForm mode="add" />
    </ProtectedRoute>
  );
};

export default AddWidget;
