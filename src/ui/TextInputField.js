import { TextField } from "@mui/material";
import React from "react";
import { useState } from "react";

function TextInput({ id, label, placeHolder }) {
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <>
      <TextField
        error={Boolean(errorMessage)}
        id={id}
        label={label}
        fullWidth
        type="text"
        placeholder={placeHolder}
        helperText={errorMessage || " "}
        sx={{ marginBottom: "10px" }}
      />
    </>
  );
}

export default TextInput;
