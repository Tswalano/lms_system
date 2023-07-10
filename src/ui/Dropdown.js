import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import {
  validateDropDown,
  validateSelect,
} from "../components/form/Validations";

function Dropdown({ field, onChange }) {
  const [defaultErrorMessage, setDefaultError] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const { label, name, type, options } = field;
  //const menuOptions = Array.isArray(field.options) ? field.options : [];

  const validationMap = {
    select: validateSelect,
    LeaveType: validateDropDown,
  };

  const handleSelectOption = (event) => {
    const value = event.target.value;

    if (value) {
      setSelectedValue(value || "");
    } else {
      setSelectedValue("Select option");
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
          onChange={handleSelectOption}
        >
          <MenuItem value="Select option">Select option</MenuItem>
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
