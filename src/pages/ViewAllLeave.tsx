import { useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { LeaveAPIResponseUID, LeaveRequest } from '../api/types';
import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Chip, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { sysColors } from '../utils/Util';

function ViewAllLeave() {
  const [leaveData, setLeaveData] = useState<LeaveRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [cookies] = useCookies(['token']);

  const { data } = useQuery<LeaveAPIResponseUID>({
    queryKey: ['leaveRequestTable'],
    queryFn: () => getAllLeaveRequestsFn(cookies.token),
  });

  useEffect(() => {
    if (data?.leaveData && data.leaveData.length > 0) {
      const filteredData = data.leaveData.filter(item => item.status !== 'Rejected');
      setLeaveData(filteredData);
    }
  }, [data?.leaveData]);

  const uniqueUsers = Array.from(new Set(leaveData.map(item => item.fullName))).sort((a, b) => a.localeCompare(b));

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: "#04A1EA", mb: 2, fontWeight: 'bold' }}>
        Employees Leave History
      </Typography>

      {selectedUser === null ? (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={2}>
          {uniqueUsers.map((user, index) => (
            <Card key={index} sx={{ background: index % 2 === 0 ? '#e3f2fd' : '#bbdefb', cursor: 'pointer' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{user}</Typography>
                <Button variant="contained" color="primary" onClick={() => setSelectedUser(user)}>
                  View Leave History
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Slide direction="left" in={!!selectedUser} mountOnEnter unmountOnExit>
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ color: "#00C7FA", fontWeight: 'bold' }}>
                {selectedUser}'s Leave History
              </Typography>
              <IconButton onClick={() => setSelectedUser(null)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: sysColors.primary, color: 'white' }}>
                    <TableCell sx={{ color: 'white' }}>Leave Type</TableCell>
                    <TableCell sx={{ color: 'white' }}>Start Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>End Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Days Taken</TableCell>
                    <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveData
                    .filter(item => item.fullName === selectedUser)
                    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                    .map((leaveRequest, index) => (
                      <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#f1f8e9' : '#e8f5e9' }}>
                        <TableCell>{leaveRequest.leave_type}</TableCell>
                        <TableCell>{formatDate(leaveRequest.start_date)}</TableCell>
                        <TableCell>{formatDate(leaveRequest.end_date)}</TableCell>
                        <TableCell>{leaveRequest.duration}</TableCell>
                        <TableCell>
                          <Chip label={leaveRequest.status} color={getStatusColor(leaveRequest.status)} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Slide>
      )}
    </Box>
  );
}

export default ViewAllLeave;
