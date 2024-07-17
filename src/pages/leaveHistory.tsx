import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TablePagination from '@mui/material/TablePagination';
import Stack from '@mui/material/Stack';
import { useQuery } from '@tanstack/react-query';
import { useCookies } from 'react-cookie';
import { getAllLeaveRequestByUID } from '../api/authAPI';
import { LeaveRequest } from '../api/types';
import { formatDateTimeToSAST } from '../utils/Util';

type Props = {};

function LeaveHistory({ }: Props) {
    const [cookies] = useCookies(['token']);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const { data, isError, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['listLeaveRequests'],
        queryFn: () => getAllLeaveRequestByUID(cookies.token),
        select: (data) => {
            if (data.statusCode !== 200) {
                return [];
            }
            return data.body;
        },
    });

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }

    if (isError || !data) {
        return <Typography>Error loading leave requests.</Typography>;
    }

    const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Manage Leave Requests</Typography>
                <Button variant="contained" color="primary" startIcon={<>➕</>}>
                    New Request
                </Button>
            </Stack>

            <Card>
                {leaveHistoryTable(paginatedData)}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>
        </Container>
    );
}

export const leaveHistoryTable = (leaveHistory: LeaveRequest[]) => (
    <TableContainer sx={{ overflow: 'unset' }}>
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell>Leave Type</TableCell>
                        <TableCell>Note</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell align="right">Status</TableCell>
                        <TableCell align="right">Start Date</TableCell>
                        <TableCell align="right">End Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {leaveHistory && leaveHistory.map((lh) => (
                        <TableRow
                            key={lh.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {lh.leave_type}
                            </TableCell>
                            <TableCell>{lh.leave_comment}</TableCell>
                            <TableCell align="right">{lh.duration}</TableCell>
                            <TableCell align="right">{lh.status}</TableCell>
                            <TableCell align="right">{lh.start_date}</TableCell>
                            <TableCell align="right">{formatDateTimeToSAST(lh.end_date)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </TableContainer>
);

export default LeaveHistory;
