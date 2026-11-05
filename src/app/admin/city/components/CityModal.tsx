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
import { CityRecord } from "@/redux/slices/admin/citySlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";

interface CityModalProps {
  show: boolean;
  onHide: () => void;
  city: CityRecord | null;
  onSave: (record: CityRecord) => Promise<void>;
}

interface CountryOption {
  value: string;
  label: string;
}

const CityModal: React.FC<CityModalProps> = ({
  show,
  onHide,
  city,
  onSave,
}) => {
  const dispatch = useAppDispatch();
  const isEdit = !!city;

  const { records: countriesList, loading: countriesLoading } = useAppSelector(
    (s: any) => s.countries || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<CityRecord>({
    id: "",
    country_id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show && countriesList.length === 0) {
      dispatch(fetchCountries());
    }
  }, [dispatch, show, countriesList.length]);

  useEffect(() => {
    if (city) {
      let initialCountryId = "";
      if (typeof city.country_id === "object" && city.country_id) {
        initialCountryId = city.country_id.id || city.country_id._id || "";
      } else if (typeof city.country_id === "string") {
        initialCountryId = city.country_id;
      }

      setFormData({
        id: city.id || city._id || "",
        _id: city._id || city.id || "",
        country_id: initialCountryId,
        name: city.name || "",
        description: city.description || "",
        isActive: city.isActive !== undefined ? city.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        country_id: "",
        name: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [city, show]);

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
      const fallbackName =
        typeof city?.country_id === "object" && city?.country_id?.name
          ? city.country_id.name
          : "";
      return {
        value: currentId,
        label: fallbackName || "Selected Country",
      };
    }
    return null;
  }, [countryOptions, formData.country_id, city]);

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
      setErrorMessage("");
      return;
    }

    setValidationErrors({});
    setErrorMessage("");
    setSubmitting(true);

    try {
      await onSave({
        ...formData,
        country_id: countryId,
      });
      onHide();
    } catch (err: any) {
      if (err?.errors && Array.isArray(err.errors)) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) {
            fieldErrors[e.field] = e.message;
          }
        });
        setValidationErrors(fieldErrors);
        setErrorMessage(err?.message || "Validation error: Please check fields.");
      } else {
        setErrorMessage(err?.message || "Failed to save city.");
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
            {isEdit ? `Edit City: ${city?.name || ""}` : "Add City"}
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

            <Col xs={12}>
              <FormLabel className="fw-semibold">
                Country <span className="text-danger">*</span>
              </FormLabel>
              <Select<CountryOption>
                instanceId="city-modal-country-select"
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
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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

            {/* <Col xs={12}>
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
            </Col> */}

            <Col xs={12}>
              <FormLabel className="fw-semibold mb-2 d-block">Status</FormLabel>
              <FormCheck
                type="switch"
                id="city-status-switch"
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
                {isEdit ? "Save Changes" : "Create City"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CityModal;
