import { Box, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { capitalizeName } from '../utils/Util';
import { useStateContext } from '../context';

const Greeting = () => {
    const stateContext = useStateContext();
    const user = stateContext.state.authUser;
    const [greeting, setGreeting] = useState<string>('');
    const [time, setTime] = useState<Date>(new Date());

    useEffect(() => {
        // Update the time every minute
        const interval = setInterval(() => setTime(new Date()), 60000);

        // Determine the greeting based on the current hour
        const currentHour = time.getHours();
        if (currentHour < 12) {
            setGreeting('Good morning 👋');
        } else if (currentHour < 18) {
            setGreeting('Good afternoon 🌞');
        } else {
            setGreeting('Good evening 🌛');
        }

        // Clean up the interval on component unmount
        return () => clearInterval(interval);
    }, [time]);

    // Format the date and time
    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <Box sx={{ mb: 5 }}>
            <Typography
                variant="h4"
                sx={{ fontWeight: '500' }}
            >
                {greeting},   <span style={{ color: "#04A1EA", fontWeight: "bold" }}>
                    {capitalizeName(` ${user?.firstName} ${user?.lastName}. `)}
                </span>
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: '8px' }}>
                {formattedDate} {formattedTime}
            </Typography>
        </Box>
    );
};

export default Greeting;
