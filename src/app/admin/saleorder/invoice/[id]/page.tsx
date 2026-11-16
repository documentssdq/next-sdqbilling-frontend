import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SaleorderInvoice from "../../components/SaleorderInvoice";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export const metadata = { title: "Sale Order Invoice" };

const SaleorderInvoicePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
  return (
    <ProtectedRoute moduleName="Saleorder">
      <div className="no-print">
        <PageBreadcrumb title="Sale Order Invoice" subtitle="Sale Order" />
      </div>
      <SaleorderInvoice orderId={resolvedParams.id} standalone={true} />
    </ProtectedRoute>
  );
};

export default SaleorderInvoicePage;

