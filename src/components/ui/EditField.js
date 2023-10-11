import { TextField } from "@mui/material";
import React, { useState } from "react";
import {
  validatePhone,
  validateText,
  validateDate,
  validateEndDate,
  validateDropDown,
} from "../form/Validations";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import DateField from "./DatePicker";
//import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
//import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
//import { DatePicker } from "@mui/x-date-pickers/DatePicker";

function EditField({ field }) {
  const { name, label, type, onChange, value, options } = field;
  const [defaultError, setDefaultError] = useState("");
  const [fieldValue, setValue] = useState(value);

  const validationMap = {
    phone: validatePhone,
    firstName: validateText,
    lastName: validateText,
    jobTitle: validateText,
    start_date: validateDate,
    end_date: validateEndDate,
    Leave_type: validateDropDown,
    approval: validateDropDown,

    // Add more validation functions for other input fields
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setValue(value);

    const validationFn = validationMap[name];
    if (validationFn) {
      const error = validationFn(value);
      setDefaultError(error || "");
    }
    onChange(value);
  };

  const dateFormat = (dateValue) => {
    const date = new Date(dateValue);
    return date.toISOString().split("T")[0];
  };

  return (
    <>
      {type === "date" ? (
        /*<FormControl
          fullWidth
          error={Boolean(defaultError)}
          sx={{ marginBottom: "15px" }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={label}
              id={name}
              name={name}
              value={fieldValue}
              onChange={(event) => {
                handleInputChange(event);
              }}
              renderInput={(params) => (
                <TextField {...params} error={Boolean(defaultError)} />
              )}
              />

          </LocalizationProvider>
          <FormHelperText sx={{ color: "red" }}>
            {defaultError ? defaultError : ""}
          </FormHelperText>
        </FormControl>*/
        <DateField label={label} value={value} onChange={handleInputChange} />
      ) : type === "select" ? (
        <FormControl
          fullWidth
          error={Boolean(defaultError)}
          sx={{ marginBottom: "15px" }}
        >
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select
            labelId={`${name}-label`}
            value={fieldValue}
            label={label}
            id={name}
            name={name}
            type={type}
            onChange={handleInputChange}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.labelText}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText sx={{ color: "red" }}>
            {defaultError ? defaultError : ""}
          </FormHelperText>
        </FormControl>
      ) : (
        <TextField
          id={name}
          name={name}
          value={fieldValue}
          onChange={handleInputChange}
          label={label}
          type={type}
          variant="outlined"
          fullWidth
          error={Boolean(defaultError)}
          helperText={defaultError}
          sx={{ marginBottom: "15px" }}
        />
      )}
    </>
  );
}

export default EditField;
