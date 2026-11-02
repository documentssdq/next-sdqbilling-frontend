"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ServiceRecord } from "@/redux/slices/admin/serviceSlice";
import { fetchCategorys, CategoryRecord } from "@/redux/slices/admin/categorySlice";

interface ServiceModalProps {
  show: boolean;
  onHide: () => void;
  service: ServiceRecord | null;
  onSave: (record: ServiceRecord) => Promise<void>;
}

interface CategoryOption {
  value: string;
  label: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  show,
  onHide,
  service,
  onSave,
}) => {
  const dispatch = useAppDispatch();
  const isEdit = !!service;

  const { records: categoryList, loading: categoriesLoading } = useAppSelector(
    (state: any) => state.category || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<ServiceRecord>({
    id: "",
    category_id: "",
    ccategory_id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show && categoryList.length === 0) {
      dispatch(fetchCategorys());
    }
  }, [dispatch, show, categoryList.length]);

  useEffect(() => {
    if (service) {
      let initialCategoryId = "";
      if (typeof service.category_id === "object" && service.category_id) {
        initialCategoryId = service.category_id.id || service.category_id._id || "";
      } else if (typeof service.category_id === "string") {
        initialCategoryId = service.category_id;
      } else if (service.ccategory_id) {
        initialCategoryId = service.ccategory_id;
      }

      setFormData({
        id: service.id || service._id || "",
        _id: service._id || service.id || "",
        category_id: initialCategoryId,
        ccategory_id: initialCategoryId,
        name: service.name || "",
        description: service.description || "",
        isActive: service.isActive !== undefined ? service.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        category_id: "",
        ccategory_id: "",
        name: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [service, show]);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    return categoryList
      .filter(
        (cat: CategoryRecord) =>
          cat.isActive !== false || (cat.id || cat._id) === formData.category_id
      )
      .map((cat: CategoryRecord) => ({
        value: cat.id || cat._id || "",
        label: cat.name || "",
      }));
  }, [categoryList, formData.category_id]);

  const selectedCategoryOption = useMemo(() => {
    if (!formData.category_id) return null;
    const currentId =
      typeof formData.category_id === "string" ? formData.category_id : "";
    const matched = categoryOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;

    if (currentId) {
      const fallbackName =
        typeof service?.category_id === "object" && service?.category_id?.name
          ? service.category_id.name
          : "";
      return {
        value: currentId,
        label: fallbackName || "Selected Category",
      };
    }
    return null;
  }, [categoryOptions, formData.category_id, service]);

  const handleChange = (field: keyof ServiceRecord, value: any) => {
    setFormData((prev: ServiceRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
    if (field === "category_id" && validationErrors.category_id) {
      setValidationErrors((prev) => ({ ...prev, category_id: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const catId = typeof formData.category_id === "string" ? formData.category_id.trim() : "";
    if (!catId) {
      errors.category_id = "Category is required";
    }

    if (!formData.name?.trim()) {
      errors.name = "Service name is required";
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
        category_id: catId,
        ccategory_id: catId,
      });
      onHide();
    } catch (err: any) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) {
            if (e.field === "category_id" || e.field === "ccategory_id") {
              fieldErrors.category_id = e.message;
            } else {
              fieldErrors[e.field] = e.message;
            }
          }
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error: Please check fields.");
      } else {
        setErrorMessage(err?.message || "Failed to save service.");
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
            {isEdit ? `Edit Service: ${service?.name || ""}` : "Add Service"}
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
                Category <span className="text-danger">*</span>
              </FormLabel>
              <Select<CategoryOption>
                instanceId="service-category-select"
                options={categoryOptions}
                value={selectedCategoryOption}
                isLoading={categoriesLoading}
                isSearchable
                isClearable
                placeholder="Search & select category..."
                noOptionsMessage={() => "No categories found"}
                onChange={(selected) => {
                  const val = selected ? selected.value : "";
                  handleChange("category_id", val);
                  handleChange("ccategory_id", val);
                }}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, state) => ({
                    ...base,
                    minHeight: "38px",
                    borderColor: validationErrors.category_id
                      ? "#f1556c"
                      : state.isFocused
                      ? "#3e60d5"
                      : "#dee2e6",
                    boxShadow: state.isFocused
                      ? "0 0 0 0.15rem rgba(62, 96, 213, 0.25)"
                      : "none",
                    "&:hover": {
                      borderColor: validationErrors.category_id ? "#f1556c" : "#3e60d5",
                    },
                  }),
                }}
              />
              {validationErrors.category_id && (
                <div className="text-danger fs-12 mt-1">
                  {validationErrors.category_id}
                </div>
              )}
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold">
                Service Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. Web Development"
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
                placeholder="Describe this service..."
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
                id="service-status-switch"
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
                {isEdit ? "Save Changes" : "Create Service"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default ServiceModal;
