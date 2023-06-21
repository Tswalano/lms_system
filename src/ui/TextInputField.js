import { TextField } from '@mui/material';
import React from 'react';
import { useState } from 'react';

function TextInput(id, label, placeHolder, value) {

    const [errorMessage, setErrorMessage] = useState('');

    const handleEmailChange = (event) => {
        const value = event.target.value;
        onChange(value);

        if (!value) {
            setErrorMessage('Input field empty.');
        } else {
            setErrorMessage('');
        }
    };

    return (  
        <>
          
            <TextField
                error={Boolean(errorMessage)}
                id={id}
                label={label}
                fullWidth
                type="text"
                placeholder= {placeHolder}
                value={value}
                helperText={errorMessage || ' '}
                onChange={handleEmailChange}
                sx={{marginBottom:'10px'}}
            />
 
        </>
    );
}

export default TextInput;