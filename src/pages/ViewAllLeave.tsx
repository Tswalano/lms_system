import { useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { LeaveAPIResponseUID, LeaveRequest } from '../api/types';
import { useState, useEffect } from 'react';
import { sysColors } from '../utils/Util';
import { Button } from '@mui/material';

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

  // Get unique user names and sort them alphabetically
  const uniqueUsers = Array.from(new Set(leaveData.map(item => item.fullName))).sort((a, b) =>
    a.localeCompare(b)
  );

  const handleEditRequest = (leaveData: LeaveRequest) => {
    // Handle the edit request here
    console.log("Edit Leave Request:", leaveData);
  };

  // Format date to "Day, Month Year" (e.g., "12, March 2024")
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit', // Ensures the day is always two digits (e.g., "01", "11")
        month: 'long',  // Full month name (e.g., "November")
        year: 'numeric', // Full year (e.g., "2024")
    };
    return new Date(dateString).toLocaleDateString('en-GB', options); // 'en-GB' locale formats the date as "dd MMMM yyyy"
};
  return (
    <div style={{ maxWidth: '100%', overflowX: 'auto', marginTop: '1rem' }}>
      {/* If no user is selected, display the user names and "View" button */}
      {selectedUser === null ? (
        <div>
          <h2 style={{ color: 'black', marginBottom: '1rem' }}>Employees Leave History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: sysColors.primary, color: 'white' }}>
              <tr>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Action</th> {/* Add Action column */}
              </tr>
            </thead>
            <tbody>
              {uniqueUsers.map((user, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '10px', borderBottom: '1px solid #ddd', color: 'black' }}>
                    {user}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    {/* "View" button */}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setSelectedUser(user)} // Set selected user when clicked
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // If a user is selected, display their leave history
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: sysColors.primarylight,
              borderRadius: '4px',
              color: 'black',
              fontWeight: 'bold',
            }}
          >
            
            <span><button
              onClick={() => setSelectedUser(null)} // Reset selected user
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'black',
              }}
            >
              ✕
            </button>{selectedUser}'s Leave History</span>
            
          </div>
          {/* Render leave history for selected user */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: sysColors.primary, color: 'white' }}>
              <tr>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Leave Type</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Start Date</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>End Date</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Days Taken</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveData
                .filter(item => item.fullName === selectedUser)
                .map((leaveRequest, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      {leaveRequest.leave_type}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      {formatDate(leaveRequest.start_date)} {/* Formatted Start Date */}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      {formatDate(leaveRequest.end_date)} {/* Formatted End Date */}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      {leaveRequest.duration} {/* Duration directly from leaveRequest */}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      {leaveRequest.status}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ViewAllLeave;
