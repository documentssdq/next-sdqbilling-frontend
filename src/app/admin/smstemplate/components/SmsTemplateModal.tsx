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
import { SmsTemplate } from "@/redux/slices/admin/smsTemplateSlice";

interface SmsTemplateModalProps {
  show: boolean;
  onHide: () => void;
  template: SmsTemplate | null;
  onSave: (template: SmsTemplate) => void;
}

const SmsTemplateModal: React.FC<SmsTemplateModalProps> = ({
  show,
  onHide,
  template,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<SmsTemplate>>({
    title: "",
    unique_code: "",
    subject: "",
    template_id: "",
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
        template_id: "",
        message: "",
        isActive: true,
      });
    }
  }, [template, show]);

  const handleChange = (field: keyof SmsTemplate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.unique_code || !formData.template_id || !formData.message) return;

    const record: SmsTemplate = {
      _id: template?._id,
      id: template?.id,
      title: formData.title || "",
      unique_code: formData.unique_code || "",
      subject: formData.subject || "",
      template_id: formData.template_id || "",
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
              icon={template ? "message-square" : "plus-circle"}
              className="text-primary"
            />
            {template ? `Edit SMS Template: ${template.title}` : "Add SMS Template"}
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
                placeholder="e.g. OTP Message"
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
                placeholder="e.g. OTP_MESSAGE"
                required
                value={formData.unique_code || ""}
                onChange={(e) => handleChange("unique_code", e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              />
            </Col>
            <Col md={6}>
              <FormLabel>
                Template ID <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. DLT Template ID"
                required
                value={formData.template_id || ""}
                onChange={(e) => handleChange("template_id", e.target.value)}
              />
            </Col>
            <Col md={6}>
              <FormLabel>
                Subject
              </FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. Welcome (Optional)"
                value={formData.subject || ""}
                onChange={(e) => handleChange("subject", e.target.value)}
              />
            </Col>
            <Col xs={12}>
              <FormLabel>
                Message <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                as="textarea"
                rows={4}
                placeholder="Enter SMS content..."
                required
                value={formData.message || ""}
                onChange={(e) => handleChange("message", e.target.value)}
              />
              <div className="text-muted fs-12 mt-1">Variables should be handled depending on backend integration.</div>
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

export default SmsTemplateModal;
