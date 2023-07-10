import { React, useState } from "react";
import PaperComponent from "../../../components/ui/Paper";
import { Box, Grid, Breadcrumbs, Chip } from "@mui/material";
import Paragraph from "../../../components/ui/Paragraph";
import SubmitButton from "../../../components/ui/Button";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ActOnLeaveConfig from "./ActOnLeaveConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { styled } from "@mui/system";
import { emphasize, createTheme, ThemeProvider } from "@mui/material/styles";
import HomeIcon from "@mui/icons-material/Home";
import { validateDropDown } from "../../../components/form/Validations";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ActOnLeave() {
  const [empName, setEmpName] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [date, setDate] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState("");

  const [formValues, setFormValues] = useState({});
  const [isError, setIsError] = useState(false);

  const nav = useNavigate("");

  const theme = createTheme({
    components: { MuiChip: { defaultProps: { color: "error" } } },
  });

  const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor = "#1FE3A8";
    return {
      backgroundColor,
      height: theme.spacing(3),
      color: "white",
      fontWeight: theme.typography.fontWeightRegular,
      "&:hover, &:focus": {
        backgroundColor: emphasize("#0BADDE", 0.06),
      },
      "&:active": {
        boxShadow: theme.shadows[1],
        backgroundColor: emphasize("#0BADDE", 0.12),
      },
    };
  });

  //If the comments section becomes long then the scroll will be enabled
  const ScrollComments = styled("div")({
    maxHeight: "70%",
    overflowY: "auto",
  });

  function handleHomeClick(event) {
    event.preventDefault();
    nav("/home");
  }

  function handlePageClick(event) {
    event.preventDefault();
    nav("/manage-leave");
  }
  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  const handleValidation = () => {
    // use your existing validation functions to approval
    const isOptionValid = validateDropDown(formValues.approval);

    // Set isError based on the validation results
    setIsError(isOptionValid !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  //hardcoded values (temporary)
  //Set values from the object
  //change to axios
  if (!empName && !leaveType && !date && !comments && !attachments) {
    setEmpName("Yagnash Keeka");
    setLeaveType("Yagnash Keeka");
    setDate("Yagnash Keeka");
    setComments(
      "For writers looking for a way to get their creative writing juices flowing, using a random paragraph can be a great way to do this. One of the great benefits of this tool is that nobody knows what is going to appear in the paragraph. This can be leveraged in a few different ways to force the writer to use creativity. For example, the random paragraph can be used as the beginning paragraph of a story that the writer must finish. I can also be used as a paragraph somewhere inside a short story, or for a more difficult creative challenge, it can be used as the ending paragraph. In every case, the writer is forced to use creativity to incorporate the random paragraph into the story."
    );
    setAttachments(
      "https://www.dexform.com/download/sample-letter-from-your-doctor-or-other-service-provider"
    );
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
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            width: "100%",
          }}
        >
          {/* Breadcrumbs for directing the user to pages */}
          <Breadcrumbs aria-aria-label="breadcrumb">
            <StyledBreadcrumb
              component="a"
              href="#"
              label="Home"
              icon={<HomeIcon fontSize="small" />}
              onClick={handleHomeClick}
            />
            <StyledBreadcrumb
              component="a"
              href="#"
              label="Manage Leave"
              onClick={handlePageClick}
            />
            <StyledBreadcrumb label="Act On Leave" />
          </Breadcrumbs>
          <PaperComponent>
            <Grid container>
              {/* Shows Employee name */}
              <Grid item xs={4} paddingBottom={"3%"}>
                <Paragraph text="Employee Names:" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees name from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={empName} fontWeight={"normal"} />
              </Grid>
              {/* Shows Leave Type */}
              <Grid item xs={4} paddingBottom={"3%"}>
                <Paragraph text="Leave Type:" fontWeight={"bold"} />
              </Grid>
              {/* Shows the type of leave from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={leaveType} fontWeight={"normal"} />
              </Grid>
              {/* Shows Date */}
              <Grid item xs={4} paddingBottom={"3%"}>
                <Paragraph text="Date:" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={date} fontWeight={"normal"} />
              </Grid>
              {/* Shows Comments */}
              <Grid item xs={4} paddingBottom={"4%"}>
                <Paragraph text="Comments:" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees comments from GET on axios */}
              <Grid item xs={8}>
                {/* sets a scroll box if it exceeds a certain height */}
                <ScrollComments>
                  <Paragraph text={comments} fontWeight={"normal"} />
                </ScrollComments>
              </Grid>
              {/* Shows Attachments */}
              <Grid item xs={4} paddingBottom={"4%"}>
                <Paragraph text="Attachments:" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees file attached from GET on axios */}
              {/* overflowwrap to wrap text */}
              <Grid item xs={8} sx={{ overflowWrap: "break-word" }}>
                <Paragraph text={attachments} fontWeight={"normal"} />
              </Grid>
              <Grid item xs={12}>
                <form onSubmit={handleSubmit}>
                  <Grid>
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
          </PaperComponent>
        </Box>
      </ThemeProvider>
    </>
  );
}

export default ActOnLeave;
