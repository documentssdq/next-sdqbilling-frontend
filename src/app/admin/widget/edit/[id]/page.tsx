import React from "react";
import WidgetForm from "../../components/WidgetForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = { title: "Edit Widget" };

const EditWidget = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Widgets">
      <WidgetForm mode="edit" recordId={resolvedParams.id} />
    </ProtectedRoute>
  );
};

export default EditWidget;
