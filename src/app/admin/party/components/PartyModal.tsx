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
import { fetchCity, CityRecord } from "@/redux/slices/admin/citySlice";

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
  const { records: citiesList, loading: citiesLoading } = useAppSelector(
    (s: any) => s.city || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<PartyRecord>({
    id: "",
    name: "",
    partyType: "customer",
    phone: "",
    email: "",
    taxType: "GST",
    currency: "INR",
    gstin: "",
    country_id: "",
    state_id: "",
    city_id: "",
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
      if (citiesList.length === 0) dispatch(fetchCity());
    }
  }, [dispatch, show, countriesList.length, stateList.length, citiesList.length]);

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

      let initialCityId = "";
      if (typeof party.city_id === "object" && party.city_id) {
        initialCityId = party.city_id.id || party.city_id._id || "";
      } else if (typeof party.city_id === "string") {
        initialCityId = party.city_id;
      } else if (party.city && citiesList.length > 0) {
        const matched = citiesList.find(
          (c: any) => (c.name || "").trim().toLowerCase() === party.city?.trim().toLowerCase()
        );
        if (matched) {
          initialCityId = matched.id || matched._id || "";
        }
      }

      // If country is not set on party but city_id is available, find country from citiesList
      if (!initialCountryId && initialCityId && citiesList.length > 0) {
        const matchedCity = citiesList.find((c: any) => (c.id || c._id) === initialCityId);
        if (matchedCity?.country_id) {
          initialCountryId =
            typeof matchedCity.country_id === "object"
              ? (matchedCity.country_id.id || matchedCity.country_id._id || "")
              : matchedCity.country_id;
        }
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
        taxType: party.taxType || party.tax_type || "GST",
        currency: party.currency || "INR",
        gstin: party.gstin || "",
        country_id: initialCountryId,
        state_id: initialStateId,
        city_id: initialCityId,
        city: party.city || (typeof party.city_id === "object" ? party.city_id?.name || "" : ""),
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
        taxType: "GST",
        currency: "INR",
        gstin: "",
        country_id: "",
        state_id: "",
        city_id: "",
        city: "",
        state: "",
        address: "",
        description: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setErrorMessage("");
  }, [party, show, stateList, citiesList]);

  // Tax Details & Currency Options
  const taxTypeOptions: DropdownOption[] = useMemo(
    () => [
      { value: "GST", label: "GST" },
      { value: "VAT", label: "VAT" },
    ],
    []
  );

  const currencyOptions: DropdownOption[] = useMemo(
    () => [
      { value: "INR", label: "INR - Indian Rupee (₹)" },
      { value: "USD", label: "USD - US Dollar ($)" },
      { value: "EUR", label: "EUR - Euro (€)" },
      { value: "GBP", label: "GBP - British Pound (£)" },
      { value: "AED", label: "AED - UAE Dirham (د.إ)" },
      { value: "SAR", label: "SAR - Saudi Riyal (﷼)" },
      { value: "CAD", label: "CAD - Canadian Dollar (C$)" },
      { value: "AUD", label: "AUD - Australian Dollar (A$)" },
      { value: "SGD", label: "SGD - Singapore Dollar (S$)" },
      { value: "QAR", label: "QAR - Qatari Riyal (QR)" },
      { value: "KWD", label: "KWD - Kuwaiti Dinar (KD)" },
      { value: "BHD", label: "BHD - Bahraini Dinar (BD)" },
      { value: "OMR", label: "OMR - Omani Rial (OMR)" },
      { value: "JPY", label: "JPY - Japanese Yen (¥)" },
      { value: "CNY", label: "CNY - Chinese Yuan (¥)" },
      { value: "CHF", label: "CHF - Swiss Franc (CHF)" },
      { value: "NZD", label: "NZD - New Zealand Dollar (NZ$)" },
      { value: "ZAR", label: "ZAR - South African Rand (R)" },
      { value: "MYR", label: "MYR - Malaysian Ringgit (RM)" },
      { value: "THB", label: "THB - Thai Baht (฿)" },
    ],
    []
  );

  const selectedTaxTypeOption = useMemo(() => {
    const val = formData.taxType || "GST";
    return taxTypeOptions.find((t) => t.value === val) || { value: val, label: val };
  }, [formData.taxType, taxTypeOptions]);

  const selectedCurrencyOption = useMemo(() => {
    const code = formData.currency || "INR";
    return currencyOptions.find((c) => c.value === code) || {
      value: code,
      label: code,
    };
  }, [formData.currency, currencyOptions]);

  const selectedCountryId = useMemo(() => {
    if (!formData.country_id) return "";
    if (typeof formData.country_id === "object") {
      return String(formData.country_id._id || formData.country_id.id || "");
    }
    return String(formData.country_id);
  }, [formData.country_id]);

  // Country Options
  const countryOptions: DropdownOption[] = useMemo(() => {
    return countriesList
      .filter((c: CountriesRecord) => c.isActive !== false || String(c.id || c._id) === selectedCountryId)
      .map((c: CountriesRecord) => ({
        value: String(c.id || c._id || ""),
        label: c.name || "",
      }));
  }, [countriesList, selectedCountryId]);

  // Dependent State Options: Filtered by selected country_id
  const stateOptions: DropdownOption[] = useMemo(() => {
    if (!selectedCountryId) return [];
    return stateList
      .filter((s: StateRecord) => {
        const sCountryId =
          typeof s.country_id === "object" && s.country_id
            ? String(s.country_id._id || s.country_id.id || "")
            : String(s.country_id || "");
        const currentSelectedStateId =
          typeof formData.state_id === "object" && formData.state_id
            ? String(formData.state_id._id || formData.state_id.id || "")
            : String(formData.state_id || "");
        const thisStateId = String(s.id || s._id || "");
        return (
          sCountryId === selectedCountryId &&
          (s.isActive !== false || thisStateId === currentSelectedStateId)
        );
      })
      .map((s: StateRecord) => ({
        value: String(s.id || s._id || ""),
        label: s.name || "",
      }));
  }, [stateList, selectedCountryId, formData.state_id]);

  // City Options: Strictly filtered against selected country_id
  const cityOptions: DropdownOption[] = useMemo(() => {
    if (!selectedCountryId) return [];
    return citiesList
      .filter((c: CityRecord) => {
        const cCountryId =
          typeof c.country_id === "object" && c.country_id
            ? String(c.country_id._id || c.country_id.id || "")
            : String(c.country_id || "");
        const currentCityId =
          typeof formData.city_id === "object" && formData.city_id
            ? String(formData.city_id._id || formData.city_id.id || "")
            : String(formData.city_id || "");
        const thisCityId = String(c.id || c._id || "");

        return (
          cCountryId === selectedCountryId &&
          (c.isActive !== false || thisCityId === currentCityId)
        );
      })
      .map((c: CityRecord) => ({
        value: String(c.id || c._id || ""),
        label: c.name || "",
      }));
  }, [citiesList, selectedCountryId, formData.city_id]);

  const selectedCountryOption = useMemo(() => {
    if (!selectedCountryId) return null;
    const matched = countryOptions.find((opt) => opt.value === selectedCountryId);
    if (matched) return matched;
    if (selectedCountryId) {
      const fallbackName =
        typeof party?.country_id === "object" && party?.country_id?.name
          ? party.country_id.name
          : "";
      return { value: selectedCountryId, label: fallbackName || "Selected Country" };
    }
    return null;
  }, [countryOptions, selectedCountryId, party]);

  const selectedStateOption = useMemo(() => {
    if (!formData.state_id) return null;
    const currentId =
      typeof formData.state_id === "object" && formData.state_id
        ? String(formData.state_id._id || formData.state_id.id || "")
        : String(formData.state_id);
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

  const selectedCityOption = useMemo(() => {
    if (!formData.city_id) return null;
    const currentId =
      typeof formData.city_id === "object" && formData.city_id
        ? String(formData.city_id._id || formData.city_id.id || "")
        : String(formData.city_id);
    const matched = cityOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;
    const fromFullList = citiesList.find((c: CityRecord) => String(c.id || c._id) === currentId);
    if (fromFullList) {
      return { value: currentId, label: fromFullList.name || "" };
    }
    if (currentId) {
      const fallbackName =
        typeof party?.city_id === "object" && party?.city_id?.name
          ? party.city_id.name
          : formData.city || "";
      return { value: currentId, label: fallbackName || "Selected City" };
    }
    return null;
  }, [cityOptions, citiesList, formData.city_id, party, formData.city]);

  const handleCountryChange = (selected: DropdownOption | null) => {
    const newCountryId = selected ? selected.value : "";
    setFormData((prev) => {
      let nextStateId = prev.state_id;
      let nextStateName = prev.state;
      // If current state doesn't belong to the new country, reset state
      if (nextStateId) {
        const st = stateList.find((s: any) => String(s.id || s._id) === String(nextStateId));
        const stCountryId =
          typeof st?.country_id === "object" && st?.country_id
            ? String(st.country_id._id || st.country_id.id || "")
            : String(st?.country_id || "");
        if (stCountryId !== newCountryId) {
          nextStateId = "";
          nextStateName = "";
        }
      }

      let nextCityId = prev.city_id;
      let nextCityName = prev.city;
      // If current city doesn't belong to the new country, reset city
      if (nextCityId) {
        const ct = citiesList.find((c: any) => String(c.id || c._id) === String(nextCityId));
        const ctCountryId =
          typeof ct?.country_id === "object" && ct?.country_id
            ? String(ct.country_id._id || ct.country_id.id || "")
            : String(ct?.country_id || "");
        if (!newCountryId || ctCountryId !== newCountryId) {
          nextCityId = "";
          nextCityName = "";
        }
      }

      return {
        ...prev,
        country_id: newCountryId,
        state_id: nextStateId,
        state: nextStateName,
        city_id: nextCityId,
        city: nextCityName,
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

  const handleCityChange = (selected: DropdownOption | null) => {
    const newCityId = selected ? selected.value : "";
    const newCityName = selected ? selected.label : "";
    setFormData((prev) => ({
      ...prev,
      city_id: newCityId,
      city: newCityName,
    }));
    if (validationErrors.city_id) {
      setValidationErrors((prev) => ({ ...prev, city_id: "" }));
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
        city_id: formData.city_id || null,
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
                placeholder="Enter party or company name."
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

            <Col md={4}>
              <FormLabel className="fw-semibold">Tax Details</FormLabel>
              <Select<DropdownOption>
                instanceId="party-modal-tax-type-select"
                options={taxTypeOptions}
                value={selectedTaxTypeOption}
                isSearchable={false}
                placeholder="Select Tax..."
                className="react-select"
                classNamePrefix="react-select"
                onChange={(selected) =>
                  handleChange("taxType", selected ? selected.value : "GST")
                }
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
              />
            </Col>

            <Col md={4}>
              <FormLabel className="fw-semibold">
                {formData.taxType === "VAT" ? "VAT Number" : "TAX Number (GSTIN)"}
              </FormLabel>
              <FormControl
                type="text"
                placeholder={
                  formData.taxType === "VAT"
                    ? "Enter VAT number."
                    : "Enter GSTIN / TAX number."
                }
                value={formData.gstin || ""}
                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
              />
            </Col>

            <Col md={4}>
              <FormLabel className="fw-semibold">Currency</FormLabel>
              <Select<DropdownOption>
                instanceId="party-modal-currency-select"
                options={currencyOptions}
                value={selectedCurrencyOption}
                isSearchable
                placeholder="Search & select currency..."
                noOptionsMessage={() => "No currency found"}
                className="react-select"
                classNamePrefix="react-select"
                onChange={(selected) =>
                  handleChange("currency", selected ? selected.value : "INR")
                }
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
              />
            </Col>

            {/* Country, Dependent State, and City */}
            <Col md={6}>
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
                className={`react-select ${validationErrors.country_id ? "is-invalid" : ""}`}
                classNamePrefix="react-select"
                onChange={handleCountryChange}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
              />
              {validationErrors.country_id && (
                <div className="text-danger fs-12 mt-1">
                  {validationErrors.country_id}
                </div>
              )}
            </Col>

            <Col md={6}>
              <FormLabel className="fw-semibold">City</FormLabel>
              <Select<DropdownOption>
                instanceId="party-city-select"
                options={cityOptions}
                value={selectedCityOption}
                isLoading={citiesLoading}
                isSearchable
                isClearable
                isDisabled={!selectedCountryId}
                placeholder={
                  selectedCountryId
                    ? "Search & select city..."
                    : "Select country first..."
                }
                noOptionsMessage={() =>
                  selectedCountryId
                    ? "No cities found for selected country"
                    : "Select country first"
                }
                className={`react-select ${validationErrors.city_id ? "is-invalid" : ""}`}
                classNamePrefix="react-select"
                onChange={handleCityChange}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
              />
              {validationErrors.city_id && (
                <div className="text-danger fs-12 mt-1">
                  {validationErrors.city_id}
                </div>
              )}
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
