
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Button, ButtonGroup, Card, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

type Props = {}

type LeaveRequest = {
    id: number;
    title: string;
    note: string;
    value: number;
    status: string;
    startDate: string;
    endDate: string;
};


function LeaveHistory({ }: Props) {

    const leaveHistory: LeaveRequest[] = [
        {
            id: 1,
            title: 'Sick Leave',
            note: 'I am going to hospital',
            value: 2,
            status: 'Approved',
            startDate: '2023-05-01',
            endDate: '2023-05-03'
        },
        {
            id: 2,
            title: 'Study Leave',
            note: 'I am going to read a book',
            value: 5,
            status: 'Pending',
            startDate: '2023-05-05',
            endDate: '2023-05-07'
        }, {
            id: 3,
            title: 'Study Leave',
            note: 'I am going to read a book',
            value: 2,
            status: 'Rejected',
            startDate: '2023-05-01',
            endDate: '2023-05-03'
        }
    ]

    return (
        <Container maxWidth="xl">
            {/* <Grid> */}

            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Manage Leave Requests</Typography>

                <Button variant="contained" color="primary" startIcon={<>➕</>}>
                    New Request
                </Button>
            </Stack>

            <Card>
                {leaveHistoryTable(leaveHistory)}
            </Card>
            {/* </Grid> */}
        </Container>
    )
}

export const leaveHistoryTable = (leaveHistory: LeaveRequest[]) => {

    return <TableContainer sx={{ overflow: 'unset' }}>
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
                    {leaveHistory.map((lh) => (
                        <TableRow
                            key={lh.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {lh.title}
                            </TableCell>
                            <TableCell component="th" scope="row">{lh.note}</TableCell>
                            <TableCell align="right">{lh.value}</TableCell>
                            <TableCell align="right">{lh.status}</TableCell>
                            <TableCell align="right">{lh.startDate}</TableCell>
                            <TableCell align="right">{lh.endDate}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </TableContainer>
}

export default LeaveHistory