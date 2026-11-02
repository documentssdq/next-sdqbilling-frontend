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
  FormSelect,
  FormCheck,
  Alert,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { PartyRecord } from "@/redux/slices/admin/partySlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";
import { fetchState, StateRecord } from "@/redux/slices/admin/stateSlice";

const INDIAN_MOBILE_REGEX = /^(?:(?:\+91|91|0)[\s-]?)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PartyModalProps {
  show: boolean;
  onHide: () => void;
  party: PartyRecord | null;
  onSave: (record: PartyRecord) => Promise<void>;
}

interface DropdownOption {
  value: string;
  label: string;
}

const PartyModal: React.FC<PartyModalProps> = ({
  show,
  onHide,
  party,
  onSave,
}) => {
  const dispatch = useAppDispatch();
  const isEdit = !!party;

  const { records: countriesList, loading: countriesLoading } = useAppSelector(
    (s: any) => s.countries || { records: [], loading: false }
  );
  const { records: stateList, loading: statesLoading } = useAppSelector(
    (s: any) => s.state || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<PartyRecord>({
    id: "",
    name: "",
    partyType: "customer",
    phone: "",
    email: "",
    gstin: "",
    country_id: "",
    state_id: "",
    city: "",
    state: "",
    address: "",
    description: "",
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      if (countriesList.length === 0) dispatch(fetchCountries());
      if (stateList.length === 0) dispatch(fetchState());
    }
  }, [dispatch, show, countriesList.length, stateList.length]);

  useEffect(() => {
    if (party) {
      let initialCountryId = "";
      if (typeof party.country_id === "object" && party.country_id) {
        initialCountryId = party.country_id.id || party.country_id._id || "";
      } else if (typeof party.country_id === "string") {
        initialCountryId = party.country_id;
      }

      let initialStateId = "";
      if (typeof party.state_id === "object" && party.state_id) {
        initialStateId = party.state_id.id || party.state_id._id || "";
      } else if (typeof party.state_id === "string") {
        initialStateId = party.state_id;
      }

      // If country is not set on party but state_id is available, find country from stateList
      if (!initialCountryId && initialStateId && stateList.length > 0) {
        const matchedState = stateList.find((s: any) => (s.id || s._id) === initialStateId);
        if (matchedState?.country_id) {
          initialCountryId =
            typeof matchedState.country_id === "object"
              ? (matchedState.country_id.id || matchedState.country_id._id || "")
              : matchedState.country_id;
        }
      }

      setFormData({
        id: party.id || party._id || "",
        _id: party._id || party.id || "",
        name: party.name || "",
        partyType: party.partyType || "customer",
        phone: party.phone || "",
        email: party.email || "",
        gstin: party.gstin || "",
        country_id: initialCountryId,
        state_id: initialStateId,
        city: party.city || "",
        state: party.state || "",
        address: party.address || "",
        description: party.description || "",
        isActive: party.isActive !== undefined ? party.isActive : true,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        partyType: "customer",
        phone: "",
        email: "",
        gstin: "",
        country_id: "",
        state_id: "",
        city: "",
        state: "",
        address: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [party, show, stateList]);

  // Country Options
  const countryOptions: DropdownOption[] = useMemo(() => {
    return countriesList
      .filter((c: CountriesRecord) => c.isActive !== false || (c.id || c._id) === formData.country_id)
      .map((c: CountriesRecord) => ({
        value: c.id || c._id || "",
        label: c.name || "",
      }));
  }, [countriesList, formData.country_id]);

  // Dependent State Options: Filtered by selected country_id
  const stateOptions: DropdownOption[] = useMemo(() => {
    if (!formData.country_id) return [];
    return stateList
      .filter((s: StateRecord) => {
        const sCountryId =
          typeof s.country_id === "object" && s.country_id
            ? (s.country_id.id || s.country_id._id)
            : s.country_id;
        return (
          sCountryId === formData.country_id &&
          (s.isActive !== false || (s.id || s._id) === formData.state_id)
        );
      })
      .map((s: StateRecord) => ({
        value: s.id || s._id || "",
        label: s.name || "",
      }));
  }, [stateList, formData.country_id, formData.state_id]);

  const selectedCountryOption = useMemo(() => {
    if (!formData.country_id) return null;
    const currentId = typeof formData.country_id === "string" ? formData.country_id : "";
    const matched = countryOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;
    if (currentId) {
      const fallbackName =
        typeof party?.country_id === "object" && party?.country_id?.name
          ? party.country_id.name
          : "";
      return { value: currentId, label: fallbackName || "Selected Country" };
    }
    return null;
  }, [countryOptions, formData.country_id, party]);

  const selectedStateOption = useMemo(() => {
    if (!formData.state_id) return null;
    const currentId = typeof formData.state_id === "string" ? formData.state_id : "";
    const matched = stateOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;
    if (currentId) {
      const fallbackName =
        typeof party?.state_id === "object" && party?.state_id?.name
          ? party.state_id.name
          : formData.state || "";
      return { value: currentId, label: fallbackName || "Selected State" };
    }
    return null;
  }, [stateOptions, formData.state_id, party, formData.state]);

  const handleCountryChange = (selected: DropdownOption | null) => {
    const newCountryId = selected ? selected.value : "";
    setFormData((prev) => {
      let nextStateId = prev.state_id;
      let nextStateName = prev.state;
      // If current state doesn't belong to the new country, reset state
      if (nextStateId) {
        const st = stateList.find((s: any) => (s.id || s._id) === nextStateId);
        const stCountryId =
          typeof st?.country_id === "object" && st?.country_id
            ? (st.country_id.id || st.country_id._id)
            : st?.country_id;
        if (stCountryId !== newCountryId) {
          nextStateId = "";
          nextStateName = "";
        }
      }
      return {
        ...prev,
        country_id: newCountryId,
        state_id: nextStateId,
        state: nextStateName,
      };
    });
    if (validationErrors.country_id) {
      setValidationErrors((prev) => ({ ...prev, country_id: "" }));
    }
  };

  const handleStateChange = (selected: DropdownOption | null) => {
    const newStateId = selected ? selected.value : "";
    const newStateName = selected ? selected.label : "";
    setFormData((prev) => ({
      ...prev,
      state_id: newStateId,
      state: newStateName,
    }));
    if (validationErrors.state_id) {
      setValidationErrors((prev) => ({ ...prev, state_id: "" }));
    }
  };

  const handleChange = (field: keyof PartyRecord, value: any) => {
    setFormData((prev: PartyRecord) => ({ ...prev, [field]: value }));
    const fieldKey = String(field);
    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = "Party name is required";
    }

    if (!formData.partyType?.trim()) {
      errors.partyType = "Party type is required";
    }

    if (!formData.phone?.trim()) {
      errors.phone = "Phone / Mobile number is required";
    } else if (!INDIAN_MOBILE_REGEX.test(formData.phone.trim())) {
      errors.phone =
        "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210)";
    }

    if (!formData.email?.trim()) {
      errors.email = "Email address is required";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address (e.g. contact@example.com)";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields correctly.");
      return;
    }

    setValidationErrors({});
    setErrorMessage("");
    setSubmitting(true);

    try {
      await onSave({
        ...formData,
        country_id: formData.country_id || null,
        state_id: formData.state_id || null,
        city: formData.city?.trim() || "",
        state: formData.state || "",
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
        setErrorMessage(err?.message || "Failed to save party.");
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
            {isEdit ? `Edit Party: ${party?.name || ""}` : "Add New Party"}
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
            <Col md={8}>
              <FormLabel className="fw-semibold">
                Party / Company Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. Acme Corporation"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                isInvalid={!!validationErrors.name}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.name}
              </FormControl.Feedback>
            </Col>

            <Col md={4}>
              <FormLabel className="fw-semibold">
                Party Type <span className="text-danger">*</span>
              </FormLabel>
              <FormSelect
                value={formData.partyType || "customer"}
                onChange={(e) => handleChange("partyType", e.target.value)}
                isInvalid={!!validationErrors.partyType}
              >
                <option value="customer">Customer (Debtor)</option>
                <option value="vendor">Vendor / Supplier (Creditor)</option>
                <option value="both">Both (Customer & Vendor)</option>
              </FormSelect>
              <FormControl.Feedback type="invalid">
                {validationErrors.partyType}
              </FormControl.Feedback>
            </Col>

            <Col md={6}>
              <FormLabel className="fw-semibold">
                Mobile <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="Enter mobile number."
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                isInvalid={!!validationErrors.phone}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.phone}
              </FormControl.Feedback>
            </Col>

            <Col md={6}>
              <FormLabel className="fw-semibold">
                Email Address <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="email"
                placeholder="Enter email address."
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                isInvalid={!!validationErrors.email}
              />
              <FormControl.Feedback type="invalid">
                {validationErrors.email}
              </FormControl.Feedback>
            </Col>

            <Col md={12}>
              <FormLabel className="fw-semibold">GST No</FormLabel>
              <FormControl
                type="text"
                placeholder="Enter GST No."
                value={formData.gstin || ""}
                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
              />
            </Col>

            {/* Country, Dependent State, and City */}
            <Col md={4}>
              <FormLabel className="fw-semibold">Country</FormLabel>
              <Select<DropdownOption>
                instanceId="party-country-select"
                options={countryOptions}
                value={selectedCountryOption}
                isLoading={countriesLoading}
                isSearchable
                isClearable
                placeholder="Search & select country..."
                noOptionsMessage={() => "No countries found"}
                onChange={handleCountryChange}
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

            <Col md={4}>
              <FormLabel className="fw-semibold">State</FormLabel>
              <Select<DropdownOption>
                instanceId="party-state-select"
                options={stateOptions}
                value={selectedStateOption}
                isLoading={statesLoading}
                isSearchable
                isClearable
                isDisabled={!formData.country_id}
                placeholder={
                  formData.country_id
                    ? "Search & select state..."
                    : "Select country first..."
                }
                noOptionsMessage={() =>
                  formData.country_id ? "No states found" : "Select country first"
                }
                onChange={handleStateChange}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, stateStyle) => ({
                    ...base,
                    minHeight: "38px",
                    borderColor: validationErrors.state_id
                      ? "#f1556c"
                      : stateStyle.isFocused
                      ? "#3e60d5"
                      : "#dee2e6",
                    boxShadow: stateStyle.isFocused
                      ? "0 0 0 0.15rem rgba(62, 96, 213, 0.25)"
                      : "none",
                    "&:hover": {
                      borderColor: validationErrors.state_id ? "#f1556c" : "#3e60d5",
                    },
                  }),
                }}
              />
              {validationErrors.state_id && (
                <div className="text-danger fs-12 mt-1">
                  {validationErrors.state_id}
                </div>
              )}
            </Col>

            <Col md={4}>
              <FormLabel className="fw-semibold">City</FormLabel>
              <FormControl
                type="text"
                placeholder="Enter city name..."
                value={formData.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold">Billing Address</FormLabel>
              <FormControl
                as="textarea"
                rows={2}
                placeholder="Enter complete billing address..."
                value={formData.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold">Notes / Description</FormLabel>
              <FormControl
                as="textarea"
                rows={2}
                placeholder="Optional notes or remarks..."
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </Col>

            <Col xs={12}>
              <FormLabel className="fw-semibold mb-2 d-block">Status</FormLabel>
              <FormCheck
                type="switch"
                id="party-status-switch"
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
                {isEdit ? "Save Changes" : "Create Party"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default PartyModal;
