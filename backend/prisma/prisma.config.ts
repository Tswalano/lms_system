// prisma.config.ts
const config = {
    // other configuration options...
    migrate: {
        url: process.env.DATABASE_URL,
    },
};

export default config;