import Modal from "react-bootstrap/Modal";
import React from "react";
import "./termsModal.scss"

const TermsModal = (props) => {
  const { showTermsModal, handleCloseTermsModal,termsAndConditions } = props;
  return (
    <Modal
      className="fade terms_modal modal-all-data"
      show={showTermsModal}
      onHide={handleCloseTermsModal}
      role="dialog"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Disclaimer</h5>
          <button
            type="button"
            className="btn-close"
            onClick={handleCloseTermsModal}
          ></button>
        </div>
        <div className="modal-body">
          <p>{termsAndConditions}</p>
        </div>
        
      </div>
    </Modal>
  );
};

export default TermsModal;
