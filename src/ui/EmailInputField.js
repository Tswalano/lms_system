import { TextField } from '@mui/material';
import React from 'react';
import { useState } from 'react';

function EmailInput({ id, label, placeHolder, value, onChange }) {
  
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailChange = (event) => {
    const value = event.target.value;
    onChange(value);

    // Email validation logic
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setErrorMessage('Invalid email address.');
    } else {
      setErrorMessage('');
    }
  };


  return (  
    <TextField
      error={Boolean(errorMessage)}
      id={id}
      label={label}
      fullWidth
      type="email"
      placeholder= {placeHolder}
      value={value}
      helperText={errorMessage || ' '}
      onChange={handleEmailChange}
      sx={{marginBottom:'10px'}}
    />
  );

}

export default EmailInput;