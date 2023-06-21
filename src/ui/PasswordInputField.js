import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { TextField } from '@mui/material';

function PasswordInput({label, id, placeHolder, value, onChange}) {
  
    const [passwordError, setPasswordError] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

 
    const handlePasswordChange = (event) => {
        const value = event.target.value;
        onChange(value);

        // Password validation logic
        if (!value) {
        setPasswordError('Password is required.');
        
        } else if (value.length < 8 || value.length > 15) {
        setPasswordError('Password must be 8 to 15 characters long.');
        
        } else if (!/\d/.test(value)) {
        setPasswordError('Password must contain at least 1 digit.');
        
        } else if (!/[A-Z]/.test(value)) {
        setPasswordError('Password must contain at least 1 uppercase letter.');
        
        } else if (!/[a-z]/.test(value)) {
        setPasswordError('Password must contain at least 1 lowercase letter.');
        
        } else if (!/[!@#$%^&*]/.test(value)) {
        setPasswordError('Password must contain at least 1 special character.');
        
        } else {
        setPasswordError('');
        
        }
    };

    return (
        <>
            <TextField
                error={Boolean(passwordError)}
                id={id}
                fullWidth
                label={label}
                value={value}
                placeholder={placeHolder}
                helperText={passwordError || ' '}
                onChange={handlePasswordChange}
                sx={{marginBottom:'10px'}}
                type={showPassword ? 'text' : 'password'}
                InputProps={{
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
                }}
                
            />
        </>
    );
};

export default PasswordInput;
