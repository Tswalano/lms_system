import { TextField } from "@mui/material";
import React from "react";

function TextInput({
  id,
  label,
  value,
  placeHolder,
  isError,
  errorMessage,
  onChange,
}) {
  // handle the user input as it's entered
  const handleInputChange = (event) => {
    const value = event.target.value;
    onChange(value);
  };

  return (
    <>
      <TextField
        error={Boolean(isError || errorMessage)}
        id={id}
        label={label}
        fullWidth
        type="text"
        value={value}
        placeholder={placeHolder}
        helperText={isError ? errorMessage : ""}
        onChange={handleInputChange}
        sx={{ marginBottom: "15px" }}
      />
    </>
  );
}

export default TextInput;
