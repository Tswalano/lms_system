import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { capitalizeName } from "../utils/Util";
import { useStateContext } from "../context";
import { motion } from "framer-motion";

interface User {
    firstName: string;
    lastName: string;
}

const Greeting: React.FC = () => {
    const stateContext = useStateContext();
    const user = stateContext.state.authUser;
    const [greeting, setGreeting] = useState<string>("");
    const [icon, setIcon] = useState<string>("");
    const [time, setTime] = useState<Date>(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const currentHour = time.getHours();
        if (currentHour < 12) {
            setGreeting("Good morning");
            setIcon("☀️");
        } else if (currentHour < 18) {
            setGreeting("Good afternoon");
            setIcon("🌤️");
        } else {
            setGreeting("Good evening");
            setIcon("🌙");
        }
    }, [time]);

    const formattedTime: string = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const formattedDate: string = time.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "anticipate", wordwrap: "break-word" }}
        >
            <Box sx={{ mb: 4, textAlign: "center" }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: "500",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                        wordwrap: "break-word"
                    }}
                >
                    {/* <AnimatePresence mode="wait"> */}
                    <motion.span
                        key={icon}
                        initial={{ scale: 0, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 90, opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        {icon}
                    </motion.span>
                    {/* </AnimatePresence> */}
                    {greeting},
                    <span style={{ color: "#04A1EA", fontWeight: "bold" }}>
                        {capitalizeName(` ${user?.firstName ?? ""} ${user?.lastName ?? ""}`)}.
                    </span>
                </Typography>
                <Typography sx={{ color: "text.secondary", mt: 1 }}>
                    {formattedDate} | {formattedTime}
                </Typography>
            </Box>
        </motion.div>
    );
};

export default Greeting;
