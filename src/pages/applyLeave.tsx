import { Box, Container, Grid, Stack, TextareaAutosize, Typography } from '@mui/material'
import { boolean, object, string, TypeOf } from 'zod';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import FormInput from '../components/ui/FormInput'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';
import { useEffect } from 'react';

type applyLeaveProps = {
    leaveType: string
    startDate: string
    endDate: string
    halfDay: boolean
    leaveLength: string
    comments: string
}

const applyLeaveSchema = object({
    leaveType: string().min(1, 'Leave type is required'),
    startDate: string().min(1, 'Start date is required'),
    // if half day is false, endDate is not required
    halfDay: boolean(),
    comments: string().min(1, 'Comments is required'),
    endDate: string()
}).refine(data => data.halfDay === true, {
    path: ['endDate'],
    message: 'End date is required'
});

export type applyLeaveInput = TypeOf<typeof applyLeaveSchema>;

const leaveTypes = [
    { id: 1, value: 'sick', label: 'Sick Leave' },
    { id: 2, value: 'casual', label: 'Casual Leave' },
    { id: 3, value: 'maternity', label: 'Maternity Leave' },
    { id: 4, value: 'paternity', label: 'Paternity Leave' },
];


function ApplyLeave() {

    const methods = useForm<applyLeaveProps>({
        resolver: zodResolver(applyLeaveSchema),
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = methods;

    const onSubmitHandler: SubmitHandler<applyLeaveInput> = (values) => {
        console.log("values", values);
    };

    useEffect(() => {
        if (isSubmitSuccessful) {
            reset();
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmitSuccessful]);


    return (
        <Container maxWidth="xl">
            <Stack>
                <Typography variant="h4">Apply for Leave</Typography>
            </Stack>

            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Box sx={{
                    maxWidth: '650px',
                    width: '100%',
                    p: 2,  // Adjust padding as needed
                    borderRadius: 2,
                    alignItems: 'flex-start',  // Align items to the left
                    justifyContent: 'flex-start',  // Align items to the left
                }}>
                    <Box sx={{
                        marginTop: 2,
                    }}>
                        <FormProvider {...methods}>
                            <Box
                                component='form'
                                onSubmit={handleSubmit(onSubmitHandler)}
                                noValidate
                                autoComplete='off'
                            >
                                <FormInput
                                    type="select"
                                    name="leaveType"
                                    label="Leave Type"
                                    options={leaveTypes.map((leave) => ({ value: leave.value, label: leave.label }))}
                                />
                                <Stack columnGap={1} direction="row" alignItems="center" justifyContent="space-between" >
                                    <FormInput name='startDate' label='Start Date' type='date' />
                                    <FormInput name='halfDay' label='Half Day?' type='checkbox' />
                                </Stack>
                                <FormInput name='endDate' label='End Date' type='date' disabled={methods.getValues('halfDay')} />
                                <FormInput name='comments' label='Comments' type='textarea' />

                                <LoadingButton
                                    variant='contained'
                                    sx={{ mt: 2, borderRadius: '10px' }}
                                    fullWidth
                                    disableElevation
                                    type='submit'
                                    loading={false}
                                >
                                    Apply
                                </LoadingButton>
                            </Box>
                        </FormProvider>
                    </Box>
                </Box>
            </Box>

        </Container>
    )
}

export default ApplyLeave