import React, { useState } from "react";
import { TextField, FormHelperText, FormControl } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { validateDate } from "../form/Validations";

let disabledDates = [];

function disableWeekendsAndPublicHolidays(date) {
  // const publicHolidays = [
  //   "2024-08-08T22:00:00.000Z",
  //   "2024-09-23T22:00:00.000Z",
  //   "2024-06-16T22:00:00.000Z",
  //   "2024-06-15T22:00:00.000Z"
  // ];
  const publicHolidayDates = disabledDates.map(ph => new Date(ph));
  const actualDate = new Date(date);

  try {
    const shouldDisable = actualDate.getDay() === 0 || actualDate.getDay() === 6
      || publicHolidayDates.some(ph => ph.toISOString() === actualDate.toISOString());

    // console.log(`Should disable [${actualDate.toISOString()}]? [${shouldDisable}]`);

    return shouldDisable;
  }
  catch (error) {
    console.error(`Could not disable weekends and public holidays: ${error}`);
  }
};

function DateField({ label, value, onChange, disabledDates }) {
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
            shouldDisableDate={disableWeekendsAndPublicHolidays}
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
