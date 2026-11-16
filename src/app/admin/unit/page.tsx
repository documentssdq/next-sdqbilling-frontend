import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import UnitListContent from "./components/UnitListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Unit List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Unit">
      <PageBreadcrumb title="List" subtitle="Unit" />
      <Row>
        <Col xs={12}>
          <UnitListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
