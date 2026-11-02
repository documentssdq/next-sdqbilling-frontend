import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import EmailTemplateListContent from "./components/EmailTemplateListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Email Templates | Admin" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="EmailTemplate">
      <PageBreadcrumb title="Email Templates" subtitle="Manage Email Templates" />
      <Row>
        <Col xs={12}>
          <EmailTemplateListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
