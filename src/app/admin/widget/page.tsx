import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import WidgetListContent from "./components/WidgetListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Widget List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Widgets">
      <PageBreadcrumb title="Widget List" subtitle="Widget Management" />
      <Row>
        <Col xs={12}>
          <WidgetListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
