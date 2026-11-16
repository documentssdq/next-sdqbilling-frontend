import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import PurchaseorderListContent from "./components/PurchaseorderListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Proforma Invoice List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Purchaseorder">
      <PageBreadcrumb title="List" subtitle="Proforma" />
      <Row>
        <Col xs={12}>
          <PurchaseorderListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
