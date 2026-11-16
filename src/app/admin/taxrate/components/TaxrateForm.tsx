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
  FormSelect,
  Row,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addTaxrate,
  updateTaxrate,
  fetchTaxrate,
  TaxrateRecord,
  TAX_TYPES,
} from "@/redux/slices/admin/taxrateSlice";

interface TaxrateFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

const TaxrateForm: React.FC<TaxrateFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.taxrate || { records: [] }
  );

  const [formData, setFormData] = useState<TaxrateRecord>({
    id: recordId || "",
    name: "",
    rate: 0,
    taxType: "GST",
    isDefault: false,
    description: "",
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchTaxrate());
    }
  }, [dispatch, records.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: TaxrateRecord) => (r.id || r._id) === recordId);
      if (found) {
        setFormData({
          ...found,
          id: found.id || found._id || recordId,
          name: found.name || "",
          rate: found.rate !== undefined && found.rate !== null ? found.rate : 0,
          taxType: found.taxType || "GST",
          isDefault: !!found.isDefault,
          description: found.description || "",
          isActive: found.isActive !== undefined ? found.isActive : true,
        });
      }
    }
  }, [isEdit, recordId, records]);

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

    if (formData.rate === undefined || formData.rate === null || formData.rate === ("" as any) || isNaN(Number(formData.rate))) {
      errors.rate = "Tax rate percentage is required";
    } else if (Number(formData.rate) < 0 || Number(formData.rate) > 100) {
      errors.rate = "Tax rate must be between 0% and 100%";
    }

    if (!formData.taxType) {
      errors.taxType = "Tax type is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields correctly.");
      return;
    }

    setValidationErrors({});
    setErrorMessage("");

    try {
      const payload: TaxrateRecord = {
        ...formData,
        rate: Number(formData.rate),
        name: formData.name?.trim(),
      };

      if (isEdit && (formData.id || recordId)) {
        await dispatch(updateTaxrate({ ...payload, id: formData.id || recordId })).unwrap();
      } else {
        const { id, _id, ...createPayload } = payload;
        await dispatch(addTaxrate(createPayload)).unwrap();
      }

      await dispatch(fetchTaxrate());
      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/taxrate`);
      }, 1000);
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
        subtitle="Taxrate"
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
                  {isEdit ? "Update Tax Rate" : "Add Tax Rate"}
                </h5>
                <Link href={`/admin/taxrate`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={6}>
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

                  <Col md={6}>
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
                      <span className="input-group-text bg-light text-muted fw-bold">
                        %
                      </span>
                      <FormControl.Feedback type="invalid">
                        {validationErrors.rate}
                      </FormControl.Feedback>
                    </div>
                    <div className="form-text text-muted">
                      Enter a percentage between 0 and 100
                    </div>
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold mb-2 d-block">
                      Default Rate
                    </FormLabel>
                    <FormCheck
                      type="switch"
                      id="taxrate-isdefault-switch"
                      label={
                        <span>
                          Set as default for{" "}
                          <strong className="text-primary">
                            {formData.taxType || "GST"}
                          </strong>
                        </span>
                      }
                      checked={!!formData.isDefault}
                      onChange={(e) => handleChange("isDefault", e.target.checked)}
                      className="fs-15 fw-semibold mt-2"
                    />
                    <div className="form-text text-muted">
                      If enabled, this will be automatically selected for new transactions.
                    </div>
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">Description</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={3}
                      placeholder="Optional notes or details about this tax rate..."
                      value={formData.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </Col>

                  <Col md={6}>
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
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Link href={`/admin/taxrate`} className="btn btn-light px-4">
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

export default TaxrateForm;
