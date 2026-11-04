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
  addCity,
  updateCity,
  fetchCity,
  CityRecord,
} from "@/redux/slices/admin/citySlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";

interface CityFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

interface CountryOption {
  value: string;
  label: string;
}

const CityForm: React.FC<CityFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.city || { records: [] }
  );

  const { records: countriesList, loading: countriesLoading } = useAppSelector(
    (s: any) => s.countries || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<CityRecord>({
    id: recordId || "",
    country_id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchCity());
    }
    if (countriesList.length === 0) {
      dispatch(fetchCountries());
    }
  }, [dispatch, records.length, countriesList.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: CityRecord) => (r.id || r._id) === recordId);
      if (found) {
        let initialCountryId = "";
        if (typeof found.country_id === "object" && found.country_id) {
          initialCountryId = found.country_id.id || found.country_id._id || "";
        } else if (typeof found.country_id === "string") {
          initialCountryId = found.country_id;
        }

        setFormData({
          ...found,
          id: found.id || found._id || recordId,
          country_id: initialCountryId,
          name: found.name || "",
          description: found.description || "",
          isActive: found.isActive !== undefined ? found.isActive : true,
        });
      }
    }
  }, [isEdit, recordId, records]);

  const countryOptions: CountryOption[] = useMemo(() => {
    return countriesList
      .filter(
        (c: CountriesRecord) =>
          c.isActive !== false || (c.id || c._id) === formData.country_id
      )
      .map((c: CountriesRecord) => ({
        value: c.id || c._id || "",
        label: c.name || "",
      }));
  }, [countriesList, formData.country_id]);

  const selectedCountryOption = useMemo(() => {
    if (!formData.country_id) return null;
    const currentId =
      typeof formData.country_id === "string" ? formData.country_id : "";
    const matched = countryOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;

    if (currentId) {
      const foundInRecords = records.find((r: CityRecord) => (r.id || r._id) === recordId);
      const fallbackName =
        typeof foundInRecords?.country_id === "object" && foundInRecords?.country_id?.name
          ? foundInRecords.country_id.name
          : "";
      return {
        value: currentId,
        label: fallbackName || "Selected Country",
      };
    }
    return null;
  }, [countryOptions, formData.country_id, records, recordId]);

  const handleChange = (field: keyof CityRecord, value: any) => {
    setFormData((prev: CityRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
    if (field === "country_id" && validationErrors.country_id) {
      setValidationErrors((prev) => ({ ...prev, country_id: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const countryId = typeof formData.country_id === "string" ? formData.country_id.trim() : "";
    if (!countryId) {
      errors.country_id = "Country is required";
    }

    if (!formData.name?.trim()) {
      errors.name = "City name is required";
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
          updateCity({
            ...formData,
            id: formData.id || recordId,
            country_id: countryId,
          })
        ).unwrap();
      } else {
        const { id, _id, ...payload } = formData;
        await dispatch(
          addCity({
            ...payload,
            country_id: countryId,
          })
        ).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/city`);
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
        title={isEdit ? "Update City" : "Create City"}
        subtitle="City"
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
                  {isEdit ? "Update City" : "Add City"}
                </h5>
                <Link href={`/admin/city`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Country <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<CountryOption>
                      instanceId="city-form-country-select"
                      options={countryOptions}
                      value={selectedCountryOption}
                      isLoading={countriesLoading}
                      isSearchable
                      isClearable
                      placeholder="Search & select country..."
                      noOptionsMessage={() => "No countries found"}
                      onChange={(selected) => {
                        const val = selected ? selected.value : "";
                        handleChange("country_id", val);
                      }}
                      styles={{
                        control: (base, stateStyle) => ({
                          ...base,
                          minHeight: "38px",
                          borderColor: validationErrors.country_id
                            ? "#f1556c"
                            : stateStyle.isFocused
                            ? "#3e60d5"
                            : "#dee2e6",
                          boxShadow: stateStyle.isFocused
                            ? "0 0 0 0.15rem rgba(62, 96, 213, 0.25)"
                            : "none",
                          "&:hover": {
                            borderColor: validationErrors.country_id ? "#f1556c" : "#3e60d5",
                          },
                        }),
                      }}
                    />
                    {validationErrors.country_id && (
                      <div className="text-danger fs-12 mt-1">
                        {validationErrors.country_id}
                      </div>
                    )}
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      City Name <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="Enter city name..."
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
                  <Link href={`/admin/city`} className="btn btn-light px-4">
                    Cancel
                  </Link>
                  <Button type="submit" variant="primary" className="px-4 fw-semibold">
                    <Icon icon={isEdit ? "save" : "plus"} className="me-1" />
                    {isEdit ? "Save Changes" : "Create City"}
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

export default CityForm;
