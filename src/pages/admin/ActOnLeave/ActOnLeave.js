import { React, useState, useEffect } from "react";
import PaperComponent from "../../../components/ui/Paper";
import { Box, Grid, Breadcrumbs, Typography, Divider } from "@mui/material";
import Paragraph from "../../../components/ui/Paragraph";
import SubmitButton from "../../../components/ui/Button";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ActOnLeaveConfig from "./ActOnLeaveConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { validateDropDown } from "../../../components/form/Validations";
// import { useEffect } from "react";
import Link from "@mui/material/Link";

function ActOnLeave() {
  // Create a URLSearchParams object with the current URL's query string
  const params = new URLSearchParams(window.location.search);

  // Access the value of employee id from query string
  const employee_id = params.get("id");
  // declare useState variables
  const [empName, setEmpName] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveLength, setLeaveLength] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState("");

  // form values for act on leave form
  const [formValues, setFormValues] = useState({});
  const [isError, setIsError] = useState(false);

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  const handleValidation = () => {
    // use your existing validation functions to approval
    const isOptionValid = validateDropDown(formValues.approval);

    // Set isError based on the validation results
    setIsError(isOptionValid !== null);
  };

  // useEffect(() => {
  //   handleValidation();
  //   // Run the validation when formValues state changes
  // }, [formValues]);

  //hardcoded values (temporary)
  //Set values from the object
  //change to axios
  if (!empName && !leaveType && !startDate && !comments && !attachments) {
    setEmpName("Yagnash Keeka");
    setLeaveType("Annual Leave");
    setStartDate("22/07/2023");
    setEndDate("22/07/2023");
    setLeaveLength("Full Day");
    setComments(
      "For writers looking for a way to get their creative writing juices flowing, using a random paragraph can be a great way to do this. One of the great benefits of this tool is that nobody knows what is going to appear in the paragraph. This can be leveraged in a few different ways to force the writer to use creativity. For example, the random paragraph can be used as the beginning paragraph of a story that the writer must finish. I can also be used as a paragraph somewhere inside a short story, or for a more difficult creative challenge, it can be used as the ending paragraph. In every case, the writer is forced to use creativity to incorporate the random paragraph into the story."
    );
    setAttachments("https://disraptor.co.za/");
  }
  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();
    //Feedback value is captured on values that is null
    const formValues = GetFormValues(event);
    //try and catch error to do the integration and capture the form values.
    try {
    } catch (error) {}
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Breadcrumb />
        <br />
        <PaperComponent>
          <Grid container>
            <Grid item xs={12}>
              <Typography
                color="primary"
                fontFamily="Geologica"
                fontWeight="normal"
              >
                Leave Request Details
              </Typography>
              <Divider />
              <Box paddingTop={"20px"}></Box>
            </Grid>
            {/* Shows Employee name */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Employee Name" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees name from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={empName} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Leave Type */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Type" fontWeight={"bold"} />
              </Grid>
              {/* Shows the type of leave from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={leaveType} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Date */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Start Date" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={startDate} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Date */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="End Date" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={endDate} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Leave length */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Length" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={leaveLength} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Comments */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Comment" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees comments from GET on axios */}
              <Grid item xs={8}>
                {/* sets a scroll box if it exceeds a certain height */}
                <Box sx={{ maxHeight: "120px", overflow: "auto" }}>
                  <Paragraph text={comments} fontWeight={"normal"} />
                </Box>
              </Grid>
            </Grid>
            {/* Shows Attachments */}
            <Grid container paddingY={"20px"}>
              <Grid item xs={4}>
                <Paragraph text="Attachments" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees file attached from GET on axios */}
              {/* overflowwrap to wrap text */}
              <Grid item xs={8} sx={{ overflowWrap: "break-word" }}>
                <a
                  href={attachments}
                  style={{ textDecoration: "none" }}
                  target="_blank"
                >
                  <Paragraph text={attachments} fontWeight={"normal"} />
                </a>
              </Grid>
            </Grid>
            <Grid container paddingY={"6px"}>
              <Grid item xs={12}>
                <Typography
                  color="primary"
                  fontFamily="Geologica"
                  fontWeight="normal"
                >
                  Act On Leave
                </Typography>
                <Divider />
              </Grid>
            </Grid>
            <Grid container paddingY={"20px"}>
              <Grid item xs={12}>
                <form onSubmit={handleSubmit}>
                  <Grid container>
                    {/* Maps the dropdown box and TextField  */}
                    <FormFieldMapper
                      formFields={ActOnLeaveConfig.formFields}
                      onChange={handleChange}
                      gridSizes={GridSizes.onbordingFieldSizes}
                    />
                  </Grid>
                  {/* Submit the approval of leave */}
                  <SubmitButton
                    label={"Act on Leave"}
                    type="submit"
                    disabled={isError}
                  ></SubmitButton>
                </form>
              </Grid>
            </Grid>
          </Grid>
        </PaperComponent>
      </Box>
    </>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" href="/home">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/manage-leave">
          Manage Leave
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Act on Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ActOnLeave;
