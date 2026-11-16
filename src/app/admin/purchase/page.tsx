import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import PurchaseListContent from "./components/PurchaseListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Purchase List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Purchase">
      <PageBreadcrumb title="List" subtitle="Purchase" />
      <Row>
        <Col xs={12}>
          <PurchaseListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
