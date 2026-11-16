import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import SaleorderListContent from "./components/SaleorderListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Sale Proforma List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Saleorder">
      <PageBreadcrumb title="List" subtitle="Sale Proforma" />
      <Row>
        <Col xs={12}>
          <SaleorderListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
