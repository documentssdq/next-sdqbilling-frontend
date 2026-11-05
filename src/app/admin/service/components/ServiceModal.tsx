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

export interface CategorySubcategoryOption {
  value: string;
  label: string;
  category_id: string;
  subcategory_id: string | null;
  categoryName: string;
  subcategoryName?: string;
  isCategoryOnly: boolean;
}

export interface GroupedCategoryOption {
  label: string;
  options: CategorySubcategoryOption[];
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
        initialCategoryId = service.category_id.id || service.category_id._id || "";
      } else if (typeof service.category_id === "string") {
        initialCategoryId = service.category_id;
      } else if (service.ccategory_id) {
        initialCategoryId = service.ccategory_id;
      }

      let initialSubcategoryId = "";
      if (typeof service.subcategory_id === "object" && service.subcategory_id) {
        initialSubcategoryId = service.subcategory_id.id || service.subcategory_id._id || "";
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

  const groupedOptions: GroupedCategoryOption[] = useMemo(() => {
    const groups: GroupedCategoryOption[] = [];

    const activeCategories = categoryList.filter(
      (cat: CategoryRecord) =>
        cat.isActive !== false || (cat.id || cat._id) === formData.category_id
    );

    activeCategories.forEach((cat: CategoryRecord) => {
      const catId = cat.id || cat._id || "";
      const catName = cat.name || "";

      const matchingSubs = subcategoryList.filter((sub: SubcategoryRecord) => {
        const subCatId =
          typeof sub.category_id === "object" && sub.category_id
            ? sub.category_id.id || sub.category_id._id
            : sub.category_id;
        return (
          subCatId === catId &&
          (sub.isActive !== false || (sub.id || sub._id) === formData.subcategory_id)
        );
      });

      const options: CategorySubcategoryOption[] = [];

      // 1. Direct Category option
      options.push({
        value: `cat_${catId}`,
        label: matchingSubs.length > 0 ? `${catName} (Main Category)` : catName,
        category_id: catId,
        subcategory_id: null,
        categoryName: catName,
        subcategoryName: "",
        isCategoryOnly: true,
      });

      // 2. Subcategories under this category
      matchingSubs.forEach((sub: SubcategoryRecord) => {
        const subId = sub.id || sub._id || "";
        const subName = sub.name || "Unnamed Subcategory";
        options.push({
          value: `sub_${subId}`,
          label: subName,
          category_id: catId,
          subcategory_id: subId,
          categoryName: catName,
          subcategoryName: subName,
          isCategoryOnly: false,
        });
      });

      groups.push({
        label: catName,
        options,
      });
    });

    return groups;
  }, [categoryList, subcategoryList, formData.category_id, formData.subcategory_id]);

  const selectedCategoryOption = useMemo(() => {
    const currentCatId =
      typeof formData.category_id === "object" && formData.category_id
        ? formData.category_id.id || formData.category_id._id || ""
        : typeof formData.category_id === "string"
        ? formData.category_id
        : "";

    const currentSubcatId =
      typeof formData.subcategory_id === "object" && formData.subcategory_id
        ? formData.subcategory_id.id || formData.subcategory_id._id || ""
        : typeof formData.subcategory_id === "string"
        ? formData.subcategory_id
        : "";

    if (!currentCatId && !currentSubcatId) return null;

    for (const group of groupedOptions) {
      for (const opt of group.options) {
        if (currentSubcatId && opt.subcategory_id === currentSubcatId) {
          return opt;
        }
        if (!currentSubcatId && opt.category_id === currentCatId && opt.isCategoryOnly) {
          return opt;
        }
      }
    }

    // Fallback if records are still populating
    const fallbackCatName =
      typeof service?.category_id === "object" && service?.category_id?.name
        ? service.category_id.name
        : "";
    const fallbackSubcatName =
      typeof service?.subcategory_id === "object" && service?.subcategory_id?.name
        ? service.subcategory_id.name
        : "";

    if (currentCatId || currentSubcatId) {
      const label =
        fallbackCatName && fallbackSubcatName
          ? `${fallbackCatName} / ${fallbackSubcatName}`
          : fallbackSubcatName || fallbackCatName || "Selected Category / Subcategory";

      return {
        value: currentSubcatId ? `sub_${currentSubcatId}` : `cat_${currentCatId}`,
        label,
        category_id: currentCatId,
        subcategory_id: currentSubcatId || null,
        categoryName: fallbackCatName || "Category",
        subcategoryName: fallbackSubcatName || "",
        isCategoryOnly: !currentSubcatId,
      };
    }

    return null;
  }, [groupedOptions, formData.category_id, formData.subcategory_id, service]);

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

  const handleDropdownSelect = (selected: CategorySubcategoryOption | null) => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        category_id: selected.category_id,
        subcategory_id: selected.subcategory_id || "",
        ccategory_id: selected.category_id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        category_id: "",
        subcategory_id: "",
        ccategory_id: "",
      }));
    }

    if (validationErrors.category_id) {
      setValidationErrors((prev) => ({ ...prev, category_id: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const catId =
      typeof formData.category_id === "string"
        ? formData.category_id.trim()
        : formData.category_id?.id || formData.category_id?._id || "";

    const subcatId =
      typeof formData.subcategory_id === "string"
        ? formData.subcategory_id.trim()
        : formData.subcategory_id?.id || formData.subcategory_id?._id || "";

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

            <Col xs={12}>
              <FormLabel className="fw-semibold">
                Category & Subcategory <span className="text-danger">*</span>
              </FormLabel>
              <Select<CategorySubcategoryOption, false, GroupedCategoryOption>
                instanceId="service-modal-category-select"
                options={groupedOptions}
                value={selectedCategoryOption}
                isLoading={categoriesLoading || subcategoriesLoading}
                isSearchable
                isClearable
                placeholder="Search & select category or subcategory..."
                noOptionsMessage={() => "No categories or subcategories found"}
                onChange={(selected) => handleDropdownSelect(selected as CategorySubcategoryOption | null)}
                filterOption={(candidate, input) => {
                  if (!input) return true;
                  const search = input.toLowerCase().trim();
                  const data = candidate.data as CategorySubcategoryOption;
                  return (
                    (data.categoryName || "").toLowerCase().includes(search) ||
                    (data.subcategoryName || "").toLowerCase().includes(search) ||
                    (candidate.label || "").toLowerCase().includes(search)
                  );
                }}
                formatOptionLabel={(option, { context }) => {
                  if (context === "value") {
                    return (
                      <div className="d-flex align-items-center gap-1">
                        <span className="fw-semibold text-dark">{option.categoryName}</span>
                        {option.subcategoryName && (
                          <>
                            <span className="text-muted mx-1">/</span>
                            <span className="text-primary fw-medium">
                              {option.subcategoryName}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="d-flex align-items-center justify-content-between py-1">
                      <div className="d-flex align-items-center gap-1">
                        {option.isCategoryOnly ? (
                          <span className="text-dark fw-medium">{option.label}</span>
                        ) : (
                          <span className="ps-2 text-dark">↳ {option.label}</span>
                        )}
                      </div>
                      <span
                        className={`badge ${
                          option.isCategoryOnly
                            ? "bg-secondary-subtle text-secondary"
                            : "bg-info-subtle text-info"
                        } fs-11`}
                      >
                        {option.isCategoryOnly ? "Category" : "Subcategory"}
                      </span>
                    </div>
                  );
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
                  groupHeading: (base) => ({
                    ...base,
                    fontWeight: 700,
                    fontSize: "12px",
                    color: "#3e60d5",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    backgroundColor: "#f8f9fa",
                    padding: "6px 12px",
                    margin: 0,
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
