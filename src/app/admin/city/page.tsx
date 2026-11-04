import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import CityListContent from "./components/CityListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "City List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="City">
      <PageBreadcrumb title="List" subtitle="City" />
      <Row>
        <Col xs={12}>
          <CityListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
