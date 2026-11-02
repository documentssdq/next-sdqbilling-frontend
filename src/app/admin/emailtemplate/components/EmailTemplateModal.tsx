"use client";
import Icon from "@/components/wrappers/Icon";
import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  FormControl,
  FormLabel,
  FormSelect,
  Modal,
  Row,
} from "react-bootstrap";
import { EmailTemplate } from "@/redux/slices/admin/emailTemplateSlice";

interface EmailTemplateModalProps {
  show: boolean;
  onHide: () => void;
  template: EmailTemplate | null;
  onSave: (template: EmailTemplate) => void;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  show,
  onHide,
  template,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    title: "",
    unique_code: "",
    subject: "",
    from_email: "",
    from_name: "",
    message: "",
    isActive: true,
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        title: "",
        unique_code: "",
        subject: "",
        from_email: "",
        from_name: "",
        message: "",
        isActive: true,
      });
    }
  }, [template, show]);

  const handleChange = (field: keyof EmailTemplate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.unique_code || !formData.subject || !formData.message) return;

    const record: EmailTemplate = {
      _id: template?._id,
      id: template?.id,
      title: formData.title || "",
      unique_code: formData.unique_code || "",
      subject: formData.subject || "",
      from_email: formData.from_email || "",
      from_name: formData.from_name || "",
      message: formData.message || "",
      isActive: formData.isActive ?? true,
    };

    onSave(record);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-16 d-flex align-items-center gap-2">
            <Icon
              icon={template ? "mail" : "plus-circle"}
              className="text-primary"
            />
            {template ? `Edit Template: ${template.title}` : "Add Email Template"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="g-3">
            <Col md={6}>
              <FormLabel>
                Title <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. Welcome Email"
                required
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <FormLabel>
                Unique Code <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. WELCOME_EMAIL"
                required
                value={formData.unique_code || ""}
                onChange={(e) => handleChange("unique_code", e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              />
            </Col>
            <Col md={12}>
              <FormLabel>
                Subject <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. Welcome to our platform!"
                required
                value={formData.subject || ""}
                onChange={(e) => handleChange("subject", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <FormLabel>
                From Name
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. Admin Team"
                value={formData.from_name || ""}
                onChange={(e) => handleChange("from_name", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <FormLabel>
                From Email
              </FormLabel>
              <FormControl
                type="email"
                placeholder="e.g. admin@example.com"
                value={formData.from_email || ""}
                onChange={(e) => handleChange("from_email", e.target.value)}
              />
            </Col>
            <Col xs={12}>
              <FormLabel>
                Message (HTML allowed) <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                as="textarea"
                rows={6}
                placeholder="Enter email content..."
                required
                value={formData.message || ""}
                onChange={(e) => handleChange("message", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <FormLabel>Status</FormLabel>
              <FormSelect
                value={formData.isActive ? "Active" : "Inactive"}
                onChange={(e) => handleChange("isActive", e.target.value === "Active")}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </FormSelect>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="light" onClick={onHide} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="d-flex align-items-center gap-1"
          >
            <Icon icon="save" />
            {template ? "Save Template" : "Create Template"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default EmailTemplateModal;
