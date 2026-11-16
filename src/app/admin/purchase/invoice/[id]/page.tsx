import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PurchaseInvoice from "../../components/PurchaseInvoice";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export const metadata = { title: "Purchase Invoice" };

const PurchaseInvoicePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Purchase">
      <div className="no-print">
        <PageBreadcrumb title="Purchase Invoice" subtitle="Purchase" />
      </div>
      <PurchaseInvoice purchaseId={resolvedParams.id} standalone={true} />
    </ProtectedRoute>
  );
};

export default PurchaseInvoicePage;

