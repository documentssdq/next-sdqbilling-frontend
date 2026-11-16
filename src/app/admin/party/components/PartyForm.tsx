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
  addParty,
  updateParty,
  fetchPartys,
  PartyRecord,
} from "@/redux/slices/admin/partySlice";
import { fetchCountries, CountriesRecord } from "@/redux/slices/admin/countriesSlice";
import { fetchState, StateRecord } from "@/redux/slices/admin/stateSlice";
import { fetchCity, CityRecord } from "@/redux/slices/admin/citySlice";
import { fetchCurrency, CurrencyRecord } from "@/redux/slices/admin/currencySlice";

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
  const { records: statesList, loading: statesLoading } = useAppSelector(
    (s: any) => s.state || { records: [], loading: false }
  );
  const { records: citiesList, loading: citiesLoading } = useAppSelector(
    (s: any) => s.city || { records: [], loading: false }
  );
  const { records: currencyList, loading: currencyLoading } = useAppSelector(
    (s: any) => s.currency || { records: [], loading: false }
  );

  const [formData, setFormData] = useState<PartyRecord>({
    id: recordId || "",
    name: "",
    partyType: "customer",
    phone: "",
    email: "",
    taxType: "GST",
    currency_id: "",
    gstin: "",
    country_id: "",
    state_id: "",
    city_id: "",
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
    if (statesList.length === 0) {
      dispatch(fetchState());
    }
    if (citiesList.length === 0) {
      dispatch(fetchCity());
    }
    if (currencyList.length === 0) {
      dispatch(fetchCurrency());
    }
  }, [dispatch, records.length, countriesList.length, statesList.length, citiesList.length, currencyList.length]);

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
        }

        // Auto-resolve missing state / country from city
        if (initialCityId && citiesList.length > 0) {
          const matchedCity = citiesList.find((c: any) => (c.id || c._id) === initialCityId);
          if (matchedCity) {
            if (!initialStateId && matchedCity.state_id) {
              initialStateId =
                typeof matchedCity.state_id === "object"
                  ? (matchedCity.state_id.id || matchedCity.state_id._id || "")
                  : matchedCity.state_id;
            }
            if (!initialCountryId && matchedCity.country_id) {
              initialCountryId =
                typeof matchedCity.country_id === "object"
                  ? (matchedCity.country_id.id || matchedCity.country_id._id || "")
                  : matchedCity.country_id;
            }
          }
        }

        // Auto-resolve missing country from state
        if (!initialCountryId && initialStateId && statesList.length > 0) {
          const matchedState = statesList.find((s: any) => (s.id || s._id) === initialStateId);
          if (matchedState?.country_id) {
            initialCountryId =
              typeof matchedState.country_id === "object"
                ? (matchedState.country_id.id || matchedState.country_id._id || "")
                : matchedState.country_id;
          }
        }

        let initialCurrencyId = "";
        if (typeof found.currency_id === "object" && found.currency_id) {
          initialCurrencyId = (found.currency_id as any).id || (found.currency_id as any)._id || "";
        } else if (typeof found.currency_id === "string") {
          initialCurrencyId = found.currency_id;
        }

        setFormData({
          id: found.id || found._id || recordId,
          _id: found._id || found.id || recordId,
          name: found.name || "",
          partyType: found.partyType || "customer",
          phone: found.phone || "",
          email: found.email || "",
          taxType: found.taxType || found.tax_type || "GST",
          currency_id: initialCurrencyId,
          gstin: found.gstin || "",
          country_id: initialCountryId,
          state_id: initialStateId,
          city_id: initialCityId,
          address: found.address || "",
          description: found.description || "",
          isActive: found.isActive !== undefined ? found.isActive : true,
        });
      }
    }
  }, [isEdit, recordId, records, citiesList, statesList, currencyList]);

  // Tax Details
  const taxTypeOptions: DropdownOption[] = useMemo(
    () => [
      { value: "GST", label: "GST" },
      { value: "VAT", label: "VAT" },
    ],
    []
  );

  const selectedTaxTypeOption = useMemo(() => {
    const val = formData.taxType || "GST";
    return taxTypeOptions.find((t) => t.value === val) || { value: val, label: val };
  }, [formData.taxType, taxTypeOptions]);

  // Normalized IDs
  const selectedCountryId = useMemo(() => {
    if (!formData.country_id) return "";
    if (typeof formData.country_id === "object") {
      return String((formData.country_id as any)._id || (formData.country_id as any).id || "");
    }
    return String(formData.country_id);
  }, [formData.country_id]);

  const selectedStateId = useMemo(() => {
    if (!formData.state_id) return "";
    if (typeof formData.state_id === "object") {
      return String((formData.state_id as any)._id || (formData.state_id as any).id || "");
    }
    return String(formData.state_id);
  }, [formData.state_id]);

  const selectedCityId = useMemo(() => {
    if (!formData.city_id) return "";
    if (typeof formData.city_id === "object") {
      return String((formData.city_id as any)._id || (formData.city_id as any).id || "");
    }
    return String(formData.city_id);
  }, [formData.city_id]);

  const selectedCurrencyId = useMemo(() => {
    if (!formData.currency_id) return "";
    if (typeof formData.currency_id === "object") {
      return String((formData.currency_id as any)._id || (formData.currency_id as any).id || "");
    }
    return String(formData.currency_id);
  }, [formData.currency_id]);

  // Cascading Options
  const countryOptions: DropdownOption[] = useMemo(() => {
    return countriesList
      .filter((c: CountriesRecord) => c.isActive !== false || String(c.id || c._id) === selectedCountryId)
      .map((c: CountriesRecord) => ({
        value: String(c.id || c._id || ""),
        label: c.name || "Unnamed Country",
      }));
  }, [countriesList, selectedCountryId]);

  const stateOptions: DropdownOption[] = useMemo(() => {
    return statesList
      .filter((s: StateRecord) => {
        const sCountryId =
          typeof s.country_id === "object" && s.country_id
            ? String((s.country_id as any)._id || (s.country_id as any).id || "")
            : String(s.country_id || "");

        const matchesCountry = !selectedCountryId || sCountryId === selectedCountryId;
        const sId = String(s.id || s._id || "");
        return matchesCountry && (s.isActive !== false || sId === selectedStateId);
      })
      .map((s: StateRecord) => ({
        value: String(s.id || s._id || ""),
        label: s.code ? `${s.name} (${s.code})` : s.name || "Unnamed State",
      }));
  }, [statesList, selectedCountryId, selectedStateId]);

  const cityOptions: DropdownOption[] = useMemo(() => {
    return citiesList
      .filter((c: CityRecord) => {
        const cCountryId =
          typeof c.country_id === "object" && c.country_id
            ? String((c.country_id as any)._id || (c.country_id as any).id || "")
            : String(c.country_id || "");

        const cStateId =
          typeof c.state_id === "object" && c.state_id
            ? String((c.state_id as any)._id || (c.state_id as any).id || "")
            : String(c.state_id || "");

        let matches = true;
        if (selectedStateId) {
          matches = cStateId === selectedStateId;
        } else if (selectedCountryId) {
          matches = cCountryId === selectedCountryId;
        }

        const cityId = String(c.id || c._id || "");
        return matches && (c.isActive !== false || cityId === selectedCityId);
      })
      .map((c: CityRecord) => ({
        value: String(c.id || c._id || ""),
        label: c.name || "Unnamed City",
      }));
  }, [citiesList, selectedCountryId, selectedStateId, selectedCityId]);

  const currencyOptions: DropdownOption[] = useMemo(() => {
    return currencyList
      .filter((c: CurrencyRecord) => c.isActive !== false || String(c.id || c._id) === selectedCurrencyId)
      .map((c: CurrencyRecord) => {
        const code = c.code || "";
        const symbol = c.symbol ? ` (${c.symbol})` : "";
        const label = code ? `${code} - ${c.name}${symbol}` : `${c.name}${symbol}`;
        return {
          value: String(c.id || c._id || ""),
          label: label,
        };
      });
  }, [currencyList, selectedCurrencyId]);

  // Selected Option Objects
  const selectedCountryOption = useMemo(() => {
    if (!selectedCountryId) return null;
    const match = countryOptions.find((c) => c.value === selectedCountryId);
    if (match) return match;
    const foundInRecords = records.find((r: PartyRecord) => (r.id || r._id) === recordId);
    const fallbackName =
      typeof foundInRecords?.country_id === "object" && foundInRecords?.country_id?.name
        ? foundInRecords.country_id.name
        : "Selected Country";
    return { value: selectedCountryId, label: fallbackName };
  }, [selectedCountryId, countryOptions, records, recordId]);

  const selectedStateOption = useMemo(() => {
    if (!selectedStateId) return null;
    const match = stateOptions.find((s) => s.value === selectedStateId);
    if (match) return match;
    const foundInRecords = records.find((r: PartyRecord) => (r.id || r._id) === recordId);
    const fallbackName =
      typeof foundInRecords?.state_id === "object" && foundInRecords?.state_id?.name
        ? foundInRecords.state_id.code
          ? `${foundInRecords.state_id.name} (${foundInRecords.state_id.code})`
          : foundInRecords.state_id.name
        : "Selected State";
    return { value: selectedStateId, label: fallbackName };
  }, [selectedStateId, stateOptions, records, recordId]);

  const selectedCityOption = useMemo(() => {
    if (!selectedCityId) return null;
    const match = cityOptions.find((c) => c.value === selectedCityId);
    if (match) return match;
    const foundInRecords = records.find((r: PartyRecord) => (r.id || r._id) === recordId);
    const fallbackName =
      typeof foundInRecords?.city_id === "object" && foundInRecords?.city_id?.name
        ? foundInRecords.city_id.name
        : "Selected City";
    return { value: selectedCityId, label: fallbackName };
  }, [selectedCityId, cityOptions, records, recordId]);

  const selectedCurrencyOption = useMemo(() => {
    if (!selectedCurrencyId) return null;
    const match = currencyOptions.find((c) => c.value === selectedCurrencyId);
    if (match) return match;
    const foundInRecords = records.find((r: PartyRecord) => (r.id || r._id) === recordId);
    const fallbackName =
      typeof foundInRecords?.currency_id === "object" && foundInRecords?.currency_id?.name
        ? `${foundInRecords.currency_id.code ? foundInRecords.currency_id.code + " - " : ""}${foundInRecords.currency_id.name}`
        : "Selected Currency";
    return { value: selectedCurrencyId, label: fallbackName };
  }, [selectedCurrencyId, currencyOptions, records, recordId]);

  // Cascading Selection Handlers
  const handleCountryChange = (selected: DropdownOption | null) => {
    const newCountryId = selected ? selected.value : "";
    setFormData((prev) => {
      let newStateId = prev.state_id;
      let newCityId = prev.city_id;

      if (newStateId) {
        const currentState = statesList.find(
          (s: StateRecord) => String(s.id || s._id) === String(newStateId)
        );
        if (currentState) {
          const stateCountryId =
            typeof currentState.country_id === "object" && currentState.country_id
              ? String(currentState.country_id.id || currentState.country_id._id || "")
              : String(currentState.country_id || "");
          if (newCountryId && stateCountryId && stateCountryId !== newCountryId) {
            newStateId = "";
          }
        }
      }

      if (newCityId) {
        const currentCity = citiesList.find(
          (c: CityRecord) => String(c.id || c._id) === String(newCityId)
        );
        if (currentCity) {
          const cityCountryId =
            typeof currentCity.country_id === "object" && currentCity.country_id
              ? String(currentCity.country_id.id || currentCity.country_id._id || "")
              : String(currentCity.country_id || "");
          if (newCountryId && cityCountryId && cityCountryId !== newCountryId) {
            newCityId = "";
          }
        }
      }

      return {
        ...prev,
        country_id: newCountryId,
        state_id: newStateId,
        city_id: newCityId,
      };
    });
    if (validationErrors.country_id) {
      setValidationErrors((prev) => ({ ...prev, country_id: "" }));
    }
    if (validationErrors.state_id) {
      setValidationErrors((prev) => ({ ...prev, state_id: "" }));
    }
    if (validationErrors.city_id) {
      setValidationErrors((prev) => ({ ...prev, city_id: "" }));
    }
  };

  const handleStateChange = (selected: DropdownOption | null) => {
    const newStateId = selected ? selected.value : "";
    setFormData((prev) => {
      let newCountryId = prev.country_id;
      let newCityId = prev.city_id;

      if (newStateId) {
        const selectedState = statesList.find(
          (s: StateRecord) => String(s.id || s._id) === String(newStateId)
        );
        if (selectedState) {
          const stateCountryId =
            typeof selectedState.country_id === "object" && selectedState.country_id
              ? String(selectedState.country_id.id || selectedState.country_id._id || "")
              : String(selectedState.country_id || "");
          if (stateCountryId && (!newCountryId || newCountryId !== stateCountryId)) {
            newCountryId = stateCountryId;
          }
        }
      }

      if (newCityId) {
        const currentCity = citiesList.find(
          (c: CityRecord) => String(c.id || c._id) === String(newCityId)
        );
        if (currentCity) {
          const cityStateId =
            typeof currentCity.state_id === "object" && currentCity.state_id
              ? String(currentCity.state_id.id || currentCity.state_id._id || "")
              : String(currentCity.state_id || "");
          if (newStateId && cityStateId && cityStateId !== newStateId) {
            newCityId = "";
          }
        }
      }

      return {
        ...prev,
        country_id: newCountryId,
        state_id: newStateId,
        city_id: newCityId,
      };
    });
    if (validationErrors.state_id) {
      setValidationErrors((prev) => ({ ...prev, state_id: "" }));
    }
    if (validationErrors.country_id) {
      setValidationErrors((prev) => ({ ...prev, country_id: "" }));
    }
    if (validationErrors.city_id) {
      setValidationErrors((prev) => ({ ...prev, city_id: "" }));
    }
  };

  const handleCityChange = (selected: DropdownOption | null) => {
    const newCityId = selected ? selected.value : "";
    setFormData((prev) => {
      let newCountryId = prev.country_id;
      let newStateId = prev.state_id;

      if (newCityId) {
        const selectedCity = citiesList.find(
          (c: CityRecord) => String(c.id || c._id) === String(newCityId)
        );
        if (selectedCity) {
          const cityStateId =
            typeof selectedCity.state_id === "object" && selectedCity.state_id
              ? String(selectedCity.state_id.id || selectedCity.state_id._id || "")
              : String(selectedCity.state_id || "");
          if (cityStateId && !newStateId) {
            newStateId = cityStateId;
          }

          const cityCountryId =
            typeof selectedCity.country_id === "object" && selectedCity.country_id
              ? String(selectedCity.country_id.id || selectedCity.country_id._id || "")
              : String(selectedCity.country_id || "");
          if (cityCountryId && !newCountryId) {
            newCountryId = cityCountryId;
          }
        }
      }

      return {
        ...prev,
        country_id: newCountryId,
        state_id: newStateId,
        city_id: newCityId,
      };
    });
    if (validationErrors.city_id) {
      setValidationErrors((prev) => ({ ...prev, city_id: "" }));
    }
  };

  const handleCurrencyChange = (selected: DropdownOption | null) => {
    const newCurrencyId = selected ? selected.value : "";
    setFormData((prev) => ({
      ...prev,
      currency_id: newCurrencyId,
    }));
    if (validationErrors.currency_id) {
      setValidationErrors((prev) => ({ ...prev, currency_id: "" }));
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

    if (!selectedCountryId) {
      errors.country_id = "Country is required";
    }

    if (!selectedStateId) {
      errors.state_id = "State is required";
    }

    if (!selectedCityId) {
      errors.city_id = "City is required";
    }

    if (!selectedCurrencyId) {
      errors.currency_id = "Currency is required";
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
        name: formData.name?.trim() || "",
        partyType: formData.partyType || "customer",
        phone: formData.phone?.trim() || "",
        email: formData.email?.trim() || "",
        taxType: formData.taxType || "GST",
        currency_id: selectedCurrencyId || null,
        gstin: formData.gstin ? formData.gstin.trim() : "",
        country_id: selectedCountryId || null,
        state_id: selectedStateId || null,
        city_id: selectedCityId || null,
        address: formData.address ? formData.address.trim() : "",
        description: formData.description ? formData.description.trim() : "",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      };

      if (isEdit && (formData.id || recordId)) {
        await dispatch(
          updateParty({
            ...payloadData,
            id: formData.id || recordId,
          })
        ).unwrap();
      } else {
        await dispatch(addParty(payloadData)).unwrap();
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

  const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <>
      <PageBreadcrumb
        title={isEdit ? "Update Party" : "Create Party"}
        subtitle="Party"
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
                  {isEdit ? "Update Party" : "Add Party"}
                </h5>
                <Link href={`/admin/party`} className="btn btn-light btn-sm fw-semibold">
                  <Icon icon="arrow-left" className="me-1" /> Back
                </Link>
              </CardHeader>
              <CardBody className="p-4">
                <Row className="g-4">
                  <Col md={4}>
                    <FormLabel className="fw-semibold">
                      Party Type <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      as="select"
                      value={formData.partyType || "customer"}
                      onChange={(e) => handleChange("partyType", e.target.value)}
                      isInvalid={!!validationErrors.partyType}
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="both">Both (Customer & Vendor)</option>
                    </FormControl>
                    <FormControl.Feedback type="invalid">
                      {validationErrors.partyType}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={8}>
                    <FormLabel className="fw-semibold">
                      Party / Company Name <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="Enter party or company name..."
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
                      Phone / Mobile Number <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. 9876543210"
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
                      placeholder="e.g. contact@example.com"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      isInvalid={!!validationErrors.email}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.email}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">Tax Type</FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-tax-type-select"
                      options={taxTypeOptions}
                      value={selectedTaxTypeOption}
                      isSearchable={false}
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
                          ? "Enter VAT number..."
                          : "Enter GSTIN / TAX number..."
                      }
                      value={formData.gstin || ""}
                      onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    />
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">
                      Currency <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-currency-select"
                      options={currencyOptions}
                      value={selectedCurrencyOption}
                      isLoading={currencyLoading}
                      isSearchable
                      isClearable
                      placeholder="Search & select currency..."
                      noOptionsMessage={() => "No currency found"}
                      className={`react-select ${validationErrors.currency_id ? "is-invalid" : ""}`}
                      classNamePrefix="react-select"
                      onChange={handleCurrencyChange}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                    {validationErrors.currency_id && (
                      <div className="text-danger fs-12 mt-1">
                        {validationErrors.currency_id}
                      </div>
                    )}
                  </Col>

                  {/* Cascading Country, State, and City */}
                  <Col md={4}>
                    <FormLabel className="fw-semibold">
                      Country <span className="text-danger">*</span>
                    </FormLabel>
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
                    {validationErrors.country_id && (
                      <div className="text-danger fs-12 mt-1">
                        {validationErrors.country_id}
                      </div>
                    )}
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">
                      State <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-state-select"
                      options={stateOptions}
                      value={selectedStateOption}
                      isLoading={statesLoading}
                      isSearchable
                      isClearable
                      placeholder={
                        selectedCountryId
                          ? "Select state..."
                          : "Select country first..."
                      }
                      noOptionsMessage={() =>
                        selectedCountryId
                          ? "No states found for this country"
                          : "Select country first"
                      }
                      className={`react-select ${validationErrors.state_id ? "is-invalid" : ""}`}
                      classNamePrefix="react-select"
                      onChange={handleStateChange}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                    {validationErrors.state_id && (
                      <div className="text-danger fs-12 mt-1">
                        {validationErrors.state_id}
                      </div>
                    )}
                  </Col>

                  <Col md={4}>
                    <FormLabel className="fw-semibold">
                      City <span className="text-danger">*</span>
                    </FormLabel>
                    <Select<DropdownOption>
                      instanceId="party-form-city-select"
                      options={cityOptions}
                      value={selectedCityOption}
                      isLoading={citiesLoading}
                      isSearchable
                      isClearable
                      placeholder={
                        selectedStateId
                          ? "Select city..."
                          : selectedCountryId
                          ? "Select state first..."
                          : "Select country & state first..."
                      }
                      noOptionsMessage={() =>
                        selectedStateId
                          ? "No cities found for this state"
                          : selectedCountryId
                          ? "Select state first"
                          : "Select country & state first"
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
                    <FormLabel className="fw-semibold">Description / Notes</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={2}
                      placeholder="Internal notes or description about this party..."
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
