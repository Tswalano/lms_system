import React from 'react';
import { Button } from '@mui/material';

const SubmitButton = ({ id, label, onClick }) => {
  return (
    <Button fullWidth id={id} onClick={onClick} variant="contained" color="primary" sx={{color:"white"}}>
      {label}
    </Button>    
  );
};

export default SubmitButton;