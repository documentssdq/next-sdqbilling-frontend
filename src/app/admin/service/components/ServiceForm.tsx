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

export interface DropdownOption {
  value: string;
  label: string;
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
          catId = (found.category_id as any).id || (found.category_id as any)._id || "";
        } else if (typeof found.category_id === "string") {
          catId = found.category_id;
        } else if (found.ccategory_id) {
          catId = found.ccategory_id;
        }

        let subcatId = "";
        if (typeof found.subcategory_id === "object" && found.subcategory_id) {
          subcatId = (found.subcategory_id as any).id || (found.subcategory_id as any)._id || "";
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

    const foundInRecords = records.find(
      (r: ServiceRecord) => (r.id || r._id) === (formData.id || recordId)
    );
    const fallbackCatName =
      typeof foundInRecords?.category_id === "object" && foundInRecords?.category_id?.name
        ? foundInRecords.category_id.name
        : "";

    return {
      value: selectedCategoryId,
      label: fallbackCatName || "Selected Category",
    };
  }, [categoryOptions, selectedCategoryId, records, formData.id, recordId]);

  // Selected Subcategory Option object for react-select
  const selectedSubcategoryOption = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    const found = subcategoryOptions.find((opt) => opt.value === selectedSubcategoryId);
    if (found) return found;

    const foundInRecords = records.find(
      (r: ServiceRecord) => (r.id || r._id) === (formData.id || recordId)
    );
    const fallbackSubcatName =
      typeof foundInRecords?.subcategory_id === "object" && foundInRecords?.subcategory_id?.name
        ? foundInRecords.subcategory_id.name
        : "";

    return {
      value: selectedSubcategoryId,
      label: fallbackSubcatName || "Selected Subcategory",
    };
  }, [subcategoryOptions, selectedSubcategoryId, records, formData.id, recordId]);

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

                  {/* Category Field */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Category <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<DropdownOption>
                      instanceId="service-form-category-select"
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
                      instanceId="service-form-subcategory-select"
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