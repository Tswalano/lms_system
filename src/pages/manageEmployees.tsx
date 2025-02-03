import React, { useState } from 'react'
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {
    ButtonGroup,
    Card,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton
} from '@mui/material';
import AddUserModal from '../components/ui/AddUserModal';
import { useQuery, useMutation } from '@tanstack/react-query';
import { deleteUserFn, getAllUsersFn } from '../api/authAPI';  // Import delete function
import { useCookies } from 'react-cookie';
// import { CognitoUser } from '../api/types';
import { formatDateTimeToSAST, capitalizeName } from '../utils/Util';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CloseIcon from '@mui/icons-material/Close';

function ManageEmployees() {
    const [cookies,] = useCookies(['token']);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    // const [employees, setEmployees] = React.useState<CognitoUser[]>([])
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ firstName: string; lastName: string; email: string; createdAt: string; id: string; userStatus: string; role: string; occupation: string; } | null>(null);
    // toggle modal
    // Toggle add employee modal
    const handleModal = () => setIsModalOpen(!isModalOpen);

    // Open delete confirmation modal
    const handleOpenDeleteModal = (user: any) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    // Close delete modal
    const handleCloseDeleteModal = () => {
        setSelectedUser(null);
        setIsDeleteModalOpen(false);
    };

    // Fetch all users

    const { data, isError, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['listUsers'],
        queryFn: () => getAllUsersFn(cookies.token),
        select: (data) => {
            if (data.error) {
                toast.error('Failed to Fetch Users')
                return []
            }

            return data.payload
        },
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: ({ userId, email }: { userId: string; email: string }) => deleteUserFn(userId, email, cookies.token),
        onSuccess: () => {
            toast.success('User deleted successfully');
            refetch();
            handleCloseDeleteModal();
        },
        onError: () => {
            toast.error('Failed to delete user');
        },
    });

    // Confirm user deletion
    const handleConfirmDelete = () => {
        if (selectedUser) {
            deleteMutation.mutate({ userId: selectedUser.id, email: selectedUser.email });
        }

    };


    return (
        <Container maxWidth="xl">

            {/* dialog */}
            <AddUserModal handleClose={handleModal} open={isModalOpen} refetch={refetch} />

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <DialogTitle>Confirm User Deletion</DialogTitle>
                    <IconButton onClick={handleCloseDeleteModal}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
                <Divider />
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
                        <br /><br />
                        <strong>Email:</strong> {selectedUser?.email} <br />
                        <strong>Start Date:</strong> {formatDateTimeToSAST(selectedUser?.createdAt)}
                        <br /><br />
                        <span style={{ color: 'red', fontWeight: 'bold' }}>
                            Warning: This action will remove the user’s leave requests, revoke access, and delete all associated data.
                        </span>
                    </DialogContentText>
                </DialogContent>
                <Divider />
                <DialogActions>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Send to the Shadow Realm 👻</Button>
                </DialogActions>
            </Dialog>

            {/* Page Header */}

            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Disraptor Employees</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleModal}
                >Add Employee</Button>
            </Stack>

            {(isLoading || isFetching) && <p>Loading...</p>}
            {isError && <p>Error loading employees</p>}

            {!isFetching && !isError && (
                <Grid>
                    <Card>
                        <TableContainer sx={{ overflow: 'unset' }}>
                            <TableContainer component={Paper}>
                                <Table sx={{ minWidth: 650 }} aria-label="a dense table">
                                    <TableHead>
                                        <TableRow>
                                            {/* <TableCell>Username</TableCell> */}
                                            <TableCell>Full Names</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Occupation</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell sortDirection="desc">
                                                <TableSortLabel
                                                    active={true}
                                                    direction={"desc"}
                                                >
                                                    Created At
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {/* no data */}
                                    {(!data || data.length === 0) && (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">No data</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    )}
                                    <TableBody>
                                        {data && data.map((user) => (
                                            <TableRow
                                                key={user.userId}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                                <TableCell component="th" scope="row">
                                                    {capitalizeName(`${user.firstName} ${user.lastName}`)}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {user.role}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {user.occupation}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {formatDateTimeToSAST(user.createdAt)}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {user.userStatus}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <ButtonGroup variant="text">
                                                        <Button size='small'>View</Button>
                                                        {/* <Button size='small' color="warning">Edit</Button> */}
                                                        <Button size='small' color="error" onClick={() => handleOpenDeleteModal(user)}>
                                                            Delete
                                                        </Button>
                                                    </ButtonGroup>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TableContainer>
                    </Card>
                </Grid>
            )}
        </Container>
    )
}

export default ManageEmployees