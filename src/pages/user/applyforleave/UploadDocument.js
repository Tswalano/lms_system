import React, { useContext, useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { Alert, Box, Collapse, Grid, IconButton } from "@mui/material";
import { validateDocument } from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
import APIEndPoints from "../../../api/APIEndPoints";
import { AuthContext } from "../../../context/AuthContext";
import { uploadDocument } from "../../../api/API";
import CloseIcon from "@mui/icons-material/Close";
import DocumentForm from "./UploadDocumentConfig";
import Paragraph from "../../../components/ui/Paragraph";

function UploadDocument({ leaveId }) {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});
  const ctx = useContext(AuthContext);

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isDocument = validateDocument(formValues.document);

    // Set isError based on the validation results
    setIsError(isDocument !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    //progress
    setProgress(true);

    const fileInput = document.getElementById("document");
    const file = fileInput.files[0];
    const leaveRequestId = leaveId;

    const arrData = {
      file,
      leaveRequestId,
    };
    const endpoint = new APIEndPoints().uploadDocument();

    const response = await uploadDocument(endpoint, arrData, ctx.token);
    //  Checks if leave submited is valid

    if (response.status === 200) {
      setAlertMessage(response.data.message);
      setAlertType("success");
      setProgress(false);
      setResponse(true);
      setOpen(true);
      window.location.reload();
    } else {
      // set error
      setAlertMessage(response.data.message);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ paddingBottom: "20px" }}>
        <Paragraph
          text={"Attache a supporting document for this leave request."}
          fontWeight={"bold"}
        />
      </Box>
      {response ? (
        <Collapse in={open}>
          <Alert
            severity={alertType}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOpen(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {alertMessage}
          </Alert>
        </Collapse>
      ) : (
        <Box></Box>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <FormFieldMapper
            formFields={DocumentForm.formFields}
            onChange={handleChange}
            gridSizes={GridSizes.onbordingFieldSizes}
          />
          <Grid item xs={12} sm={12} md={12}>
            <SubmitButton
              disabled={isError}
              label="Upload Leave Document"
              type="submit"
              progress={progress}
            />
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default UploadDocument;
