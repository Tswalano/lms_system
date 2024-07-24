import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TypeOf, z } from 'zod'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryObserverResult, RefetchOptions, useMutation } from '@tanstack/react-query';
import { createUserFn } from '../../api/authAPI';
import { useEffect } from 'react';
import { Stack } from '@mui/material';
import FormInput from './FormInput';
import { LoadingButton } from '@mui/lab';
import { CognitoUser } from '../../api/types';
 
type Props = {
    children?: React.ReactNode;
    handleClose: () => void;
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<CognitoUser[], Error>>
    open: boolean;
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

const createUserSchema = z.object({
    firstName: z.string()
        .min(1, 'First Name is required')
        .max(40, 'First Name must be less than 40 characters'),
    lastName: z.string()
        .min(1, 'Last Name is required')
        .max(40, 'Last Name must be less than 40 characters'),
    occupation: z.string()
        .min(1, 'Occupation is required')
        .max(40, 'Occupation must be less than 40 characters'),
    isAdmin: z.boolean(),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>;

function AddUserModal({ open, handleClose, refetch }: Props) {
    const methods = useForm<CreateUserInput>({
        resolver: zodResolver(createUserSchema),
    });

    const { mutate: createUser, isPending, isSuccess } = useMutation({
        mutationKey: ['createUser'],
        mutationFn: (userData: CreateUserInput) => createUserFn(userData),
        onSuccess: () => {
            console.log('User has been created....');
            handleClose();
        },
        onError: (error: any) => {
            if (Array.isArray((error as any).response.data.error)) {
                (error as any).response.data.error.forEach((el: any) =>
                    console.error(el.message)
                );
            } else {
                console.error((error as any).response.data.message);
            }
        },
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = methods;

    useEffect(() => {
        if (isSuccess && isSubmitSuccessful) {
            reset();
            refetch().then(() => {
                console.log('Query has been refetched....');
            }).catch(err => console.error("Error refetching data", err))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmitSuccessful, isSuccess]);

    const onSubmitHandler: SubmitHandler<CreateUserInput> = (values) => {
        createUser(values)
        console.log("create user", values)
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Add Employee
                </Typography>
                <Box sx={{ mt: 2 }} />
                <FormProvider {...methods}>
                    <Box
                        component='form'
                        onSubmit={handleSubmit(onSubmitHandler)}
                        noValidate
                        autoComplete='off'
                        sx={{
                            p: {},
                            borderRadius: 2,
                        }}
                    >
                        <FormInput name='firstName' label='First Name' type='text' />
                        <FormInput name='lastName' label='Last Name' type='text' />
                        <Stack direction={"row"} gap={2} sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: '1rem',
                        }}>
                            <FormInput name='occupation' label='Occupation' type='text' />
                            <FormInput name='isAdmin' label='isAdmin' type='checkbox' />
                        </Stack>
                        <LoadingButton
                            variant='contained'
                            sx={{ mt: 1, borderRadius: '10px' }}
                            fullWidth
                            disableElevation
                            type='submit'
                            loading={isPending}
                        >
                            Create User
                        </LoadingButton>
                    </Box>
                </FormProvider>
            </Box>
        </Modal >
    )
}

export default AddUserModal