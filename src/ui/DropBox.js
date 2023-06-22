import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";

function Dropdown({
  id,
  label,
  options,
  value,
  onChange,
  isError,
  errorMessage,
}) {
  const [localErrorMessage, setErrorMessage] = useState("");

  const handleSelectOption = (event) => {
    onChange(event);

    if (event.target.value === "" || event.target.value === "No value") {
      setErrorMessage(errorMessage || "Please select a valid option.");
    } else {
      setErrorMessage("");
    }
  };

  return (
    <>
      <FormControl
        fullWidth
        error={Boolean(isError || localErrorMessage)}
        sx={{ marginBottom: "15px" }}
      >
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          value={value}
          label={label}
          onChange={handleSelectOption}
        >
          <MenuItem value="No value">Select option</MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.labelText}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ color: "red" }}>
          {isError ? errorMessage : localErrorMessage}
        </FormHelperText>
      </FormControl>
    </>
  );
}

export default Dropdown;
