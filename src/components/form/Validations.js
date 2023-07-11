export const validateEmail = (value) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@disraptor\.co\.za$/;
  if (!emailRegex.test(value)) {
    return "Invalid email address.";
  }
  return null; // No error
};

export const validatePassword = (value) => {
  if (!value) {
    return "Password is required.";
  } else if (!/\d/.test(value)) {
    return "Password must contain at least 1 digit.";
  } else if (!/[A-Z]/.test(value)) {
    return "Password must contain at least 1 uppercase letter.";
  } else if (!/[a-z]/.test(value)) {
    return "Password must contain at least 1 lowercase letter.";
  } else if (!/[!@#$%^&*]/.test(value)) {
    return "Password must contain at least 1 special character.";
  } else if (value.length < 8 || value.length > 15) {
    return "Password must be 8 to 15 characters long.";
  }
  return null; // No error
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (confirmPassword !== password) {
    return "Passwords don't match";
  }
  return null; // No error
};

export const validateCode = (value) => {
  const codePattern = /^[0-9]+$/;
  if (!codePattern.test(value)) {
    return "Verification code may only contain numbers.";
  } else if (value.length < 6) {
    return "Invalid verification code.";
  }
  return null; // No error
};

export const validateEndDate = (value) => {
  if (!value) {
    return "Please select your leave end date.";
  }
  return null;
};

export const validatePhone = (value) => {
  const phonePattern = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  if (!phonePattern.test(value)) {
    return "Invalid phone number.";
  }
  return null; // No error
};

export const validateDropDown = (value) => {
  if (!value) {
    return "Please select an option from the list";
  }

  return null;
};

export const validateText = (value) => {
  if (!value) {
    return "Field required.";
  }
  return null; // No error
};

export const validateDate = (value) => {
  if (!value) {
    return "Date is required.";
  }

  const selectedDate = new Date(value);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

  if (selectedDate < currentDate) {
    return "Selected date cannot be before today.";
  }

  return null;
};

// Add more validation functions for other input types
