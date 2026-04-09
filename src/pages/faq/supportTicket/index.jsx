import { IconRegistry } from "#components";
import React, { useState } from "react";
import {
  Row,
  Col,
  Tab,
  Nav,
  Button,
  Modal,
  Form,
  Badge,
} from "react-bootstrap";
import "./SupportTicket.scss";
import useSupportTicket from "./supportTicket";

// Ticket Details Modal Component
const TicketDetailsModal = ({ show, onHide, ticket }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!ticket) return null;

  // Helper function to check if file is an image
  const isImageFile = (filename) => {
    if (!filename) return false;
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
    ];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some((ext) => lowerFilename.endsWith(ext));
  };

  // Helper function to parse attachments from API response
  const parseAttachments = (attachmentData) => {
    if (!attachmentData) return [];

    // If it's already an array, return as is
    if (Array.isArray(attachmentData)) {
      return attachmentData;
    }

    // If it's a string, try to parse it as JSON
    if (typeof attachmentData === "string") {
      try {
        const parsed = JSON.parse(attachmentData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        // Failed to parse attachment data
        // If parsing fails, treat it as a single attachment
        return [attachmentData];
      }
    }

    // If it's an object, wrap it in an array
    if (typeof attachmentData === "object") {
      return [attachmentData];
    }

    return [];
  };

  // Parse attachments from the ticket data
  const attachments = parseAttachments(ticket.attachment);

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      resolved: "success",
      reject: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "fas fa-clock",
      resolved: "fas fa-check-circle",
      reject: "fas fa-times-circle",
    };
    return icons[status] || "fas fa-question-circle";
  };

  // Helper function to safely mask email
  const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return "N/A";
    try {
      return email.replace(/(.{3}).*(@.*)/, '$1*****$2');
    } catch (error) {
      return email || "N/A";
    }
  };

  // Helper function to safely mask phone number
  const maskPhone = (phone) => {
    if (!phone) return "N/A";
    
    // Convert to string if it's a number
    const phoneStr = String(phone);
    
    // Remove any non-digit characters
    const cleanPhone = phoneStr.replace(/\D/g, '');
    
    if (cleanPhone.length < 5) return "N/A";
    
    try {
      // Show first 2 digits + asterisks + last 3 digits
      return cleanPhone.replace(/(.{2}).*(.{3})/, '$1*******$2');
    } catch (error) {
      return phoneStr || "N/A";
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="ticket-details-modal"
    >
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title className="modal-title-custom">
          <span className="ticket-id-display">
            <i className="fas fa-hashtag me-1"></i>
            {ticket.ticket_id || ticket.id}
          </span>
          <span className="ticket-status-display">
            <i className={`${getStatusIcon(ticket.status)} me-2`}></i>
            {getStatusBadge(ticket.status)}
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body-custom">
        <div className="ticket-details-content">
          {/* Ticket Title */}
          <div className="detail-section">
            <h4 className="section-title">
              <i className="fas fa-heading me-2"></i>
              Title
            </h4>
            <p className="section-content">{ticket.title || ticket.name}</p>
          </div>

          {/* Ticket Description */}
          <div className="detail-section">
            <h4 className="section-title">
              <i className="fas fa-align-left me-2"></i>
              Description
            </h4>
            <p className="section-content">
              {ticket.issue || ticket.description}
            </p>
          </div>

          {/* Ticket Categories */}
          <div className="detail-section">
            <h4 className="section-title">
              <i className="fas fa-tags me-2"></i>
              Categories
            </h4>
            <div className="categories-display">
              <span className="category-badge">
                <i className="fas fa-tag me-1"></i>
                {ticket.category?.name || ticket.category || "N/A"}
              </span>
              {ticket.subCategory?.name && (
                <span className="sub-category-badge">
                  <i className="fas fa-tags me-1"></i>
                  {ticket.subCategory.name}
                </span>
              )}
            </div>
          </div>

          {/* Ticket Information */}
          <div className="detail-section">
            <h4 className="section-title">
              <i className="fas fa-info-circle me-2"></i>
              Ticket Information
            </h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">
                  <i className="fas fa-user me-1"></i>
                  Created By:
                </span>
                <span className="info-value">
                  {ticket.username || ticket.user_name || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">
                  <i className="fas fa-envelope me-1"></i>
                  Email:
                </span>
                <span className="info-value">
                  {maskEmail(ticket.email)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">
                  <i className="fas fa-phone me-1"></i>
                  Phone:
                </span>
                <span className="info-value">
                  {maskPhone(ticket.phone_no || ticket.phone || ticket.mobile || ticket.mobileNo)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">
                  <i className="fas fa-calendar-plus me-1"></i>
                  Created Date:
                </span>
                <span className="info-value">
                  {formatDate(
                    ticket.ticket_create_at ||
                      ticket.created_at ||
                      ticket.createdAt
                  )}
                </span>
              </div>
              {ticket.ticket_resolve_at && (
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-calendar-check me-1"></i>
                    Resolved Date:
                  </span>
                  <span className="info-value">
                    {formatDate(ticket.ticket_resolve_at)}
                  </span>
                </div>
              )}
              {ticket.resolve_by && (
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-user-check me-1"></i>
                    Resolved By:
                  </span>
                  <span className="info-value">{ticket.resolve_by}</span>
                </div>
              )}
              {ticket.status === "reject" && ticket.reject_at && (
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-calendar-times me-1"></i>
                    Rejected Date:
                  </span>
                  <span className="info-value">
                    {formatDate(ticket.reject_at)}
                  </span>
                </div>
              )}
              {ticket.status === "reject" && ticket.reject_by && (
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-user-times me-1"></i>
                    Rejected By:
                  </span>
                  <span className="info-value">{ticket.reject_by}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Details */}
          {(ticket.resolve_description || ticket.resolve_image) && (
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-check-double me-2"></i>
                Resolution Details
              </h4>
              {ticket.resolve_description && (
                <p className="section-content">{ticket.resolve_description}</p>
              )}

              {/* Resolution Images */}
              {ticket.resolve_image && (
                <div className="resolve-images-section">
                  <h5 className="section-subtitle">
                    <i className="fas fa-images me-2"></i>
                    Resolution Images
                  </h5>
                  <div className="resolve-images-display">
                    {(() => {
                      const resolveImages = parseAttachments(
                        ticket.resolve_image
                      );
                      return resolveImages.map((imageUrl, index) => {
                        const imageName = imageUrl.split("/").pop();
                        const isImage = isImageFile(imageName);

                        return isImage ? (
                          <div key={index} className="resolve-image-item">
                            <img
                              src={imageUrl}
                              alt={imageName}
                              className="resolve-image-thumbnail"
                              onClick={() =>
                                setSelectedImage({
                                  url: imageUrl,
                                  name: imageName,
                                })
                              }
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "inline";
                              }}
                            />
                            <span
                              className="attachment-icon"
                              style={{ display: "none" }}
                            >
                              📎
                            </span>
                          </div>
                        ) : null;
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rejection Details */}
          {ticket.status === "reject" &&
            (ticket.reject_reason || ticket.reject_description) && (
              <div className="detail-section">
                <h4 className="section-title">
                  <i className="fas fa-times-circle me-2"></i>
                  Rejection Details
                </h4>
                {ticket.reject_reason && (
                  <p className="section-content">
                    <strong>Reason:</strong> {ticket.reject_reason}
                  </p>
                )}
                {ticket.reject_description && (
                  <p className="section-content">
                    <strong>Description:</strong> {ticket.reject_description}
                  </p>
                )}
                {ticket.reject_by && (
                  <p className="section-content">
                    <strong>Rejected By:</strong> {ticket.reject_by}
                  </p>
                )}
                {ticket.reject_at && (
                  <p className="section-content">
                    <strong>Rejected Date:</strong> {formatDate(ticket.reject_at)}
                  </p>
                )}
              </div>
            )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-paperclip me-2"></i>
                Attachments ({attachments.length})
              </h4>
              <div className="attachments-display">
                {attachments.map((attachment, index) => {
                  const attachmentUrl = attachment;
                  const attachmentName = attachment.split("/").pop();
                  const isImage = isImageFile(attachmentName);

                  return (
                    <div key={index} className="attachment-item">
                      {isImage ? (
                        <div className="image-attachment">
                          <img
                            src={attachmentUrl}
                            alt={attachmentName}
                            className="attachment-image"
                            onClick={() =>
                              setSelectedImage({
                                url: attachmentUrl,
                                name: attachmentName,
                              })
                            }
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "inline";
                            }}
                          />
                          <div className="image-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() =>
                                setSelectedImage({
                                  url: attachmentUrl,
                                  name: attachmentName,
                                })
                              }
                            >
                              <i className="fas fa-eye me-1"></i>
                              View
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="file-attachment">
                          <span className="attachment-icon">📎</span>
                          <span className="attachment-name">{attachmentName}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            href={attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-download me-1"></i>
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>
      </Modal.Body>
      <Modal.Footer className="modal-footer-custom">
        <Button variant="outline-secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          Close
        </Button>
      </Modal.Footer>

      {/* Image Preview Modal */}
      <Modal
        show={!!selectedImage}
        onHide={() => setSelectedImage(null)}
        size="lg"
        centered
        className="image-preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-image me-2"></i>
            {selectedImage?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSelectedImage(null)}>
            <i className="fas fa-times me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

// Support Ticket Modal Component
const CreateTicketModal = ({ show, onHide, onTicketCreated }) => {
  const {
    categories,
    subCategories,
    isLoading,
    error,
    successMessage,
    formData,
    formErrors,
    handleChange,
    handleSubmit,
    handleFileUpload,
    removeAttachment,
    setError,
  } = useSupportTicket();

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="support-ticket-modal"
    >
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title className="modal-title-custom">
          Create Support Ticket
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body-custom">
        {/* Success Message Display */}
        {successMessage && (
          <div className="alert alert-success" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
          </div>
        )}

        {/* Error Message Display */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <Button
              variant="link"
              size="sm"
              className="float-end p-0"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </div>
        )}

        <Form
          onSubmit={(e) => handleSubmit(e, onHide, onTicketCreated)}
          className="support-ticket-form"
        >
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 form-group-custom">
                <Form.Label className="form-label-custom">
                  Category <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  className={`form-select-custom ${formErrors.category ? 'is-invalid' : ''}`}
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">
                    {isLoading && categories.length === 0
                      ? "Loading categories..."
                      : categories.length === 0
                      ? "No categories available"
                      : "Select a category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
                {formErrors.category && (
                  <div className="text-danger small mt-1">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {formErrors.category}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3 form-group-custom">
                <Form.Label className="form-label-custom">
                  Sub Category <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  className={`form-select-custom ${formErrors.subCategory ? 'is-invalid' : ''}`}
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  required
                  disabled={!formData.category || isLoading}
                >
                  <option value="">
                    {!formData.category
                      ? "Awaiting category selection"
                      : isLoading
                      ? "Loading sub-categories..."
                      : subCategories.length === 0
                      ? "No sub-categories available"
                      : "Select a sub-category"}
                  </option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </Form.Select>
                {formErrors.subCategory && (
                  <div className="text-danger small mt-1">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {formErrors.subCategory}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3 form-group-custom">
            <Form.Label className="form-label-custom">
              Title <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              className={`form-control-custom ${formErrors.title ? 'is-invalid' : ''}`}
              type="text"
              name="title"
              placeholder="Write a short title summing up your issue"
              value={formData.title}
              onChange={handleChange}
              required
            />
            {formErrors.title && (
              <div className="text-danger small mt-1">
                <i className="fas fa-exclamation-circle me-1"></i>
                {formErrors.title}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3 form-group-custom">
            <Form.Label className="form-label-custom">
              Explain your issue <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              className={`form-control-custom ${formErrors.description ? 'is-invalid' : ''}`}
              as="textarea"
              name="description"
              rows={4}
              placeholder="Write about your issue within 1000 characters"
              value={formData.description}
              onChange={handleChange}
              maxLength={1000}
              required
            />
            <div className="character-count text-muted text-end mt-1">
              {formData.description.length}/1000
            </div>
            {formErrors.description && (
              <div className="text-danger small mt-1">
                <i className="fas fa-exclamation-circle me-1"></i>
                {formErrors.description}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3 form-group-custom">
            <Form.Label className="form-label-custom">
              Attachments (Optional) ({formData.attachments.length}/3)
            </Form.Label>
            {formData.attachments.length > 0 && (
              <div className="attachments-list mb-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-name">
                      <i className="fas fa-paperclip me-2"></i>
                      {file.name}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="remove-attachment-btn"
                      onClick={() => removeAttachment(index)}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {formData.attachments.length < 3 && (
              <Form.Control
                className="form-control-custom file-input-custom"
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                disabled={isLoading}
              />
            )}
            <div className="text-muted small mt-1">
              <i className="fas fa-info-circle me-1"></i>
              You can upload up to 3 files. Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX (Max 5MB each)
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="modal-footer-custom">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          className="btn-cancel"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={(e) => handleSubmit(e, onHide, onTicketCreated)}
          className="btn-submit"
          type="submit"
          disabled={
            !formData.category ||
            !formData.subCategory ||
            !formData.title ||
            !formData.description ||
            isLoading
          }
        >
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Creating...
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i>
              Raise Ticket
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Support Tickets Component
const SupportTickets = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Get data from the hook
  const { tickets, ticketCounts, isTicketsLoading, error, fetchTickets, lastRefreshTime } =
    useSupportTicket();

  // Handle ticket click
  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetailsModal(true);
  };

  // Handle tab change with smooth transition
  const handleTabChange = (tabKey) => {
    // Add a small delay to allow for smooth transition
    setTimeout(() => {
      setActiveTab(tabKey);
      // Refresh data when switching tabs to ensure latest information
      fetchTickets(false);
    }, 100);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      resolved: "success",
      reject: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      High: "danger",
      Medium: "warning",
      Low: "success",
    };
    return <Badge bg={variants[priority] || "secondary"}>{priority}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "N/A";
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(timestamp)) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  return (
    <div className="support-tickets-container">
      <div className="tickets-main-content">
        <div className="tickets-header">
          <div className="header-top">
            <div className="header-left">
              <h3>Your Support Tickets</h3>
              <p className="header-subtitle">
                Manage and track your support requests
                <span className="auto-refresh-status">
                  <i className="fas fa-sync-alt me-1"></i>
                  Auto-refresh active
                </span>
                {lastRefreshTime && (
                  <span className="auto-refresh-indicator">
                    <i className="fas fa-clock me-1"></i>
                    Last updated: {formatTimeAgo(lastRefreshTime)}
                  </span>
                )}
              </p>
            </div>
            <div className="header-right">
              <div className="button-wrapper">
                <Button
                  variant="primary"
                  size="lg"
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="create-ticket-btn"
                >
                  <span className="btn-icon">+</span>
                  <span className="btn-text">CREATE TICKET</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
              <Button
                variant="link"
                size="sm"
                className="float-end p-0"
                onClick={() => fetchTickets()}
              >
                <i className="fas fa-redo me-1"></i>
                Retry
              </Button>
            </div>
          )}

          <div className="header-tabs">
            <Nav variant="tabs" className="tickets-tabs">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "active"}
                  onClick={() => handleTabChange("active")}
                >
                  <span className="tab-icon">📋</span>
                  <span className="tab-text">Active</span>
                  <span className="tab-count">{ticketCounts.active || 0}</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "resolved"}
                  onClick={() => handleTabChange("resolved")}
                >
                  <span className="tab-icon">✅</span>
                  <span className="tab-text">Resolved</span>
                  <span className="tab-count">
                    {ticketCounts.resolved || 0}
                  </span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "reject"}
                  onClick={() => handleTabChange("reject")}
                >
                  <span className="tab-icon">❌</span>
                  <span className="tab-text">Rejected</span>
                  <span className="tab-count">{ticketCounts.reject || 0}</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "all"}
                  onClick={() => handleTabChange("all")}
                >
                  <span className="tab-icon">📊</span>
                  <span className="tab-text">All</span>
                  <span className="tab-count">{ticketCounts.all || 0}</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
        </div>

        <div className="tickets-content tab-content-transition">
          {isTicketsLoading ? (
            <div className="loading-tickets">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading tickets...</p>
            </div>
          ) : tickets[activeTab] && tickets[activeTab].length > 0 ? (
            <div className="tickets-list">
              {tickets[activeTab].map((ticket) => (
                <div
                  key={ticket.id || ticket.ticket_id}
                  className="ticket-card"
                  onClick={() => handleTicketClick(ticket)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="ticket-header">
                    <div className="ticket-id">
                      <i className="fas fa-hashtag me-1"></i>
                      {ticket.ticket_id || ticket.id}
                    </div>
                    <div className="ticket-status">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                  <div className="ticket-title">
                    <i className="fas fa-ticket-alt me-2"></i>
                    {ticket.title || ticket.name}
                  </div>
                  <div className="ticket-details">
                    <span className="category">
                      <i className="fas fa-tag me-1"></i>
                      {ticket.category?.name || ticket.category}
                    </span>
                    {ticket.subCategory?.name && (
                      <span className="sub-category">
                        <i className="fas fa-tags me-1"></i>
                        {ticket.subCategory.name}
                      </span>
                    )}
                    <span className="created">
                      <i className="fas fa-calendar me-1"></i>
                      Created: {formatDate(
                        ticket.ticket_create_at ||
                          ticket.created_at ||
                          ticket.createdAt
                      )}
                    </span>
                  </div>
                  <div className="ticket-description">
                    <i className="fas fa-comment me-2"></i>
                    {ticket.issue || ticket.description}
                  </div>
                  {ticket.attachment && (
                    <div className="ticket-attachments">
                      <i className="fas fa-paperclip me-1"></i>
                      <span>Has attachments</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-tickets">
              <div className="no-tickets-illustration">
                <div className="illustration-container">
                  <div className="document-stack">
                    <div className="document front">
                      <div className="chart">
                        <div className="bar bar1"></div>
                        <div className="bar bar2"></div>
                        <div className="bar bar3"></div>
                        <div className="bar bar4"></div>
                      </div>
                    </div>
                    <div className="document back"></div>
                  </div>
                  <div className="geometric-shapes">
                    <div className="shape triangle"></div>
                    <div className="shape circle"></div>
                    <div className="shape square"></div>
                  </div>
                </div>
              </div>
              <h4>You have no {activeTab} tickets</h4>
              <p>
                {activeTab === "active" && "All your tickets have been resolved or are being processed."}
                {activeTab === "resolved" && "No tickets have been resolved yet."}
                {activeTab === "reject" && "No tickets have been rejected."}
                {activeTab === "all" && "Create your first ticket to get started."}
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="create-first-ticket-btn"
              >
                <i className="fas fa-plus me-2"></i>
                Create Your First Ticket
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          show={showCreateModal}
          onHide={() => {
            setShowCreateModal(false);
            // Refresh tickets when modal is closed to show any updates
            fetchTickets(false);
          }}
          onTicketCreated={fetchTickets}
        />
      )}

      {/* Ticket Details Modal */}
      {showTicketDetailsModal && selectedTicket && (
        <TicketDetailsModal
          show={showTicketDetailsModal}
          onHide={() => {
            setShowTicketDetailsModal(false);
            setSelectedTicket(null);
            // Refresh tickets when modal is closed to show any updates
            fetchTickets(false);
          }}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
};

export default SupportTickets;
