import { Box, Container, Stack, Typography } from '@mui/material';
import { object, string, TypeOf } from 'zod';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import FormInput from '../components/ui/FormInput';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { useEffect } from 'react';
import { LeaveType } from '../api/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { applyForLeaveFN, getPublicHolidayDatesFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import dayjs from "dayjs";
import dayjsutc from "dayjs/plugin/utc";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

dayjs.extend(dayjsutc);

const applyLeaveSchema = object({
    leave_type: string().min(1, 'Leave type is required'),
    leave_start: string().min(1, 'Start date is required'),
    leave_length: string().min(1, 'Leave length is required'),
    leave_comment: string().min(1, 'Comments is required'),
    leave_end: string().min(1, 'End date is required')
}).refine(data => {
    // if half day is true, end date cant be the future date
    if (data.leave_length === "half" && new Date(data.leave_end) > new Date(data.leave_start)) {
        return false;
    }

    return true;
}, {
    path: ["leave_end"],
    message: 'End date cannot be in the future',
});

export type applyLeaveInput = TypeOf<typeof applyLeaveSchema>;

const leaveTypes = [
    { id: 1, value: 'sick', label: 'Sick Leave' },
    { id: 2, value: 'casual', label: 'Casual Leave' },
    { id: 3, value: 'maternity', label: 'Maternity Leave' },
    { id: 4, value: 'paternity', label: 'Paternity Leave' },
];

function ApplyLeave() {
    const [cookies] = useCookies(['token']);
    const methods = useForm<applyLeaveInput>({
        resolver: zodResolver(applyLeaveSchema),
    });
    const { mutate: applyForLeave, isPending, error, isError } = useMutation({
        mutationKey: ['applyForLeave'],
        mutationFn: (leaveData: applyLeaveInput) => applyForLeaveFN(cookies.token, leaveData),
        onSuccess: () => {
            toast.success('Leave request submitted successfully!');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to submit leave request');
        },
    });
    const callGetPublicHolidays = useQuery({
        queryKey: [ "publicHolidays" ],
        queryFn: async ({ queryKey }) => getPublicHolidayDatesFn(cookies.token),
        select: (publicHolidays) => publicHolidays.map(phd => dayjs.utc(phd))
    });
    const {
        reset,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = methods;
    const onSubmitHandler: SubmitHandler<applyLeaveInput> = (values) => {
        applyForLeave(values);
        console.log("values", values);
    };
    const shouldDisableDate = (date: dayjs.Dayjs) => {
        const dayOfWeek = date.day();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayIsPublicHoliday = callGetPublicHolidays.isSuccess
            ? callGetPublicHolidays.data?.some(d => d.isSame(date))
            : false;
        const shouldDisableDate = isWeekend || dayIsPublicHoliday;

        return shouldDisableDate;
    };

    useEffect(() => {
        if (isSubmitSuccessful) {
            reset();
        }
    }, [isSubmitSuccessful, reset]);

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
                    p: 2,
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                }}>
                    <Box sx={{ marginTop: 2 }}>
                        <FormProvider {...methods}>
                            <Box
                                component='form'
                                onSubmit={handleSubmit(onSubmitHandler)}
                                noValidate
                                autoComplete='off'
                            >
                                <FormInput
                                    type="select"
                                    name="leave_type"
                                    label="Leave Type"
                                    options={leaveTypes.map((leave) => ({ value: leave.value, label: leave.label }))}
                                />
                                <FormInput name='leave_length' label='Leave Length' type='select' options={[{ value: 'half', label: 'Half Day' }, { value: 'full', label: 'Full Day' }]} />
                                <FormInput name='leave_start' label='Start Date' type='date' disableDatesHandler={shouldDisableDate} /> {/* TODO: provide grey date values or function */}
                                <FormInput name='leave_end' label='End Date' type='date' disableDatesHandler={shouldDisableDate} /> {/* TODO: provide grey date values or function */}
                                <FormInput name='leave_comment' label='Comments' type='textarea' />

                                <LoadingButton
                                    variant='contained'
                                    sx={{ mt: 2, borderRadius: '10px' }}
                                    fullWidth
                                    disableElevation
                                    type='submit'
                                    loading={isPending}
                                >
                                    Apply
                                </LoadingButton>
                            </Box>
                        </FormProvider>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default ApplyLeave;
