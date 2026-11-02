import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import PageListContent from "./components/PageListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Page List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Pages">
      <PageBreadcrumb title="Page List" subtitle="Page Management" />
      <Row>
        <Col xs={12}>
          <PageListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
