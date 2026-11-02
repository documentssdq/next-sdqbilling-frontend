import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import ServiceListContent from "./components/ServiceListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Service List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Services">
      <PageBreadcrumb title="List" subtitle="Service" />
      <Row>
        <Col xs={12}>
          <ServiceListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
