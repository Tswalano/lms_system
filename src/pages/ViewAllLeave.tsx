import { useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { LeaveAPIResponseUID } from '../api/types';
import { useState, useEffect } from 'react';
import { sysColors } from '../utils/Util';

function ViewAllLeave() {
    const [leaveData, setLeaveData] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null); // Track selected user
    const [cookies] = useCookies(["token"]);

    const { data } = useQuery<LeaveAPIResponseUID>({
        queryKey: ['leaveRequestTable'],
        queryFn: () => getAllLeaveRequestsFn(cookies.token),
    });

    useEffect(() => {
        if (data?.leaveData && data.leaveData.length > 0) {
            const filteredData = data.leaveData.filter(item => item.status !== "Rejected");
            setLeaveData(filteredData);
        }
    }, [data?.leaveData]);

    // Get unique user names and sort them alphabetically
    const uniqueUsers = Array.from(new Set(leaveData.map(item => item.fullName))).sort((a, b) =>
        a.localeCompare(b)
    );

    // Format date to "11 November 2024"
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit', // Ensures the day is always two digits (e.g., "01", "11")
            month: 'long',  // Full month name (e.g., "November")
            year: 'numeric', // Full year (e.g., "2024")
        };
        return new Date(dateString).toLocaleDateString('en-GB', options); // 'en-GB' locale formats the date as "dd MMMM yyyy"
    };

    // Calculate leave duration in days
    const calculateDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDiff = end.getTime() - start.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 because both start and end days are inclusive
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'auto', marginTop: '1rem' }}>
            {/* If no user selected, display user names */}
            {selectedUser === null ? (
                <div>
                    {/* Heading */}
                    <h2 style={{ color: 'black', marginBottom: '1rem' }}>Employees Leave History</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: sysColors.primary, color: 'white' }}>
                            <tr>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueUsers.map((user, index) => (
                                <tr
                                    key={index}
                                    style={{
                                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                                        cursor: 'pointer',  // Indicate that it's clickable
                                    }}
                                    onClick={() => setSelectedUser(user)} // Set selected user
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'} // Hover effect
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white'} // Revert hover effect
                                >
                                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd', color: 'black' }}>
                                        {user}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // If a user is selected, display their leave history
                <div>
                    {/* Header with user's name and close button */}
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
                        <span>{selectedUser}'s Leave History</span>
                        <button
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
                        </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: sysColors.primary, color: 'white' }}>
                            <tr>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Leave Type</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Start Date</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>End Date</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Duration (Days)</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveData
                                .filter(item => item.fullName === selectedUser) // Filter by selected user
                                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()) // Sort by latest to oldest
                                .map((item, index) => (
                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {item.leave_type}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {formatDate(item.start_date)}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {formatDate(item.end_date)}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {calculateDuration(item.start_date, item.end_date)} days
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px',
                                                borderBottom: '1px solid #ddd',
                                                color: item.status === "pending" ? sysColors.warning : sysColors.success,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {item.status}
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
