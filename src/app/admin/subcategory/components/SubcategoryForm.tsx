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
  addSubcategory,
  updateSubcategory,
  fetchSubcategorys,
  SubcategoryRecord,
} from "@/redux/slices/admin/subcategorySlice";
import { fetchCategorys, CategoryRecord } from "@/redux/slices/admin/categorySlice";

interface SubcategoryFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

const SubcategoryForm: React.FC<SubcategoryFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.subcategory || { records: [] }
  );

  const { records: categoryList, loading: categoriesLoading } = useAppSelector(
    (state: any) => state.category || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<SubcategoryRecord>({
    id: recordId || "",
    category_id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchSubcategorys());
    }
    if (categoryList.length === 0) {
      dispatch(fetchCategorys());
    }
  }, [dispatch, records.length, categoryList.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: SubcategoryRecord) => (r.id || r._id) === recordId);
      if (found) {
        let initialCategoryId = "";
        if (typeof found.category_id === "object" && found.category_id) {
          initialCategoryId = found.category_id.id || found.category_id._id || "";
        } else if (typeof found.category_id === "string") {
          initialCategoryId = found.category_id;
        }

        setFormData({
          ...found,
          id: found.id || found._id || recordId,
          category_id: initialCategoryId,
        });
      }
    }
  }, [isEdit, recordId, records]);

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
    return null;
  }, [categoryOptions, formData.category_id]);

  const handleChange = (field: keyof SubcategoryRecord, value: any) => {
    setFormData((prev: SubcategoryRecord) => ({ ...prev, [field]: value }));
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
      errors.name = "Subcategory name is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields.");
      return;
    }
    setValidationErrors({});
    setErrorMessage("");

    try {
      if (isEdit && (formData.id || recordId)) {
        await dispatch(
          updateSubcategory({
            ...formData,
            id: formData.id || recordId,
            category_id: catId,
          })
        ).unwrap();
      } else {
        const { id, _id, ...payload } = formData;
        await dispatch(
          addSubcategory({
            ...payload,
            category_id: catId,
          })
        ).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/subcategory`);
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
        title={isEdit ? "Update Subcategory" : "Create Subcategory"}
        subtitle="Subcategory"
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
                  {isEdit ? "Update Subcategory" : "Add Subcategory"}
                </h5>
                <Link href={`/admin/subcategory`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Category <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<CategoryOption>
                      instanceId="subcategory-form-category-select"
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
                      Name <span className="text-danger">*</span>
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
                  <Link href={`/admin/subcategory`} className="btn btn-light px-4">
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

export default SubcategoryForm;
