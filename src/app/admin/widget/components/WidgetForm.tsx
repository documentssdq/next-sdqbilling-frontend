"use client";
import React, { useEffect, useRef, useState } from "react";
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
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addWidget, updateWidget, fetchWidgets, WidgetRecord } from "@/redux/slices/admin/widgetSlice";
import dynamic from "next/dynamic";
import Image from "next/image";
import Swal from "sweetalert2";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface WidgetFormProps {
  mode: "add" | "edit";
  recordId?: string;
}

const WidgetForm: React.FC<WidgetFormProps> = ({ mode, recordId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = mode === "edit";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { records } = useAppSelector((state) => state.widget);

  const [formData, setFormData] = useState<WidgetRecord>({
    id: recordId || "",
    mainTitle: "",
    subTitle: "",
    description: "",
    externalUrl: "",
    image: "",
    displaySequence: 0,
    isActive: true,
  });

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchWidgets());
    }
  }, [dispatch, records.length]);

  useEffect(() => {
    if (isEdit && recordId && records.length > 0) {
      const found = records.find((r) => r.id === recordId);
      if (found) {
        setFormData({ ...found });
        if (found.image) setImagePreview(found.image);
      }
    }
  }, [isEdit, recordId, records]);

  const handleChange = (field: keyof WidgetRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          folder: "widgets"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.mainTitle?.trim()) errors.mainTitle = "Main Title is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please complete all mandatory fields marked with (*).");
      return;
    }
    setValidationErrors({});
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isEdit && formData.id) {
        await dispatch(updateWidget(formData)).unwrap();
      } else {
        await dispatch(addWidget(formData)).unwrap();
      }
      setSaved(true);
      sessionStorage.setItem("widgetAlertMsg", `Widget "${formData.mainTitle}" has been ${isEdit ? "updated" : "created"}.`);
      setTimeout(() => {
        router.push("/admin/widget");
      }, 1200);
    } catch (err: any) {
      const msg = err?.message || "Failed to save widget. Please try again.";
      if (msg.toLowerCase().includes("validation failed")) {
        const backendErrors: Record<string, string> = {};
        const fields = ["mainTitle", "subTitle", "externalUrl", "displaySequence", "image", "description"];
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
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const getImageSrc = (url: string) => {
    if (!url) return "";
    if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }
    return `/${url}`;
  };

  return (
    <>
      <PageBreadcrumb
        title={isEdit ? `Edit Widget (${formData.mainTitle || recordId})` : "Add New Widget"}
        subtitle="Widget Management"
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
        <Alert variant="success" className="d-flex align-items-center gap-2 mb-3">
          <Icon icon="check-circle" className="fs-18 flex-shrink-0" />
          <span>
            Widget "{formData.mainTitle}" {isEdit ? "updated" : "created"} successfully! Redirecting...
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
                    <Icon icon={isEdit ? "edit-3" : "plus-square"} className="fs-20" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">
                      {isEdit ? "Update Widget Details" : "Create New Widget"}
                    </h5>
                    <small className="text-muted">Configure widget content and settings</small>
                  </div>
                </div>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-back-widget">Return to Widgets List</Tooltip>}
                >
                  <Link
                    href="/admin/widget"
                    className="btn btn-light btn-sm d-flex align-items-center gap-1 fw-semibold"
                  >
                    <Icon icon="arrow-left" /> Back to Widgets
                  </Link>
                </OverlayTrigger>
              </CardHeader>

              <CardBody className="p-4">
                <Row className="g-4">
                  {/* Main Title */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">
                      Main Title <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. Featured Banner"
                      value={formData.mainTitle || ""}
                      onChange={(e) => handleChange("mainTitle", e.target.value)}
                      isInvalid={!!validationErrors.mainTitle}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.mainTitle}
                    </FormControl.Feedback>
                  </Col>

                  {/* Sub Title */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">Sub Title</FormLabel>
                    <FormControl
                      type="text"
                      placeholder="e.g. Supporting tagline or subtitle"
                      value={formData.subTitle || ""}
                      onChange={(e) => handleChange("subTitle", e.target.value)}
                      isInvalid={!!validationErrors.subTitle}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.subTitle}
                    </FormControl.Feedback>
                  </Col>

                  {/* External URL */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">External URL</FormLabel>
                    <FormControl
                      type="url"
                      placeholder="https://example.com"
                      value={formData.externalUrl || ""}
                      onChange={(e) => handleChange("externalUrl", e.target.value)}
                      isInvalid={!!validationErrors.externalUrl}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.externalUrl}
                    </FormControl.Feedback>
                    <small className="text-muted fs-12">
                      Optional link for this widget.
                    </small>
                  </Col>

                  {/* Display Sequence */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">Display Sequence</FormLabel>
                    <FormControl
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.displaySequence ?? 0}
                      onChange={(e) => handleChange("displaySequence", parseInt(e.target.value) || 0)}
                      isInvalid={!!validationErrors.displaySequence}
                    />
                    <FormControl.Feedback type="invalid">
                      {validationErrors.displaySequence}
                    </FormControl.Feedback>
                    <small className="text-muted fs-12">Lower number appears first.</small>
                  </Col>

                  {/* Status Toggle */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold mb-2 d-block">Widget Status</FormLabel>
                    <FormCheck
                      type="switch"
                      id="widget-status-switch"
                      label={formData.isActive ? "Active (Visible)" : "Inactive (Hidden)"}
                      checked={formData.isActive ?? true}
                      onChange={(e) => handleChange("isActive", e.target.checked)}
                      className="fs-15 fw-semibold mt-1"
                    />
                  </Col>

                  {/* Image Upload */}
                  <Col md={6}>
                    <FormLabel className="fw-semibold">Widget Image</FormLabel>
                    <div className="d-flex align-items-start gap-3">
                      {imagePreview && (
                        <div className="position-relative border rounded overflow-hidden" style={{ width: 90, height: 90, flexShrink: 0 }}>
                          <Image
                            src={getImageSrc(imagePreview)}
                            alt="Widget Preview"
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
                        {validationErrors.image && <div className="invalid-feedback d-block">{validationErrors.image}</div>}
                        {isUploading && (
                          <div className="d-flex align-items-center gap-2 mt-1 text-muted fs-12">
                            <Spinner animation="border" size="sm" /> Uploading...
                          </div>
                        )}
                        <small className="text-muted fs-12">
                          Accepted: PNG, JPG, JPEG, WEBP. Max 50MB.
                        </small>
                      </div>
                    </div>
                  </Col>

                  {/* Description Editor */}
                  <Col xs={12}>
                    <FormLabel className="fw-semibold">Description</FormLabel>
                    <div style={{ height: "280px", marginBottom: "42px" }}>
                      <ReactQuill
                        theme="snow"
                        value={formData.description || ""}
                        onChange={(val) => handleChange("description", val)}
                        style={{ height: "100%" }}
                        placeholder="Enter widget description or content..."
                        className={validationErrors.description ? "border border-danger" : ""}
                      />
                    </div>
                    {validationErrors.description && <div className="text-danger mt-1 fs-14">{validationErrors.description}</div>}
                  </Col>
                </Row>

                {/* Form Actions */}
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id="tooltip-cancel-widget">Cancel</Tooltip>}
                  >
                    <Link href="/admin/widget" className="btn btn-light px-4">
                      Cancel
                    </Link>
                  </OverlayTrigger>

                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id="tooltip-submit-widget">
                        {isEdit ? "Update" : "Create"}
                      </Tooltip>
                    }
                  >
                    <Button
                      type="submit"
                      variant="primary"
                      className="px-4 fw-semibold d-flex align-items-center gap-1"
                      disabled={isSubmitting || isUploading}
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

export default WidgetForm;
