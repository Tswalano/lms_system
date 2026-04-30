import type { ZudokuConfig } from "zudoku";

const isProd = process.env.NODE_ENV === "production";

const config: ZudokuConfig = {
    basePath: isProd ? "/docs" : "/",
    page: {
        pageTitle: "LMS API Documentation",
    },
    redirects: [
        { from: "/", to: "/docs/introduction" },
    ],
    topNavigation: [
        { id: "docs", label: "Guides" },
        { id: "api", label: "API Reference" },
    ],
    sidebar: {
        docs: [
            {
                type: "category",
                label: "Getting Started",
                items: ["docs/introduction", "docs/authentication", "docs/errors"],
            },
        ],
    },
    apis: [
        {
            type: "file",
            input: "./openapi.yaml",
            path: "/api",
            navigationId: "api",
        },
    ],
    docs: {
        files: "/pages/**/*.{md,mdx}",
    },
};

export default config;
