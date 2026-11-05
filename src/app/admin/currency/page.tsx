import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Metadata } from "next";
import { Col, Row } from "react-bootstrap";
import CurrencyListContent from "./components/CurrencyListContent";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = { title: "Currency List" };

const Page = () => {
  return (
    <ProtectedRoute moduleName="Currency">
      <PageBreadcrumb title="List" subtitle="Currency" />
      <Row>
        <Col xs={12}>
          <CurrencyListContent />
        </Col>
      </Row>
    </ProtectedRoute>
  );
};

export default Page;
