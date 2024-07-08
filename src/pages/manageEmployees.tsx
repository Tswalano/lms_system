import React from 'react'
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Button, ButtonGroup, Card, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

type Props = {}

function ManageEmployees({ }: Props) {

    const randomUser = [{
        id: 1,
        name: 'Danny Martin',
        occupation: 'Frontend Developer',
        email: 'danny@me.com',
        status: 'Active'

    },
    {
        id: 2,
        name: 'John Doe',
        occupation: 'Backend Developer',
        email: 'john@me.com',
        status: 'Inactive'
    },
    {
        id: 3,
        name: 'Jane Doe',
        occupation: 'Fullstack Developer',
        email: 'jane@me.com',
        status: 'Active'
    }]

    return (
        <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Disraptor Employees</Typography>
            </Stack>

            <Grid>
                <Card>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }} aria-label="a dense table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Occupation</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {randomUser.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {user.name}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {user.occupation}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {user.email}
                                            </TableCell>
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

export default ManageEmployees