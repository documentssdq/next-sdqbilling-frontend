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
  FormSelect,
  FormCheck,
  Alert,
  Spinner,
} from "react-bootstrap";
import { TaxrateRecord, TAX_TYPES } from "@/redux/slices/admin/taxrateSlice";

interface TaxrateModalProps {
  show: boolean;
  onHide: () => void;
  taxrate: TaxrateRecord | null;
  onSave: (record: TaxrateRecord) => Promise<void>;
}

const TaxrateModal: React.FC<TaxrateModalProps> = ({
  show,
  onHide,
  taxrate,
  onSave,
}) => {
  const isEdit = !!taxrate;

  const [formData, setFormData] = useState<TaxrateRecord>({
    id: "",
    name: "",
    rate: 0,
    taxType: "GST",
    isDefault: false,
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (taxrate) {
      setFormData({
        id: taxrate.id || taxrate._id || "",
        _id: taxrate._id || taxrate.id || "",
        name: taxrate.name || "",
        rate: taxrate.rate !== undefined && taxrate.rate !== null ? taxrate.rate : 0,
        taxType: taxrate.taxType || "GST",
        isDefault: !!taxrate.isDefault,
        description: taxrate.description || "",
        isActive: taxrate.isActive !== undefined ? taxrate.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        rate: 0,
        taxType: "GST",
        isDefault: false,
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [taxrate, show]);

  const handleChange = (field: keyof TaxrateRecord, value: any) => {
    setFormData((prev: TaxrateRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = "Tax rate name is required";
    }

    if (
      formData.rate === undefined ||
      formData.rate === null ||
      formData.rate === ("" as any) ||
      isNaN(Number(formData.rate))
    ) {
      errors.rate = "Tax rate is required";
    } else if (Number(formData.rate) < 0 || Number(formData.rate) > 100) {
      errors.rate = "Rate must be between 0% and 100%";
    }

    if (!formData.taxType) {
      errors.taxType = "Tax type is required";
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
      await onSave({
        ...formData,
        name: formData.name?.trim(),
        rate: Number(formData.rate),
      });
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
        setErrorMessage(err?.message || "Failed to save tax rate.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-16 d-flex align-items-center gap-2">
            <Icon
              icon={isEdit ? "square-pen" : "plus-circle"}
              className="text-primary"
            />
            {isEdit ? `Edit Tax Rate: ${taxrate?.name || ""}` : "Add New Tax Rate"}
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
            <Col md={7}>
              <FormLabel className="fw-semibold">
                Tax Rate Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. GST 18%, VAT 5%"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                isInvalid={!!validationErrors.name}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.name}
              </FormControl.Feedback>
            </Col>

            <Col md={5}>
              <FormLabel className="fw-semibold">
                Tax Type <span className="text-danger">*</span>
              </FormLabel>
              <FormSelect
                value={formData.taxType || "GST"}
                onChange={(e) => handleChange("taxType", e.target.value)}
                isInvalid={!!validationErrors.taxType}
              >
                {TAX_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </FormSelect>
              <FormControl.Feedback type="invalid">
                {validationErrors.taxType}
              </FormControl.Feedback>
            </Col>

            <Col md={6}>
              <FormLabel className="fw-semibold">
                Rate (%) <span className="text-danger">*</span>
              </FormLabel>
              <div className="input-group">
                <FormControl
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="e.g. 18"
                  value={
                    formData.rate !== undefined && formData.rate !== null
                      ? formData.rate
                      : ""
                  }
                  onChange={(e) =>
                    handleChange(
                      "rate",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  isInvalid={!!validationErrors.rate}
                />
                <span className="input-group-text bg-light text-muted fw-bold">%</span>
                <FormControl.Feedback type="invalid">
                  {validationErrors.rate}
                </FormControl.Feedback>
              </div>
            </Col>

            <Col md={6}>
              <FormLabel className="fw-semibold mb-2 d-block">Default Rate</FormLabel>
              <FormCheck
                type="switch"
                id="taxrate-modal-isdefault"
                label={
                  <span>
                    Default for <strong>{formData.taxType || "GST"}</strong>
                  </span>
                }
                checked={!!formData.isDefault}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
                className="fs-14 fw-semibold mt-2"
              />
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold">Description</FormLabel>
              <FormControl
                as="textarea"
                rows={3}
                placeholder="Description..."
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
                id="taxrate-status-switch"
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
            className="d-flex align-items-center gap-1 fw-semibold"
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
                {isEdit ? "Save Changes" : "Create Tax Rate"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default TaxrateModal;
