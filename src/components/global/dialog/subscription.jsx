import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiX, FiArrowUpCircle } from "react-icons/fi";
import "./dialog.scss";
import { images } from "#helpers";

function PaperComponent(props) {
  const nodeRef = React.useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} ref={nodeRef} />
    </Draggable>
  );
}

const Subscription = (props) => {
  const { open, handleClose, message } = props;
  const navigate = useNavigate();
  const subscriptionId = 2;
    if (subscriptionId === 2) return null; 
  const defaultMessage =
    "You don't have the privilege to Re-Generate and View Script in this service if you need this feature please upgrade your service";
  const displayMessage = message || defaultMessage;

  const handleUpgrade = () => {
    handleClose();
    navigate("/plans");
  };

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        className="tab_content single_order_dialog dialog_data subscription-upgrade-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          style={{ cursor: "move" }}
          id="draggable-dialog-title"
          className="subscription-dialog-title"
        >
          <div className="title-wrapper">
            <FiAlertCircle className="title-icon" />
            <span>Upgrade Required</span>
          </div>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </DialogTitle>
        <DialogContent className="upgrade_div">
          <div className="subscription-upgrade-content">
            <div className="upgrade-image-wrapper">
              <img
                src={images["gif/Upgrade.gif"]}
                alt="Upgrade"
                className="upgrade-img"
              />
            </div>
            <div className="upgrade-message-wrapper">
              <p className="upgrade-message">{displayMessage}</p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="subscription-dialog-actions">
          <Button
            onClick={handleClose}
            variant="outlined"
            className="cancel-button"
          >
            Cancel
          </Button>
          <Button
            autoFocus
            onClick={handleUpgrade}
            variant="contained"
            className="upgrade-button"
            startIcon={<FiArrowUpCircle />}
          >
            Upgrade Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default Subscription;
