import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import TaxrateListContent from "./components/TaxrateListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Taxrate List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Taxrate">
      <PageBreadcrumb title="List" subtitle="Taxrate" />
      <Row>
        <Col xs={12}>
          <TaxrateListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
