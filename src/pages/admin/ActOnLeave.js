import { React, useState } from "react";
import PaperComponent from "../../ui/Paper";
import { Box, Grid, Breadcrumbs, Chip } from "@mui/material";
import Paragraph from "../../ui/Paragraph";
import SubmitButton from "../../ui/Button";
import FormFieldMapper from "../../components/form/FormFieldMapper";
import ActOnLeaveConfig from "./ActOnLeaveConfig";
import { GridSizes } from "../../components/form/GridSizes";
import { handleFieldChange } from "../../components/form/HandleFieldChange";
import { GetFormValues } from "../../components/form/GetFormValues";
import { styled } from "@mui/system";
import { emphasize, createTheme, ThemeProvider } from "@mui/material/styles";
import HomeIcon from "@mui/icons-material/Home";

function ActOnLeave() {
  const [empName, setEmpName] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [date, setDate] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState("");

  const [formValues, setFormValues] = useState({});

  const theme = createTheme({
    components: { MuiChip: { defaultProps: { color: "error" } } },
  });

  const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor = "#1FE3A8";
    // theme.palette.mode === "light"
    //   ? //console.log(theme);
    //     theme.palette.grey[100]
    //   : theme.palette.grey[800];
    console.log(theme);
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

  function handleClick(event) {
    event.preventDefault();
    console.info("You clicked a breadcrumb.");
    //nav("/home");
  }

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);
  //Set values from the object
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
    console.log(formValues);
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
          <Breadcrumbs aria-aria-label="breadcrumb">
            <StyledBreadcrumb
              component="a"
              href="#"
              label="Home"
              icon={<HomeIcon fontSize="small" />}
              onClick={handleClick}
            />
            <StyledBreadcrumb
              component="a"
              href="#"
              label="Manage Leave"
              onClick={handleClick}
            />
            <StyledBreadcrumb component="a" href="#" label="Act On Leave" />
          </Breadcrumbs>
          <PaperComponent>
            <Grid container>
              <Grid item xs={4} paddingBottom={"3%"}>
                <Paragraph text="Employee Names:" fontWeight={"bold"} />
              </Grid>
              <Grid item xs={8}>
                <Paragraph text={empName} fontWeight={"normal"} />
              </Grid>
              <Grid item xs={4} paddingBottom={"3%"}>
                <Paragraph text="Leave Type:" fontWeight={"bold"} />
              </Grid>
              <Grid item xs={8}>
                <Paragraph text={leaveType} fontWeight={"normal"} />
              </Grid>
              <Grid item xs={4} paddingBottom={"3%"}>
                <Paragraph text="Date:" fontWeight={"bold"} />
              </Grid>
              <Grid item xs={8}>
                <Paragraph text={date} fontWeight={"normal"} />
              </Grid>
              <Grid item xs={4} paddingBottom={"4%"}>
                <Paragraph text="Comments:" fontWeight={"bold"} />
              </Grid>
              <Grid item xs={8}>
                <ScrollComments>
                  <Paragraph text={comments} fontWeight={"normal"} />
                </ScrollComments>
              </Grid>
              <Grid item xs={4} paddingBottom={"100px"}>
                <Paragraph text="Attachments:" fontWeight={"bold"} />
              </Grid>
              <Grid item xs={8}>
                <Paragraph text={attachments} fontWeight={"normal"} />
              </Grid>
              <Grid item xs={12}>
                <form onSubmit={handleSubmit}>
                  <Grid>
                    <FormFieldMapper
                      formFields={ActOnLeaveConfig.formFields}
                      onChange={handleChange}
                      gridSizes={GridSizes.onbordingFieldSizes}
                    />
                  </Grid>
                  <SubmitButton
                    label={"Act on Leave"}
                    type="submit"
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
