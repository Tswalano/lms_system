import * as dotenv from 'dotenv';
dotenv.config();

import { serve } from '@hono/node-server';
import { watch } from 'node:fs';
import { app } from './index';
import "dotenv/config";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Start the server
serve({
    fetch: app.fetch,
    port,
});

console.log(`Server is running on http://localhost:${port}`);
// cp -r **/lambda/*.js dist/lambda/ || true
// find lambda/ -type f \( -name "*.js" -o -name "*.json" \) -exec cp --parents {} dist/ \;