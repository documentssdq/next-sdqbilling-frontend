import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import SmsTemplateListContent from "./components/SmsTemplateListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "SMS Templates | Admin" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="SmsTemplate">
      <PageBreadcrumb title="SMS Templates" subtitle="Manage SMS Templates" />
      <Row>
        <Col xs={12}>
          <SmsTemplateListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
