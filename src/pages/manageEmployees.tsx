import React from 'react'
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ButtonGroup, Card, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';
import AddUserModal from '../components/ui/AddUserModal';
import { useQuery } from '@tanstack/react-query';
import { getAllUsersFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
// import { CognitoUser } from '../api/types';
import { formatDateTimeToSAST, capitalizeName } from '../utils/Util';

function ManageEmployees() {
    const [cookies,] = useCookies(['token']);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    // const [employees, setEmployees] = React.useState<CognitoUser[]>([])

    // toggle modal
    const handleModal = () => {
        setIsModalOpen(!isModalOpen);
    }

    const { data, isError, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['listUsers'],
        queryFn: () => getAllUsersFn(cookies.token),
        select: (data) => {
            if (data.error) {
                return []
            }

            return data.payload
        },
    });


    return (
        <Container maxWidth="xl">

            {/* dialog */}
            <AddUserModal handleClose={handleModal} open={isModalOpen} refetch={refetch} />

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
                                                    <ButtonGroup variant="contained" aria-label="outlined primary button group">
                                                        <Button size='small'>View</Button>
                                                        {/* <Button size='small' color="warning">Edit</Button> */}
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