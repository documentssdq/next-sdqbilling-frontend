import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import PartyListContent from "./components/PartyListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Party List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Partys">
      <PageBreadcrumb title="List" subtitle="Party" />
      <Row>
        <Col xs={12}>
          <PartyListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
