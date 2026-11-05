"use client";
import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Icon from "@/components/wrappers/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  FormCheck,
  FormControl,
  FormLabel,
  Row,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addCurrency,
  updateCurrency,
  fetchCurrency,
  CurrencyRecord,
} from "@/redux/slices/admin/currencySlice";

interface CurrencyFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

const CurrencyForm: React.FC<CurrencyFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.currency || { records: [] }
  );

  const [formData, setFormData] = useState<CurrencyRecord>({
    id: recordId || "",
    name: "",
    code: "",
    symbol: "",
    description: "",
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchCurrency());
    }
  }, [dispatch, records.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: CurrencyRecord) => (r.id || r._id) === recordId);
      if (found) {
        setFormData({
          ...found,
          id: found.id || found._id || recordId,
          code: found.code || "",
          symbol: found.symbol || "",
        });
      }
    }
  }, [isEdit, recordId, records]);

  const handleChange = (field: keyof CurrencyRecord, value: any) => {
    setFormData((prev: CurrencyRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = "Currency name is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields.");
      return;
    }
    setValidationErrors({});
    setErrorMessage("");

    try {
      const payload: CurrencyRecord = {
        ...formData,
        name: formData.name?.trim(),
        code: formData.code ? formData.code.trim().toUpperCase() : "",
        symbol: formData.symbol ? formData.symbol.trim() : "",
        description: formData.description ? formData.description.trim() : "",
      };

      if (isEdit && (formData.id || recordId)) {
        await dispatch(updateCurrency({ ...payload, id: formData.id || recordId })).unwrap();
      } else {
        const { id, _id, ...body } = payload;
        await dispatch(addCurrency(body)).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/currency`);
      }, 1200);
    } catch (err: any) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error: Please check fields.");
      } else {
        setErrorMessage(err?.message || "Failed to save record.");
      }
    }
  };

  return (
    <>
      <PageBreadcrumb
        title={isEdit ? "Update" : "Create"}
        subtitle="Currency"
      />

      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
          <Icon icon="alert-circle" className="me-2" />
          {errorMessage}
        </Alert>
      )}

      {saved && (
        <Alert variant="success">
          <Icon icon="check-circle" className="me-2" />
          Saved successfully! Redirecting...
        </Alert>
      )}

      <Row className="justify-content-center">
        <Col lg={12}>
          <form onSubmit={handleSubmit}>
            <Card className="mb-4 border-0 shadow-sm">
              <CardHeader className="d-flex justify-content-between align-items-center bg-light-subtle py-3 px-4">
                <h5 className="mb-0 fw-bold">
                  {isEdit ? "Update Currency Details" : "Create New Currency"}
                </h5>
                <Link href={`/admin/currency`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={12}>
                    <FormLabel className="fw-semibold">
                      Currency Name <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. Indian Rupee, US Dollar"
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      isInvalid={!!validationErrors.name}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.name}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold">Currency Code</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. INR, USD, EUR"
                      value={formData.code || ""}
                      onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                      isInvalid={!!validationErrors.code}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.code}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold">Currency Symbol</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. ₹, $, €"
                      value={formData.symbol || ""}
                      onChange={(e) => handleChange("symbol", e.target.value)}
                      isInvalid={!!validationErrors.symbol}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.symbol}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">Description</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={3}
                      placeholder="Describe details..."
                      value={formData.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold mb-2 d-block">Status</FormLabel>
                    <FormCheck
                      type="switch"
                      label={formData.isActive ? "Active" : "Inactive"}
                      checked={formData.isActive}
                      onChange={(e) => handleChange("isActive", e.target.checked)}
                      className="fs-15 fw-semibold mt-1"
                    />
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Link href={`/admin/currency`} className="btn btn-light px-4">
                    Cancel
                  </Link>
                  <Button type="submit" variant="primary" className="px-4 fw-semibold">
                    <Icon icon={isEdit ? "save" : "plus"} className="me-1" />
                    {isEdit ? "Save Changes" : "Create"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </Col>
      </Row>
    </>
  );
};

export default CurrencyForm;
