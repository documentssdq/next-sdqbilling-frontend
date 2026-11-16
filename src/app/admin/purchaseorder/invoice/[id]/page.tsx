import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PurchaseorderInvoice from "../../components/PurchaseorderInvoice";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export const metadata = { title: "Purchase Proforma Invoice" };

const PurchaseorderInvoicePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Purchaseorder">
      <div className="no-print">
        <PageBreadcrumb title="Purchase Proforma Invoice" subtitle="Purchase Proforma" />
      </div>
      <PurchaseorderInvoice orderId={resolvedParams.id} standalone={true} />
    </ProtectedRoute>
  );
};

export default PurchaseorderInvoicePage;

