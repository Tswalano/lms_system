import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Button, ButtonGroup, Card, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Tabs, Tab } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn, updateLeaveStatusFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { formatDateTimeToSAST } from '../utils/Util';
import { leaveStatus } from '../api/types';
import LoadingPage from './loadingPage';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Props = {}

export default function ManageLeaveRequests({ }: Props) {
    const [cookies] = useCookies(['token']);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [tabValue, setTabValue] = useState('Pending');

    const { data, isError, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['listLeaveRequests'],
        queryFn: () => getAllLeaveRequestsFn(cookies.token),
        select: (data) => {
            if (data.status !== 200) {
                return [];
            }
            return data.data.leaveData;
        },
    });

    const mutate = useMutation({
        mutationKey: ['deleteLeaveRequest'],
        mutationFn: (leaveData: leaveStatus) => updateLeaveStatusFn(cookies.token, leaveData),

        onSuccess(data, variables) {
            console.log('leave request updated', data);
            refetch();
            variables.status === 'Approved' ?
                toast.success('Leave Status Approved') : toast.warning('Leave request rejected.');
        },
        onError: (error) => {
            toast.error('Failed to Update Leave Request');
        },
    });

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
        setPage(0); // Reset page when tab changes
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (isError || !data) {
        return <Typography>Error loading leave requests.</Typography>;
    }

    const filteredData = data.filter(leave => leave.status === tabValue);
    const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Manage Leave Requests</Typography>
            </Stack>

            <Tabs value={tabValue} onChange={handleTabChange} aria-label="leave request tabs">
                <Tab label="Pending" value="pending" />
                <Tab label="Approved" value="Approved" />
                <Tab label="Rejected" value="Rejected" />
            </Tabs>

            <Grid>
                <Card>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }} aria-label="a dense table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Leave Type</TableCell>
                                        <TableCell>Note</TableCell>
                                        <TableCell align="center">No. of Days</TableCell>
                                        <TableCell align="right">Status</TableCell>
                                        <TableCell align="right">Start Date</TableCell>
                                        <TableCell align="right">End Date</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedData.map((leave) => (
                                        <TableRow
                                            key={leave.id}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {leave.fullName}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {leave.leave_type}
                                            </TableCell>
                                            <TableCell>{leave.leave_comment}</TableCell>
                                            <TableCell align="center">{leave.duration}</TableCell>
                                            <TableCell align="right">
                                                <Chip label={leave.status} size='small' color={leave.status === 'Approved' ? 'success' : 'error'} />
                                            </TableCell>
                                            <TableCell align="right">{formatDateTimeToSAST(leave.start_date)}</TableCell>
                                            <TableCell align="right">{formatDateTimeToSAST(leave.end_date)}</TableCell>
                                            <TableCell align="right">
                                                <ButtonGroup disabled={leave.status !== 'pending'} size="small" aria-label="Small button group">
                                                    <Button variant="contained" color="success" size="small" onClick={() => { mutate.mutate({ feedback: "Ok", id: leave.id, status: 'Approved' }) }}>Approve</Button>
                                                    <Button variant="contained" color="error" size="small" onClick={() => { mutate.mutate({ feedback: "Rejected", id: leave.id, status: 'Rejected' }) }}>Reject</Button>
                                                </ButtonGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredData.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableContainer>
                </Card>
            </Grid>
        </Container>
    );
}
