
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Button, ButtonGroup, Card, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

type Props = {}

export default function ManageLeaveRequests({ }: Props) {

    const leaveHistory = [
        {
            id: 1,
            requestedBy: 'John Doe',
            title: 'Sick Leave',
            note: 'I am going to hospital',
            value: 2,
            status: 'Approved',
            startDate: '2023-05-01',
            endDate: '2023-05-03'
        },
        {
            id: 2,
            requestedBy: 'Jane Bams',
            title: 'Study Leave',
            note: 'I am going to read a book',
            value: 5,
            status: 'Pending',
            startDate: '2023-05-05',
            endDate: '2023-05-07'
        }, {
            id: 3,
            requestedBy: 'Philips Doe',
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

            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Manage Leave Requests</Typography>
            </Stack>

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
                                    {leaveHistory.map((lh) => (
                                        <TableRow
                                            key={lh.id}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {lh.requestedBy}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {lh.title}
                                            </TableCell>
                                            <TableCell component="th" scope="row">{lh.note}</TableCell>
                                            <TableCell align="center">{lh.value}</TableCell>
                                            {/*    <Label color={(status === 'banned' && 'error') || 'success'}>{status}</Label> */}
                                            <TableCell align="right">
                                                <Chip label={lh.status} size='small' color={lh.status === 'Approved' ? 'success' : 'error'} />
                                            </TableCell>
                                            <TableCell align="right">{lh.startDate}</TableCell>
                                            <TableCell align="right">{lh.endDate}</TableCell>
                                            <TableCell align="right">
                                                <ButtonGroup size="small" aria-label="Small button group">
                                                    <Button variant="contained" color="success" size="small">Approve</Button>
                                                    <Button variant="contained" color="error" size="small">Reject</Button>
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

        </Container>
    )
}