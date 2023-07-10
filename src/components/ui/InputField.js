import { TextField } from "@mui/material";
import React, { useState } from "react";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateCode,
  validatePhone,
  validateText,
  validateDate,
  validateEndDate,
} from "../form/Validations";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function Input({ field, onChange }) {
  // declare useState variables
  const [defaultError, setDefaultError] = useState("");
  const [value, setValue] = useState("");
  const { label, name, type } = field;

  // show password functionality
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validationMap = {
    email: validateEmail,
    password: validatePassword,
    confirmPassword: validateConfirmPassword,
    code: validateCode,
    phone: validatePhone,
    firstName: validateText,
    lastName: validateText,
    jobTitle: validateText,
    Date: validateDate,
    endDate: validateEndDate,

    // Add more validation functions for other input fields
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setValue(value);

    const validationFn = validationMap[name];
    if (validationFn) {
      const error = validationFn(value);
      setDefaultError(error || "");
      // confirm password validation handle
      if (name === "confirmPassword") {
        if (value === document.getElementById("password").value) {
          setDefaultError("");
        }
      }
    }
    onChange(value);
  };

  //const inputErrorMessage = defaultError ? defaultError : "";

  return (
    <TextField
      error={Boolean(defaultError)}
      name={name}
      id={name}
      label={label}
      fullWidth
      type={type !== "password" ? type : showPassword ? "text" : "password"}
      InputProps={
        type === "password"
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : null
      }
      value={value}
      helperText={defaultError}
      onChange={handleInputChange}
      sx={{ marginBottom: "15px" }}
    />
  );
}

export default Input;
