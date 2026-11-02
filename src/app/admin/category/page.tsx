import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import CategoryListContent from "./components/CategoryListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Category List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Categorys">
      <PageBreadcrumb title="List" subtitle="Category" />
      <Row>
        <Col xs={12}>
          <CategoryListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
