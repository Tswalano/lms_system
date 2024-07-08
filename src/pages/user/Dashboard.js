
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Button, Card, Stack } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useStateContext } from '../../context';
import { capitalizeName } from '../../utils/Util';
import { leaveHistoryTable } from '../leaveHistory';


function Dashboard() {

  const ctx = useContext(AuthContext);

  const stateContext = useStateContext();

  const user = stateContext.state.authUser;

  const leaveBalance = [
    {
      id: 1,
      title: 'Sick Leave',
      value: 12,
      icon: ' 🤒'
    },
    {
      id: 2,
      title: 'Study Leave',
      value: 15,
      icon: '📚'
    },
    {
      id: 3,
      title: 'Maternity Leave',
      value: 14,
      icon: '🍼'
    },
    {
      id: 4,
      title: 'Annual Leave',
      value: 21,
      icon: '🎉'
    }
  ]

  const leaveHistory = [
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
      <Typography variant="h4" sx={{ mb: 5 }}>
        Hello <span style={{ color: '#04A1EA', fontWeight: 'bold' }}>{capitalizeName(user.firstName)}</span>, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {
          leaveBalance.map((item) => (
            <Grid key={item.id} xs={12} sm={6} md={3}>
              <Card
                component={Stack}
                spacing={3}
                direction="row"
                sx={{
                  px: 3,
                  py: 5,
                  borderRadius: 2
                }}
              >
                <Box sx={{ width: 64, height: 64 }}>
                  <Typography variant="h2">
                    {item.icon}
                  </Typography>
                </Box>

                <Stack spacing={0.5}>
                  <Typography variant="h4">
                    {item.value}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                    {item.title}
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          ))
        }

      </Grid>

      <Grid>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 5 }}>
          <Typography variant="h4">Leave History</Typography>

          <Button variant="contained" color="primary" startIcon={<>➕</>}>
            New Request
          </Button>
        </Stack>
        <Card>
          {leaveHistoryTable(leaveHistory)}
        </Card>
      </Grid>
    </Container>
  );
}


export default Dashboard;
