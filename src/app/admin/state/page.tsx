import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import StateListContent from "./components/StateListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "State List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="State">
      <PageBreadcrumb title="List" subtitle="State" />
      <Row>
        <Col xs={12}>
          <StateListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
