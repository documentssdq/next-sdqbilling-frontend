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
import { SaleorderRecord } from "@/redux/slices/admin/saleorderSlice";

interface SaleorderModalProps {
  show: boolean;
  onHide: () => void;
  saleorder: SaleorderRecord | null;
  onSave: (record: SaleorderRecord) => Promise<void>;
}

const SaleorderModal: React.FC<SaleorderModalProps> = ({
  show,
  onHide,
  saleorder,
  onSave,
}) => {
  const isEdit = !!saleorder;

  const [formData, setFormData] = useState<SaleorderRecord>({
    id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (saleorder) {
      setFormData({
        id: saleorder.id || saleorder._id || "",
        _id: saleorder._id || saleorder.id || "",
        name: saleorder.name || "",
        description: saleorder.description || "",
        isActive: saleorder.isActive !== undefined ? saleorder.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [saleorder, show]);

  const handleChange = (field: keyof SaleorderRecord, value: any) => {
    setFormData((prev: SaleorderRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errors.name = "Saleorder name is required";
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
      await onSave(formData);
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
        setErrorMessage(err?.message || "Failed to save saleorder.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-16 d-flex align-items-center gap-2">
            <Icon
              icon={isEdit ? "square-pen" : "plus-circle"}
              className="text-primary"
            />
            {isEdit ? `Edit Saleorder: ${saleorder?.name || ""}` : "Add Saleorder"}
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
                Saleorder Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="Enter name..."
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                isInvalid={!!validationErrors.name}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.name}
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
                id="saleorder-status-switch"
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
                {isEdit ? "Save Changes" : "Create Saleorder"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default SaleorderModal;
