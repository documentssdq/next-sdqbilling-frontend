import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import CountriesListContent from "./components/CountriesListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Countries List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Countries">
      <PageBreadcrumb title="List" subtitle="Countries" />
      <Row>
        <Col xs={12}>
          <CountriesListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
