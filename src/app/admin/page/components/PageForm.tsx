"use client";
import React, { useEffect, useState, useRef } from "react";
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
  OverlayTrigger,
  Row,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addPage, updatePage, fetchPages, PageRecord } from "@/redux/slices/admin/pageSlice";
import { fetchWidgets } from "@/redux/slices/admin/widgetSlice";
import Select from "react-select";
import dynamic from "next/dynamic";
import Image from "next/image";
import Swal from "sweetalert2";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface PageFormProps {
  mode: "add" | "edit";
  pageId?: string;
}

const templateOptions = [
  { value: "default", label: "Default Template" },
  { value: "landing", label: "Landing Page" },
  { value: "contact", label: "Contact Us" },
  { value: "blog", label: "Blog Layout" },
];



const PageForm: React.FC<PageFormProps> = ({ mode, pageId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";

  const { records } = useAppSelector((state) => state.page);
  const { records: widgetRecords } = useAppSelector((state) => state.widget);

  const widgetOptions = widgetRecords.map((w) => ({
    value: w.id as string,
    label: w.mainTitle || (w.id as string),
  }));

  const [formData, setFormData] = useState<PageRecord>({
    id: pageId || "",
    pageName: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: "",
    template: "default",
    externalUrl: "",
    widgets: [],
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [slugEdited, setSlugEdited] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchPages());
    }
    if (widgetRecords.length === 0) {
      dispatch(fetchWidgets());
    }
  }, [dispatch, records.length, widgetRecords.length]);

  useEffect(() => {
    if (isEdit && pageId && records.length > 0) {
      const found = records.find((r) => r.id === pageId);
      if (found) {
        setFormData({ ...found });
        setImagePreview(found.image || "");
        setSlugEdited(true); // Don't auto-generate on edit unless they clear it
      }
    }
  }, [isEdit, pageId, records]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleChange = (field: keyof PageRecord, value: any) => {
    setFormData((prev) => {
      const nextData = { ...prev, [field]: value };
      
      // Auto-generate slug from pageName if not manually edited
      if (field === "pageName" && !slugEdited && !isEdit) {
        nextData.slug = generateSlug(value);
      }
      return nextData;
    });

    if (field === "slug") {
      setSlugEdited(true);
    }

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setIsUploading(true);

    // Convert file to base64
    const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    try {
      const base64Image = await toBase64(file);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || sessionStorage.getItem("token") : null;

      // Use our Next.js API proxy to bypass production WAF blocking multipart requests from the browser
      const res = await fetch(`/api/proxy-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          base64: base64Image,
          filename: file.name,
          folder: "pages"
        }),
      });
      const data = await res.json();
      const uploadedUrl = data?.data?.url || data?.url || "";
      if (uploadedUrl) {
        handleChange("image", uploadedUrl);
        setImagePreview(uploadedUrl);
      } else {
        setErrorMessage(`Upload failed: ${data.message || "Could not get URL."}`);
        setImagePreview(formData.image || "");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(`Upload error: ${err.message || "Network issue or CORS"}`);
      setImagePreview(formData.image || "");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    const result = await Swal.fire({
      title: "Remove Image?",
      text: "Are you sure you want to remove this image? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!"
    });

    if (result.isConfirmed) {
      // Try to delete from the server directory
      if (formData.image) {
        try {
          await fetch('/api/proxy-delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: formData.image })
          });
        } catch (e) {
          console.error("Failed to delete image from server", e);
        }
      }
      
      handleChange("image", "");
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      Swal.fire({
        title: "Removed!",
        text: "The image has been removed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const getImageSrc = (url: string) => {
    if (!url) return "";
    if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }
    return `/uploads/${url}`; // fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.pageName?.trim()) errors.pageName = "Page Name is required";
    if (!formData.slug?.trim()) errors.slug = "Slug is required";
    if (!formData.template?.trim()) errors.template = "Template selection is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields marked with an asterisk (*).");
      return;
    }
    setValidationErrors({});
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isEdit && formData.id) {
        await dispatch(updatePage(formData)).unwrap();
      } else {
        await dispatch(addPage(formData)).unwrap();
      }
      setSaved(true);
      sessionStorage.setItem("pageAlertMsg", `Page "${formData.pageName}" has been ${isEdit ? "updated" : "created"}.`);
      setTimeout(() => {
        router.push("/admin/page");
      }, 1200);
    } catch (err: any) {
      // Handle Joi validation errors array
      if (err?.errors && Array.isArray(err.errors)) {
        const backendErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) backendErrors[e.field] = e.message.replace(/\"/g, "");
        });
        if (Object.keys(backendErrors).length > 0) {
          setValidationErrors(backendErrors);
          setErrorMessage("Please correct the highlighted fields below.");
          return;
        }
      }

      const msg = err?.message || "Failed to save page. Please try again.";
      
      // Fallback: Mongoose validation string parser
      if (msg.toLowerCase().includes("validation failed")) {
        const backendErrors: Record<string, string> = {};
        const fields = ["pageName", "slug", "template", "status", "content"];
        fields.forEach(field => {
          if (msg.includes(`\`${field}\``) || msg.includes(`${field}:`)) {
            const match = msg.match(new RegExp(`${field}: ([^,]+)`));
            backendErrors[field] = match ? match[1].replace(/Path `[^`]+` /, "").trim() : "Invalid value";
          }
        });
        if (Object.keys(backendErrors).length > 0) {
          setValidationErrors(backendErrors);
          setErrorMessage("Please correct the highlighted fields below.");
          setIsSubmitting(false);
          return;
        }
      }

      // Fallback: Mongoose duplicate key error parser
      if (msg.includes("E11000 duplicate key error")) {
         if (msg.includes("slug")) {
            setValidationErrors({ slug: "This slug is already in use. Please choose a unique slug." });
            setErrorMessage("Please correct the highlighted fields below.");
            setIsSubmitting(false);
            return;
         }
         if (msg.includes("pageName")) {
            setValidationErrors({ pageName: "This page name is already in use." });
            setErrorMessage("Please correct the highlighted fields below.");
            setIsSubmitting(false);
            return;
         }
      }

      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb
        title={isEdit ? `Edit Page (${formData.pageName})` : "Add New Page"}
        subtitle="Page Management"
      />

      {errorMessage && (
        <Alert
          variant="danger"
          className="d-flex align-items-center gap-2 mb-3"
          onClose={() => setErrorMessage("")}
          dismissible
        >
          <Icon icon="alert-circle" className="fs-18 flex-shrink-0" />
          <span>{errorMessage}</span>
        </Alert>
      )}

      {saved && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2 mb-3"
        >
          <Icon icon="check-circle" className="fs-18 flex-shrink-0" />
          <span>
            Page "{formData.pageName}" {isEdit ? "updated" : "created"} successfully! Redirecting...
          </span>
        </Alert>
      )}

      <Row className="justify-content-center">
        <Col lg={12}>
          <form onSubmit={handleSubmit}>
            <Card className="mb-4 border-0 shadow-sm">
              <CardHeader className="d-flex justify-content-between align-items-center bg-light-subtle py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary bg-opacity-10 text-primary rounded p-2 d-flex align-items-center justify-content-center">
                    <Icon icon={isEdit ? "file-edit" : "file-plus"} className="fs-20" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">
                      {isEdit ? "Update Page Details" : "Create New Page"}
                    </h5>
                    <small className="text-muted">
                      Configure page content, SEO metadata, and templates
                    </small>
                  </div>
                </div>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-back">Return to Pages List</Tooltip>}
                >
                  <Link
                    href="/admin/page"
                    className="btn btn-light btn-sm d-flex align-items-center gap-1 fw-semibold"
                  >
                    <Icon icon="arrow-left" /> Back to Pages
                  </Link>
                </OverlayTrigger>
              </CardHeader>

              <CardBody className="p-4">
                <Row className="g-4">
                  {/* Page Name */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Page Name <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. About Us"
                      value={formData.pageName || ""}
                      onChange={(e) => handleChange("pageName", e.target.value)}
                      isInvalid={!!validationErrors.pageName}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.pageName}
                    </FormControl.Feedback>
                  </Col>

                  {/* Slug */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      URL Slug <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. about-us"
                      value={formData.slug || ""}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      isInvalid={!!validationErrors.slug}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.slug}
                    </FormControl.Feedback>
                    <small className="text-muted fs-12">Will be auto-generated from page name if left blank initially.</small>
                  </Col>

                  {/* Template Dropdown */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Template <span className="text-danger">*</span>
                    </FormLabel>
                    <FormSelect
                      value={formData.template || ""}
                      onChange={(e) => handleChange("template", e.target.value)}
                      isInvalid={!!validationErrors.template}
                    >
                      <option value="">Select a template...</option>
                      {templateOptions.map((tpl) => (
                         <option key={tpl.value} value={tpl.value}>{tpl.label}</option>
                      ))}
                    </FormSelect>
                    <FormControl.Feedback type="invalid">
                      {validationErrors.template}
                    </FormControl.Feedback>
                  </Col>

                  {/* Image Upload */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">Banner Image</FormLabel>
                    <div className="d-flex align-items-start gap-3">
                      {imagePreview && (
                        <div className="position-relative border rounded overflow-hidden" style={{ width: 90, height: 90, flexShrink: 0 }}>
                          <Image
                            src={getImageSrc(imagePreview)}
                            alt="Banner Preview"
                            fill
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                            style={{ width: 22, height: 22, borderRadius: "0 0 0 4px" }}
                            onClick={handleRemoveImage}
                          >
                            <Icon icon="x" className="fs-12" />
                          </button>
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpg,image/jpeg,image/webp"
                          className={`form-control ${validationErrors.image ? 'is-invalid' : ''}`}
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && (
                          <div className="text-primary mt-2 fs-14 fw-semibold d-flex align-items-center">
                            <Spinner size="sm" animation="border" className="me-2" />
                            Uploading image, please wait...
                          </div>
                        )}
                        {validationErrors.image && <div className="invalid-feedback d-block">{validationErrors.image}</div>}
                        <small className="text-muted fs-12 d-block mt-1">Recommended: 1200x630px (Max 2MB)</small>
                      </div>
                    </div>
                  </Col>
                  
                  {/* External URL */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">External URL (Redirect)</FormLabel>
                    <FormControl
                      type="url"
                      placeholder="https://external-site.com"
                      value={formData.externalUrl || ""}
                      onChange={(e) => handleChange("externalUrl", e.target.value)}
                      isInvalid={!!validationErrors.externalUrl}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.externalUrl}
                    </FormControl.Feedback>
                    <small className="text-muted fs-12">If set, navigating to this page will redirect to the external URL.</small>
                  </Col>

                  {/* Status Toggle */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold mb-2 d-block">
                      Page Status
                    </FormLabel>
                    <FormCheck
                      type="switch"
                      id="status-switch-form"
                      label={formData.isActive ? "Active (Published)" : "Inactive (Draft)"}
                      checked={formData.isActive ?? true}
                      onChange={(e) => handleChange("isActive", e.target.checked)}
                      className="fs-15 fw-semibold mt-1"
                    />
                  </Col>

                  {/* Content Editor */}
                  <Col xs={12}>
                    <FormLabel className="fw-semibold">Page Content</FormLabel>
                    <div style={{ height: "300px", marginBottom: "40px" }} className={validationErrors.content ? "is-invalid-quill" : ""}>
                      <ReactQuill
                        theme="snow"
                        value={formData.content || ""}
                        onChange={(val) => handleChange("content", val)}
                        style={{ height: "100%" }}
                        className={validationErrors.content ? "border border-danger" : ""}
                      />
                    </div>
                    {validationErrors.content && <div className="text-danger mt-1 fs-14">{validationErrors.content}</div>}
                  </Col>

                  {/* Widgets (Multi-select) */}
                  <Col xs={12}>
                    <FormLabel className="fw-semibold mt-4">
                      Associated Widgets
                    </FormLabel>
                    <Select
                      isMulti
                      options={widgetOptions}
                      value={widgetOptions.filter((w) => formData.widgets?.includes(w.value))}
                      onChange={(selected) => {
                        const vals = selected.map((s) => s.value);
                        handleChange("widgets", vals);
                      }}
                      classNamePrefix="react-select"
                      placeholder="Select widgets to include on this page..."
                      className={validationErrors.widgets ? "is-invalid" : ""}
                    />
                    {validationErrors.widgets && <div className="invalid-feedback d-block">{validationErrors.widgets}</div>}
                  </Col>

                  {/* SEO Section */}
                  <Col xs={12} className="mt-5">
                    <h6 className="fw-bold mb-3 border-bottom pb-2">SEO Configuration</h6>
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold">Meta Title</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="SEO Title"
                      value={formData.metaTitle || ""}
                      onChange={(e) => handleChange("metaTitle", e.target.value)}
                      isInvalid={!!validationErrors.metaTitle}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.metaTitle}
                    </FormControl.Feedback>
                  </Col>

                  <Col md={6}>
                    <FormLabel className="fw-semibold">Meta Keywords</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="keyword1, keyword2, keyword3"
                      value={formData.metaKeywords || ""}
                      onChange={(e) => handleChange("metaKeywords", e.target.value)}
                      isInvalid={!!validationErrors.metaKeywords}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.metaKeywords}
                    </FormControl.Feedback>
                  </Col>

                  <Col xs={12}>
                    <FormLabel className="fw-semibold">Meta Description</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={3}
                      placeholder="Brief description for search engines..."
                      value={formData.metaDescription || ""}
                      onChange={(e) => handleChange("metaDescription", e.target.value)}
                      isInvalid={!!validationErrors.metaDescription}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.metaDescription}
                    </FormControl.Feedback>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip id="tooltip-cancel-form">Cancel</Tooltip>}
                  >
                    <Link href="/admin/page" className="btn btn-light px-4">
                      Cancel
                    </Link>
                  </OverlayTrigger>

                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id="tooltip-submit-form">
                        {isEdit ? "Update" : "Create"}
                      </Tooltip>
                    }
                  >
                    <Button
                      type="submit"
                      variant="primary"
                      className="px-4 fw-semibold d-flex align-items-center gap-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          {isEdit ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Icon icon={isEdit ? "save" : "plus"} />
                          {isEdit ? "Update" : "Create"}
                        </>
                      )}
                    </Button>
                  </OverlayTrigger>
                </div>
              </CardBody>
            </Card>
          </form>
        </Col>
      </Row>
    </>
  );
};

export default PageForm;
