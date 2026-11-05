"use client";

import React, { useEffect, useState } from "react";
import Icon from "@/components/wrappers/Icon";
import {
  Modal,
  Button,
  Row,
  Col,
  FormLabel,
  FormControl,
  FormCheck,
  Alert,
  Spinner,
} from "react-bootstrap";
import { CurrencyRecord } from "@/redux/slices/admin/currencySlice";

interface CurrencyModalProps {
  show: boolean;
  onHide: () => void;
  currency: CurrencyRecord | null;
  onSave: (record: CurrencyRecord) => Promise<void>;
}

const CurrencyModal: React.FC<CurrencyModalProps> = ({
  show,
  onHide,
  currency,
  onSave,
}) => {
  const isEdit = !!currency;

  const [formData, setFormData] = useState<CurrencyRecord>({
    id: "",
    name: "",
    code: "",
    symbol: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currency) {
      setFormData({
        id: currency.id || currency._id || "",
        _id: currency._id || currency.id || "",
        name: currency.name || "",
        code: currency.code || "",
        symbol: currency.symbol || "",
        description: currency.description || "",
        isActive: currency.isActive !== undefined ? currency.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        code: "",
        symbol: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [currency, show]);

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
    if (!formData.name?.trim()) {
      errors.name = "Currency name is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("");
      return;
    }

    setValidationErrors({});
    setErrorMessage("");
    setSubmitting(true);

    try {
      const payload: CurrencyRecord = {
        ...formData,
        name: formData.name?.trim(),
        code: formData.code ? formData.code.trim().toUpperCase() : "",
        symbol: formData.symbol ? formData.symbol.trim() : "",
        description: formData.description ? formData.description.trim() : "",
      };
      await onSave(payload);
      onHide();
    } catch (err: any) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) fieldErrors[e.field] = e.message;
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error: Please check fields.");
      } else {
        setErrorMessage(err?.message || "Failed to save currency.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-16 d-flex align-items-center gap-2">
            <Icon
              icon={isEdit ? "square-pen" : "plus-circle"}
              className="text-primary"
            />
            {isEdit ? `Edit Currency: ${currency?.name || ""}` : "Add Currency"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {errorMessage && (
            <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
              <Icon icon="alert-circle" className="me-2" />
              {errorMessage}
            </Alert>
          )}

          <Row className="g-3">
            <Col xs={12}>
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

            <Col xs={12}>
              <FormLabel className="fw-semibold">Description</FormLabel>
              <FormControl
                as="textarea"
                rows={3}
                placeholder="Describe details..."
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                isInvalid={!!validationErrors.description}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.description}
              </FormControl.Feedback>
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold mb-2 d-block">Status</FormLabel>
              <FormCheck
                type="switch"
                id="currency-status-switch"
                label={formData.isActive ? "Active" : "Inactive"}
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="fs-15 fw-semibold mt-1"
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="light" onClick={onHide} type="button" disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="d-flex align-items-center gap-1"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon={isEdit ? "save" : "plus"} />
                {isEdit ? "Save Changes" : "Create Currency"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CurrencyModal;
