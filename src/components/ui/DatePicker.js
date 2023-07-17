import React, { useState } from "react";
import { TextField, FormHelperText, FormControl } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { validateDate } from "../form/Validations";

function DateField({ label, value, onChange }) {
  const [defaultErrorMessage, setDefaultError] = useState("");

  const validationMap = {
    date: validateDate,
    endDate: validateDate,
    // Add the validation function for the date field
    // Add more validation functions for other input types
  };

  const handleDateChange = (newValue) => {
    const validationFn = validationMap["date"]; // Get the validation function for the date field
    const validationError = validationFn ? validationFn(newValue) : null;

    setDefaultError(validationError || "");
    onChange(newValue);
  };

  return (
    <>
      <FormControl
        fullWidth
        error={Boolean(defaultErrorMessage)}
        sx={{ marginBottom: "15px" }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={label}
            value={value}
            onChange={handleDateChange}
            renderInput={(params) => (
              <TextField {...params} error={Boolean(defaultErrorMessage)} />
            )}
          />
        </LocalizationProvider>
        <FormHelperText sx={{ color: "red" }}>
          {defaultErrorMessage ? defaultErrorMessage : ""}
        </FormHelperText>
      </FormControl>
    </>
  );
}

export default DateField;
