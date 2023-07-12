import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { validateDropDown } from "../form/Validations";

function Dropdown({ field, onChange }) {
  const [defaultErrorMessage, setDefaultError] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const { label, name, type, options } = field;
  //const menuOptions = Array.isArray(field.options) ? field.options : [];

  const validationMap = {
    select: validateDropDown,
    LeaveType: validateDropDown,
    approval: validateDropDown,
    // Add more validation functions for other input types
  };

  const handleSelectOption = (event) => {
    const value = event.target.value;

    if (value) {
      setSelectedValue(value || "");
    }

    const validationFn = validationMap[name];
    if (validationFn) {
      const error = validationFn(value);
      setDefaultError(error || "");
    }
    onChange(value);
  };

  return (
    <>
      <FormControl
        fullWidth
        error={Boolean(defaultErrorMessage)}
        sx={{ marginBottom: "15px" }}
      >
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select
          labelId={`${name}-label`}
          value={selectedValue}
          label={label}
          id={name}
          name={name}
          type={type}
          onChange={handleSelectOption}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.labelText}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ color: "red" }}>
          {defaultErrorMessage ? defaultErrorMessage : ""}
        </FormHelperText>
      </FormControl>
    </>
  );
}

export default Dropdown;
