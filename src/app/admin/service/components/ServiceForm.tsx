"use client";
import React, { useEffect, useState, useMemo } from "react";
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
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addService,
  updateService,
  fetchServices,
  ServiceRecord,
} from "@/redux/slices/admin/serviceSlice";
import { fetchCategorys, CategoryRecord } from "@/redux/slices/admin/categorySlice";
import { fetchSubcategorys, SubcategoryRecord } from "@/redux/slices/admin/subcategorySlice";

interface ServiceFormProps {
  mode: "add" | "edit";
  recordId?: string;
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

const ServiceForm: React.FC<ServiceFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.service || state.Service || { records: [] }
  );
  const { records: categoryList, loading: categoriesLoading } = useAppSelector(
    (state: any) => state.category || { records: [], loading: false }
  );
  const { records: subcategoryList, loading: subcategoriesLoading } = useAppSelector(
    (state: any) => state.subcategory || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<ServiceRecord>({
    id: recordId || "",
    category_id: "",
    subcategory_id: "",
    ccategory_id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchServices());
    }
    if (categoryList.length === 0) {
      dispatch(fetchCategorys());
    }
    if (subcategoryList.length === 0) {
      dispatch(fetchSubcategorys());
    }
  }, [dispatch, records.length, categoryList.length, subcategoryList.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: ServiceRecord) => (r.id || r._id) === recordId);
      if (found) {
        let catId = "";
        if (typeof found.category_id === "object" && found.category_id) {
          catId = found.category_id.id || found.category_id._id || "";
        } else if (typeof found.category_id === "string") {
          catId = found.category_id;
        } else if (found.ccategory_id) {
          catId = found.ccategory_id;
        }

        let subcatId = "";
        if (typeof found.subcategory_id === "object" && found.subcategory_id) {
          subcatId = found.subcategory_id.id || found.subcategory_id._id || "";
        } else if (typeof found.subcategory_id === "string") {
          subcatId = found.subcategory_id;
        }

        setFormData({
          ...found,
          id: found.id || found._id || recordId,
          category_id: catId,
          subcategory_id: subcatId,
          ccategory_id: catId,
          name: found.name || "",
          description: found.description || "",
          isActive: found.isActive !== undefined ? found.isActive : true,
        });
      }
    }
  }, [isEdit, recordId, records]);

  const groupedOptions: GroupedCategoryOption[] = useMemo(() => {
    const groups: GroupedCategoryOption[] = [];

    const activeCategories = categoryList.filter(
      (cat: CategoryRecord) =>
        cat.isActive !== false || (cat.id || cat._id) === formData.category_id
    );

    activeCategories.forEach((cat: CategoryRecord) => {
      const catId = cat.id || cat._id || "";
      const catName = cat.name || "Unnamed Category";

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

    const foundInRecords = records.find(
      (r: ServiceRecord) => (r.id || r._id) === (formData.id || recordId)
    );
    const fallbackCatName =
      typeof foundInRecords?.category_id === "object" && foundInRecords?.category_id?.name
        ? foundInRecords.category_id.name
        : "";
    const fallbackSubcatName =
      typeof foundInRecords?.subcategory_id === "object" && foundInRecords?.subcategory_id?.name
        ? foundInRecords.subcategory_id.name
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
  }, [groupedOptions, formData.category_id, formData.subcategory_id, records, formData.id, recordId]);

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

    if (!catId) errors.category_id = "Category is required";
    if (!formData.name?.trim()) errors.name = "Service name is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields.");
      return;
    }
    setValidationErrors({});
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        category_id: catId,
        subcategory_id: subcatId || null,
        ccategory_id: catId,
      };

      if (isEdit && (formData.id || recordId)) {
        await dispatch(updateService({ ...payload, id: formData.id || recordId })).unwrap();
      } else {
        const { id, _id, ...body } = payload;
        await dispatch(addService(body)).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/service`);
      }, 1200);
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
        setErrorMessage(err?.message || "Failed to save record.");
      }
    }
  };

  return (
    <>
      <PageBreadcrumb title={isEdit ? "Edit Service" : "Add New Service"} subtitle="Service Management" />

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
                <h5 className="mb-0 fw-bold">{isEdit ? "Update Service Details" : "Create New Service"}</h5>
                <Link href={`/admin/service`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Category & Subcategory <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<CategorySubcategoryOption, false, GroupedCategoryOption>
                      instanceId="service-form-category-select"
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
                      styles={{
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

                  <Col md={6}>
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
                    <FormControl.Feedback type="invalid">{validationErrors.name}</FormControl.Feedback>
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">Description</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={3}
                      placeholder="Describe this service..."
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
                  <Link href={`/admin/service`} className="btn btn-light px-4">
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

export default ServiceForm;
