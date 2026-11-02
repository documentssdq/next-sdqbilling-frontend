import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import SubcategoryListContent from "./components/SubcategoryListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Subcategory List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Subcategorys">
      <PageBreadcrumb title="List" subtitle="Subcategory" />
      <Row>
        <Col xs={12}>
          <SubcategoryListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
