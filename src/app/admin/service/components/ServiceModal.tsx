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
import { fetchSubcategorys, SubcategoryRecord } from "@/redux/slices/admin/subcategorySlice";

interface ServiceModalProps {
  show: boolean;
  onHide: () => void;
  service: ServiceRecord | null;
  onSave: (record: ServiceRecord) => Promise<void>;
}

export interface DropdownOption {
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

  const { records: subcategoryList, loading: subcategoriesLoading } = useAppSelector(
    (state: any) => state.subcategory || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<ServiceRecord>({
    id: "",
    category_id: "",
    subcategory_id: "",
    ccategory_id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      if (categoryList.length === 0) {
        dispatch(fetchCategorys());
      }
      if (subcategoryList.length === 0) {
        dispatch(fetchSubcategorys());
      }
    }
  }, [dispatch, show, categoryList.length, subcategoryList.length]);

  useEffect(() => {
    if (service) {
      let initialCategoryId = "";
      if (typeof service.category_id === "object" && service.category_id) {
        initialCategoryId = (service.category_id as any).id || (service.category_id as any)._id || "";
      } else if (typeof service.category_id === "string") {
        initialCategoryId = service.category_id;
      } else if (service.ccategory_id) {
        initialCategoryId = service.ccategory_id;
      }

      let initialSubcategoryId = "";
      if (typeof service.subcategory_id === "object" && service.subcategory_id) {
        initialSubcategoryId = (service.subcategory_id as any).id || (service.subcategory_id as any)._id || "";
      } else if (typeof service.subcategory_id === "string") {
        initialSubcategoryId = service.subcategory_id;
      }

      setFormData({
        id: service.id || service._id || "",
        _id: service._id || service.id || "",
        category_id: initialCategoryId,
        subcategory_id: initialSubcategoryId,
        ccategory_id: initialCategoryId,
        name: service.name || "",
        description: service.description || "",
        isActive: service.isActive !== undefined ? service.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        category_id: "",
        subcategory_id: "",
        ccategory_id: "",
        name: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [service, show]);

  // Extract current normalized category ID
  const selectedCategoryId = useMemo(() => {
    if (typeof formData.category_id === "object" && formData.category_id) {
      return (formData.category_id as any).id || (formData.category_id as any)._id || "";
    }
    return typeof formData.category_id === "string" ? formData.category_id : "";
  }, [formData.category_id]);

  // Extract current normalized subcategory ID
  const selectedSubcategoryId = useMemo(() => {
    if (typeof formData.subcategory_id === "object" && formData.subcategory_id) {
      return (formData.subcategory_id as any).id || (formData.subcategory_id as any)._id || "";
    }
    return typeof formData.subcategory_id === "string" ? formData.subcategory_id : "";
  }, [formData.subcategory_id]);

  // Available categories list
  const categoryOptions: DropdownOption[] = useMemo(() => {
    return categoryList
      .filter((cat: CategoryRecord) => {
        const catId = cat.id || cat._id || "";
        return cat.isActive !== false || catId === selectedCategoryId;
      })
      .map((cat: CategoryRecord) => ({
        value: cat.id || cat._id || "",
        label: cat.name || "Unnamed Category",
      }));
  }, [categoryList, selectedCategoryId]);

  // Subcategories strictly filtered against selectedCategoryId
  const subcategoryOptions: DropdownOption[] = useMemo(() => {
    if (!selectedCategoryId) return [];

    return subcategoryList
      .filter((sub: SubcategoryRecord) => {
        const subCatId =
          typeof sub.category_id === "object" && sub.category_id
            ? (sub.category_id as any).id || (sub.category_id as any)._id
            : sub.category_id;
        const subId = sub.id || sub._id || "";
        return (
          String(subCatId) === String(selectedCategoryId) &&
          (sub.isActive !== false || subId === selectedSubcategoryId)
        );
      })
      .map((sub: SubcategoryRecord) => ({
        value: sub.id || sub._id || "",
        label: sub.name || "Unnamed Subcategory",
      }));
  }, [subcategoryList, selectedCategoryId, selectedSubcategoryId]);

  // Selected Category Option object for react-select
  const selectedCategoryOption = useMemo(() => {
    if (!selectedCategoryId) return null;
    const found = categoryOptions.find((opt) => opt.value === selectedCategoryId);
    if (found) return found;

    // Fallback if records are still populating
    const fallbackCatName =
      typeof service?.category_id === "object" && service?.category_id?.name
        ? service.category_id.name
        : "";

    return {
      value: selectedCategoryId,
      label: fallbackCatName || "Selected Category",
    };
  }, [categoryOptions, selectedCategoryId, service]);

  // Selected Subcategory Option object for react-select
  const selectedSubcategoryOption = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    const found = subcategoryOptions.find((opt) => opt.value === selectedSubcategoryId);
    if (found) return found;

    // Fallback if records are still populating
    const fallbackSubcatName =
      typeof service?.subcategory_id === "object" && service?.subcategory_id?.name
        ? service.subcategory_id.name
        : "";

    return {
      value: selectedSubcategoryId,
      label: fallbackSubcatName || "Selected Subcategory",
    };
  }, [subcategoryOptions, selectedSubcategoryId, service]);

  const handleChange = (field: keyof ServiceRecord, value: any) => {
    setFormData((prev: ServiceRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleCategoryChange = (selected: DropdownOption | null) => {
    const newCatId = selected ? selected.value : "";
    setFormData((prev) => ({
      ...prev,
      category_id: newCatId,
      ccategory_id: newCatId,
      // Reset subcategory when category changes or is cleared
      subcategory_id: "",
    }));

    if (validationErrors.category_id) {
      setValidationErrors((prev) => ({ ...prev, category_id: "" }));
    }
  };

  const handleSubcategoryChange = (selected: DropdownOption | null) => {
    const newSubcatId = selected ? selected.value : "";
    setFormData((prev) => ({
      ...prev,
      subcategory_id: newSubcatId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const catId = selectedCategoryId.trim();
    const subcatId = selectedSubcategoryId.trim();

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
        subcategory_id: subcatId || null,
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
    <Modal show={show} onHide={onHide} size="lg" centered>
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
                Service Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="Enter service name..."
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                isInvalid={!!validationErrors.name}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.name}
              </FormControl.Feedback>
            </Col>

            {/* Category Field */}
            <Col md={6}>
              <FormLabel className="fw-semibold">
                Category <span className="text-danger">*</span>
              </FormLabel>
              <Select<DropdownOption>
                instanceId="service-modal-category-select"
                options={categoryOptions}
                value={selectedCategoryOption}
                isLoading={categoriesLoading}
                isSearchable
                isClearable
                placeholder="Search & select category..."
                noOptionsMessage={() => "No categories found"}
                onChange={handleCategoryChange}
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

            {/* Subcategory Field (dependent on Category) */}
            <Col md={6}>
              <FormLabel className="fw-semibold">Subcategory</FormLabel>
              <Select<DropdownOption>
                instanceId="service-modal-subcategory-select"
                options={subcategoryOptions}
                value={selectedSubcategoryOption}
                isLoading={subcategoriesLoading}
                isSearchable
                isClearable
                isDisabled={!selectedCategoryId}
                placeholder={
                  selectedCategoryId
                    ? "Search & select subcategory..."
                    : "Select category first..."
                }
                noOptionsMessage={() =>
                  selectedCategoryId
                    ? "No subcategories found for this category"
                    : "Select category first"
                }
                onChange={handleSubcategoryChange}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, state) => ({
                    ...base,
                    minHeight: "38px",
                    borderColor: state.isFocused ? "#3e60d5" : "#dee2e6",
                    boxShadow: state.isFocused
                      ? "0 0 0 0.15rem rgba(62, 96, 213, 0.25)"
                      : "none",
                    backgroundColor: !selectedCategoryId ? "#f8f9fa" : base.backgroundColor,
                    "&:hover": {
                      borderColor: "#3e60d5",
                    },
                  }),
                }}
              />
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