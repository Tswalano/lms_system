import {
    FormHelperText,
    Typography,
    FormControl,
    Input as MuiInput,
    Select as MuiSelect,
    MenuItem,
    Checkbox as MuiCheckbox,
    TextareaAutosize as MuiTextarea,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

const Input = styled(MuiInput)`
    background-color: white;
    padding: 0.4rem 0.7rem;
    margin-bottom: 0.5rem;
`;

const Select = styled(MuiSelect)`
    background-color: white;
    padding: 0.4rem 0.7rem;
    margin-bottom: 0.5rem;
`;

const TextareaAutosize = styled(MuiTextarea)`
    background-color: white;
    padding: 0.4rem 0.7rem;
    margin-bottom: 0.5rem;
    width: 100%;
    min-height: 100px;
    resize: vertical;
`;

const Checkbox = styled(MuiCheckbox)`
    margin-bottom: 0.5rem;
`;

type IFormInputProps = {
    type: 'text' | 'select' | 'textarea' | 'date' | 'email' | 'password' | 'checkbox'; // Extend type prop to include checkbox
    name: string;
    label: string;
    disabled?: boolean;
    options?: { value: string | number; label: string }[]; // Options for select dropdown
};

const FormInput: FC<IFormInputProps> = ({ type, name, label, options, disabled }) => {
    const today = new Date()
    const {
        control,
        formState: { errors },
    } = useFormContext();

    return (
        <Controller
            control={control}
            defaultValue={type === 'checkbox' ? false : ''}
            name={name}
            render={({ field }) => (
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography
                        variant='body2'
                        sx={{ color: '#04A1EA', mb: 1, fontWeight: 500 }}
                    >
                        {label}
                    </Typography>
                    {type === 'text' && (
                        <Input
                            {...field}
                            type="text"
                            fullWidth
                            disableUnderline
                            sx={{ borderRadius: '1rem', backgroundColor: '#F3FAFF' }}
                            error={!!errors[name]}
                        />
                    )}
                    {type === 'select' && (
                        <>
                            {/* <InputLabel>{label}</InputLabel> */}
                            <Select
                                {...field}
                                size='small'
                                sx={{ borderRadius: '1rem', backgroundColor: '#F3FAFF' }}
                                error={!!errors[name]}
                            >
                                {options?.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </>
                    )}
                    {type === 'textarea' && (
                        <TextareaAutosize
                            {...field}
                            // minRows={3}
                            // maxRows={10}
                            aria-label={label}
                            placeholder={label}
                            sx={{ borderRadius: '1rem', backgroundColor: '#F3FAFF' }}
                        // error={!!errors[name]}
                        />
                    )}
                    {type === 'date' && (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MobileDatePicker
                                minDate={dayjs(today)}
                                disabled={disabled}
                                sx={{ borderRadius: '1rem', backgroundColor: '#F3FAFF' }} />
                        </LocalizationProvider>
                    )}
                    {type === 'email' && (
                        <Input
                            {...field}
                            type="email"
                            fullWidth
                            disableUnderline
                            sx={{ borderRadius: '1rem', backgroundColor: '#F3FAFF' }}
                            error={!!errors[name]}
                        />
                    )}
                    {type === 'password' && (
                        <Input
                            {...field}
                            type="password"
                            fullWidth
                            disableUnderline
                            sx={{ borderRadius: '1rem', backgroundColor: '#F3FAFF' }}
                            error={!!errors[name]}
                        />
                    )}
                    {type === 'checkbox' && (
                        <Checkbox
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',  // Align items to the left
                                justifyContent: 'flex-start',  // Align items to the left
                                borderRadius: '1rem', backgroundColor: '#F3FAFF'
                            }}
                            {...field}
                            color="primary"
                        />
                    )}
                    <FormHelperText error={!!errors[name]}>
                        {errors[name]?.message?.toString() || ''}
                    </FormHelperText>
                </FormControl >
            )}
        />
    );
};

export default FormInput;
