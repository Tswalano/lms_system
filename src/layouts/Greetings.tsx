import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { capitalizeName } from "../utils/Util";
import { useStateContext } from "../context";

const Greeting = () => {
    const stateContext = useStateContext();
    const user = stateContext.state.authUser;
    const [greeting, setGreeting] = useState("");
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const currentHour = time.getHours();
        if (currentHour < 12) {
            setGreeting("Good morning ☀️");
        } else if (currentHour < 18) {
            setGreeting("Good afternoon 🌤️");
        } else {
            setGreeting("Good evening 🌙");
        }
    }, [time]);

    const formattedTime = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    const formattedDate = time.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <Box sx={{ mb: 2, textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: "500" }}>
                {greeting},
                <span style={{ color: "#04A1EA", fontWeight: "bold" }}>
                    {capitalizeName(` ${user?.firstName} ${user?.lastName}`)}.
                </span>
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 1 }}>
                {formattedDate} | {formattedTime}
            </Typography>
        </Box>
    );
};

export default Greeting;
