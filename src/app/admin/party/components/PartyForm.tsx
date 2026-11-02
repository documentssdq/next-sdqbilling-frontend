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
  FormSelect,
  Row,
} from "react-bootstrap";
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addParty,
  updateParty,
  fetchPartys,
  PartyRecord,
} from "@/redux/slices/admin/partySlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";
import { fetchState, StateRecord } from "@/redux/slices/admin/stateSlice";

const INDIAN_MOBILE_REGEX = /^(?:(?:\+91|91|0)[\s-]?)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PartyFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

const PartyForm: React.FC<PartyFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector(
    (state: any) => state.party || { records: [] }
  );
  const { records: countriesList, loading: countriesLoading } = useAppSelector(
    (s: any) => s.countries || { records: [], loading: false }
  );
  const { records: stateList, loading: statesLoading } = useAppSelector(
    (s: any) => s.state || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<PartyRecord>({
    id: recordId || "",
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

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchPartys());
    }
    if (countriesList.length === 0) {
      dispatch(fetchCountries());
    }
    if (stateList.length === 0) {
      dispatch(fetchState());
    }
  }, [dispatch, records.length, countriesList.length, stateList.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r: PartyRecord) => (r.id || r._id) === recordId);
      if (found) {
        let initialCountryId = "";
        if (typeof found.country_id === "object" && found.country_id) {
          initialCountryId = found.country_id.id || found.country_id._id || "";
        } else if (typeof found.country_id === "string") {
          initialCountryId = found.country_id;
        }

        let initialStateId = "";
        if (typeof found.state_id === "object" && found.state_id) {
          initialStateId = found.state_id.id || found.state_id._id || "";
        } else if (typeof found.state_id === "string") {
          initialStateId = found.state_id;
        }

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
          ...found,
          id: found.id || found._id || recordId,
          country_id: initialCountryId,
          state_id: initialStateId,
        });
      }
    }
  }, [isEdit, recordId, records, stateList]);

  // Country Options
  const countryOptions: DropdownOption[] = useMemo(() => {
    return countriesList
      .filter((c: CountriesRecord) => c.isActive !== false || (c.id || c._id) === formData.country_id)
      .map((c: CountriesRecord) => ({
        value: c.id || c._id || "",
        label: c.name || "",
      }));
  }, [countriesList, formData.country_id]);

  // Dependent State Options
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
    return null;
  }, [countryOptions, formData.country_id]);

  const selectedStateOption = useMemo(() => {
    if (!formData.state_id) return null;
    const currentId = typeof formData.state_id === "string" ? formData.state_id : "";
    const matched = stateOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;
    return null;
  }, [stateOptions, formData.state_id]);

  const handleCountryChange = (selected: DropdownOption | null) => {
    const newCountryId = selected ? selected.value : "";
    setFormData((prev) => {
      let nextStateId = prev.state_id;
      let nextStateName = prev.state;
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
  };

  const handleStateChange = (selected: DropdownOption | null) => {
    const newStateId = selected ? selected.value : "";
    const newStateName = selected ? selected.label : "";
    setFormData((prev) => ({
      ...prev,
      state_id: newStateId,
      state: newStateName,
    }));
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

    try {
      const payloadData = {
        ...formData,
        country_id: formData.country_id || null,
        state_id: formData.state_id || null,
        city: formData.city?.trim() || "",
        state: formData.state || "",
      };

      if (isEdit && (formData.id || recordId)) {
        await dispatch(
          updateParty({ ...payloadData, id: formData.id || recordId })
        ).unwrap();
      } else {
        const { id, _id, ...createPayload } = payloadData;
        await dispatch(addParty(createPayload)).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/party`);
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
        title={isEdit ? "Edit Party" : "Add New Party"}
        subtitle="Party Management"
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
                  {isEdit ? "Update Party Details" : "Create New Party"}
                </h5>
                <Link href={`/admin/party`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
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
                      Phone / Mobile <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. 9876543210 or +91 9876543210"
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
                      placeholder="e.g. contact@acme.com"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      isInvalid={!!validationErrors.email}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.email}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">GSTIN / Tax ID</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formData.gstin || ""}
                      onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    />
                  </Col>

                  {/* Country, Dependent State, and City */}
                  <Col md={4}>
                    <FormLabel className="fw-semibold">Country</FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-country-select"
                      options={countryOptions}
                      value={selectedCountryOption}
                      isLoading={countriesLoading}
                      isSearchable
                      isClearable
                      placeholder="Search & select country..."
                      noOptionsMessage={() => "No countries found"}
                      onChange={handleCountryChange}
                      styles={{
                        control: (base, stateStyle) => ({
                          ...base,
                          minHeight: "38px",
                          borderColor: stateStyle.isFocused ? "#3e60d5" : "#dee2e6",
                          boxShadow: stateStyle.isFocused
                            ? "0 0 0 0.15rem rgba(62, 96, 213, 0.25)"
                            : "none",
                          "&:hover": { borderColor: "#3e60d5" },
                        }),
                      }}
                    />
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">State</FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-state-select"
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
                      styles={{
                        control: (base, stateStyle) => ({
                          ...base,
                          minHeight: "38px",
                          borderColor: stateStyle.isFocused ? "#3e60d5" : "#dee2e6",
                          boxShadow: stateStyle.isFocused
                            ? "0 0 0 0.15rem rgba(62, 96, 213, 0.25)"
                            : "none",
                          "&:hover": { borderColor: "#3e60d5" },
                        }),
                      }}
                    />
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">City</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">Billing Address</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={2}
                      placeholder="Enter complete billing address..."
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </Col>

                  <Col md={12}>
                    <FormLabel className="fw-semibold">Notes / Description</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={2}
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
                  <Link href={`/admin/party`} className="btn btn-light px-4">
                    Cancel
                  </Link>
                  <Button type="submit" variant="primary" className="px-4 fw-semibold">
                    <Icon icon={isEdit ? "save" : "plus"} className="me-1" />
                    {isEdit ? "Save Changes" : "Create Party"}
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

export default PartyForm;
