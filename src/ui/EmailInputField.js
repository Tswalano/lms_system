import { TextField } from '@mui/material';
import React from 'react';
import { useState } from 'react';

function EmailInput({ id, placeHolder, value, onChange }) {
  
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailChange = (event) => {
    const value = event.target.value;
    onChange(value);

    // Email validation logic
    const emailRegex = /^[a-zA-Z0-9._%+-]+@disraptor\.co\.za$/;
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
      label='Email Address'
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