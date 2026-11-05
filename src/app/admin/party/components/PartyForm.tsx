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
import CreatableSelect from "react-select/creatable";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addParty,
  updateParty,
  fetchPartys,
  PartyRecord,
} from "@/redux/slices/admin/partySlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";
import { fetchState, StateRecord } from "@/redux/slices/admin/stateSlice";
import { fetchCity, CityRecord } from "@/redux/slices/admin/citySlice";

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
  const { records: citiesList, loading: citiesLoading } = useAppSelector(
    (s: any) => s.city || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<PartyRecord>({
    id: recordId || "",
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
    if (citiesList.length === 0) {
      dispatch(fetchCity());
    }
  }, [dispatch, records.length, countriesList.length, stateList.length, citiesList.length]);

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

        let initialCityId = "";
        if (typeof found.city_id === "object" && found.city_id) {
          initialCityId = found.city_id.id || found.city_id._id || "";
        } else if (typeof found.city_id === "string") {
          initialCityId = found.city_id;
        } else if (found.city && citiesList.length > 0) {
          const matched = citiesList.find(
            (c: any) => (c.name || "").trim().toLowerCase() === found.city?.trim().toLowerCase()
          );
          if (matched) {
            initialCityId = matched.id || matched._id || "";
          }
        }

        if (!initialCountryId && initialCityId && citiesList.length > 0) {
          const matchedCity = citiesList.find((c: any) => (c.id || c._id) === initialCityId);
          if (matchedCity?.country_id) {
            initialCountryId =
              typeof matchedCity.country_id === "object"
                ? (matchedCity.country_id.id || matchedCity.country_id._id || "")
                : matchedCity.country_id;
          }
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
          taxType: found.taxType || found.tax_type || "GST",
          currency: found.currency || "INR",
          country_id: initialCountryId,
          state_id: initialStateId,
          city_id: initialCityId,
          city: found.city || (typeof found.city_id === "object" ? found.city_id?.name || "" : ""),
        });
      }
    }
  }, [isEdit, recordId, records, stateList, citiesList]);

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
    return null;
  }, [countryOptions, selectedCountryId]);

  const selectedStateOption = useMemo(() => {
    if (!formData.state_id) return null;
    const currentId =
      typeof formData.state_id === "object" && formData.state_id
        ? String(formData.state_id._id || formData.state_id.id || "")
        : String(formData.state_id);
    const matched = stateOptions.find((opt) => opt.value === currentId);
    if (matched) return matched;
    return null;
  }, [stateOptions, formData.state_id]);

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    }),
    []
  );

  const selectedCityOption = useMemo(() => {
    const currentId =
      typeof formData.city_id === "object" && formData.city_id
        ? String(formData.city_id._id || formData.city_id.id || "")
        : String(formData.city_id || "");

    if (currentId) {
      const matched = cityOptions.find((opt) => opt.value === currentId);
      if (matched) return matched;
      const fromFullList = citiesList.find((c: CityRecord) => String(c.id || c._id) === currentId);
      if (fromFullList) {
        return { value: currentId, label: fromFullList.name || "" };
      }
      return { value: currentId, label: formData.city || "Selected City" };
    }

    if (formData.city?.trim()) {
      const matched = cityOptions.find(
        (opt) => opt.label.trim().toLowerCase() === formData.city?.trim().toLowerCase()
      );
      if (matched) return matched;
      return { value: formData.city.trim(), label: formData.city.trim() };
    }

    return null;
  }, [cityOptions, citiesList, formData.city_id, formData.city]);

  const handleCountryChange = (selected: DropdownOption | null) => {
    const newCountryId = selected ? selected.value : "";
    setFormData((prev) => {
      let nextStateId = prev.state_id;
      let nextStateName = prev.state;
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
      if (!newCountryId) {
        nextCityId = "";
        nextCityName = "";
      } else if (nextCityId) {
        const ct = citiesList.find((c: any) => String(c.id || c._id) === String(nextCityId));
        const ctCountryId =
          typeof ct?.country_id === "object" && ct?.country_id
            ? String(ct.country_id._id || ct.country_id.id || "")
            : String(ct?.country_id || "");
        if (ctCountryId && ctCountryId !== newCountryId) {
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

  const handleCityChange = (selected: DropdownOption | null) => {
    const newCityVal = selected ? selected.value : "";
    const newCityLabel = selected ? selected.label : "";

    const matchedCity = citiesList.find(
      (c: CityRecord) => String(c.id || c._id) === String(newCityVal)
    );

    if (matchedCity) {
      setFormData((prev) => ({
        ...prev,
        city_id: String(matchedCity.id || matchedCity._id || ""),
        city: matchedCity.name || newCityLabel,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        city_id: "",
        city: newCityLabel || newCityVal,
      }));
    }

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

    try {
      const payloadData = {
        ...formData,
        country_id: formData.country_id || null,
        state_id: formData.state_id || null,
        city_id: formData.city_id || null,
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

                  <Col md={4}>
                    <FormLabel className="fw-semibold">Tax Details</FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-tax-type-select"
                      options={taxTypeOptions}
                      value={selectedTaxTypeOption}
                      isSearchable
                      className="react-select"
                      classNamePrefix="react-select"
                      onChange={(selected) =>
                        handleChange("taxType", selected ? selected.value : "GST")
                      }
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                      menuPosition="fixed"
                      styles={selectStyles}
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
                      instanceId="party-form-currency-select"
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
                      styles={selectStyles}
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
                      className={`react-select ${validationErrors.country_id ? "is-invalid" : ""}`}
                      classNamePrefix="react-select"
                      onChange={handleCountryChange}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                      menuPosition="fixed"
                      styles={selectStyles}
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
                      className={`react-select ${validationErrors.state_id ? "is-invalid" : ""}`}
                      classNamePrefix="react-select"
                      onChange={handleStateChange}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">City</FormLabel>
                    <CreatableSelect<DropdownOption>
                      instanceId="party-form-city-select"
                      options={cityOptions}
                      value={selectedCityOption}
                      isLoading={citiesLoading}
                      isSearchable
                      isClearable
                      isDisabled={!selectedCountryId}
                      placeholder={
                        selectedCountryId
                          ? "Search or enter city..."
                          : "Select country first..."
                      }
                      noOptionsMessage={() =>
                        selectedCountryId
                          ? "No matching cities. Type to enter."
                          : "Select country first"
                      }
                      className={`react-select ${validationErrors.city_id ? "is-invalid" : ""}`}
                      classNamePrefix="react-select"
                      onChange={handleCityChange}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                    {validationErrors.city_id && (
                      <div className="text-danger fs-12 mt-1">
                        {validationErrors.city_id}
                      </div>
                    )}
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
