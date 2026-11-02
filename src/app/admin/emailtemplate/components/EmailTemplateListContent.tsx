"use client";
import Icon from "@/components/wrappers/Icon";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Col,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchEmailTemplates,
  addEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  clearEmailTemplateError,
  EmailTemplate,
} from "@/redux/slices/admin/emailTemplateSlice";
import { usePageAccess } from "@/hooks/useAccess";
import EmailTemplateModal from "./EmailTemplateModal";

const EmailTemplateListContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { templates, loading, error } = useAppSelector((state) => state.emailTemplates);

  const { write: canWrite, delete: canDelete } = usePageAccess("EmailTemplate");

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchEmailTemplates({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Swal.fire("Error", error, "error");
      dispatch(clearEmailTemplateError());
    }
  }, [error, dispatch]);

  const handleOpenAdd = () => {
    setSelectedTemplate(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  };

  const handleSaveTemplate = async (record: EmailTemplate) => {
    try {
      const isEdit = templates.some((t) => (t._id || t.id) === (record._id || record.id));

      if (isEdit) {
        await dispatch(updateEmailTemplate({ id: record._id || record.id || "", templateData: record })).unwrap();
        setAlertMsg(`Template "${record.title}" updated successfully.`);
        setTimeout(() => setAlertMsg(null), 3500);
      } else {
        await dispatch(addEmailTemplate(record)).unwrap();
        setAlertMsg(`Template "${record.title}" created successfully.`);
        setTimeout(() => setAlertMsg(null), 3500);
      }
    } catch (err: any) {
      console.error("Error saving template:", err);
      Swal.fire("Error", err || "Failed to save template", "error");
    }
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    Swal.fire({
      title: "Delete Template?",
      text: `Are you sure you want to delete template "${title}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteEmailTemplate(id)).unwrap();
          setAlertMsg(`Template "${title}" has been deleted.`);
          setTimeout(() => setAlertMsg(null), 3500);
          Swal.fire({
            title: "Deleted!",
            text: `Template "${title}" has been deleted.`,
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
        } catch (err: any) {
          console.error("Error deleting template:", err);
          Swal.fire("Error", err || "Failed to delete template", "error");
        }
      }
    });
  };

  const safeTemplates = Array.isArray(templates) ? templates : [];
  const filteredTemplates = safeTemplates.filter(
    (t) =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unique_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {alertMsg && (
        <Alert
          variant="success"
          onClose={() => setAlertMsg(null)}
          dismissible
          className="d-flex align-items-center gap-2 mb-3"
        >
          <Icon icon="check-circle" className="fs-18 flex-shrink-0" />
          <span>{alertMsg}</span>
        </Alert>
      )}

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ width: "300px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {canWrite && (
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-1 fw-semibold"
              onClick={handleOpenAdd}
            >
              <Icon icon="plus" /> Add Template
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Row className="g-4">
          {filteredTemplates.map((template) => (
            <Col md={6} xl={4} key={template._id || template.id}>
              <Card className="h-100 shadow-sm border">
                <CardHeader className="d-flex align-items-center justify-content-between bg-light-subtle py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Badge
                      bg="primary-subtle"
                      className="text-primary px-3 py-1 fs-13 fw-semibold"
                    >
                      {template.title}
                    </Badge>
                  </div>
                  <Badge
                    bg={
                      template.isActive
                        ? "success-subtle"
                        : "warning-subtle"
                    }
                    className={`text-${template.isActive ? "success" : "warning-emphasis"} fs-11`}
                  >
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>

                <CardBody className="py-3">
                  <p className="fw-semibold text-dark mb-1 fs-14">Code: {template.unique_code}</p>
                  <p className="text-muted fs-13 mb-3 text-truncate" title={template.subject}>
                    Subject: {template.subject}
                  </p>
                  <div className="bg-light p-2 rounded text-muted fs-12 mb-3" style={{ maxHeight: "80px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {template.message?.replace(/<[^>]+>/g, '').substring(0, 100)}...
                  </div>

                  <div className="d-flex align-items-center justify-content-between py-2 border-top">
                    <div className="text-center w-50 border-end">
                      <div className="fw-bold fs-14 text-dark text-truncate px-2" title={template.from_name}>
                        {template.from_name}
                      </div>
                      <div className="text-muted fs-12">From Name</div>
                    </div>
                    <div className="text-center w-50">
                      <div className="fw-bold fs-14 text-primary text-truncate px-2" title={template.from_email}>
                        {template.from_email}
                      </div>
                      <div className="text-muted fs-12">From Email</div>
                    </div>
                  </div>
                </CardBody>

                <CardFooter className="bg-light-subtle d-flex justify-content-end align-items-center py-2">
                  <div className="d-flex align-items-center gap-1">
                    {canWrite && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-edit-modal-${template._id || template.id}`}>
                            Edit Template
                          </Tooltip>
                        }
                      >
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => handleOpenEdit(template)}
                        >
                          <Icon icon="edit" className="text-primary fs-14" />
                        </Button>
                      </OverlayTrigger>
                    )}
                    {canDelete && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-delete-${template._id || template.id}`}>
                            Delete Template
                          </Tooltip>
                        }
                      >
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() =>
                            handleDeleteTemplate(template._id || template.id || "", template.title)
                          }
                        >
                          <Icon icon="trash-2" className="text-danger fs-14" />
                        </Button>
                      </OverlayTrigger>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </Col>
          ))}
          {filteredTemplates.length === 0 && (
            <Col xs={12}>
              <div className="text-center py-5 text-muted">
                <Icon
                  icon="inbox"
                  className="fs-24 mb-2 d-block mx-auto text-muted"
                />
                No templates found. Create a new email template to get started.
              </div>
            </Col>
          )}
        </Row>
      )}

      <EmailTemplateModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </>
  );
};

export default EmailTemplateListContent;
