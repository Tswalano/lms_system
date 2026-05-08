/**
 * Local smoke test for the Outlook calendar integration.
 *
 * Usage:
 *   npx ts-node -r dotenv/config scripts/testOutlookCalendar.ts
 *
 * Make sure AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET are set in .env
 * and OUTLOOK_SHARED_MAILBOX points to your shared leave calendar mailbox.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createLeaveEvents, deleteLeaveEvents } from '../lambda/integrations/outlookCalendar';

const EMPLOYEE_EMAIL = process.env.TEST_EMPLOYEE_EMAIL || 'glen.mogane@disraptor.co.za';

async function run() {
    console.log('=== Outlook Calendar Integration — Local Smoke Test ===\n');
    console.log(`Shared mailbox : ${process.env.OUTLOOK_SHARED_MAILBOX}`);
    console.log(`Employee email : ${EMPLOYEE_EMAIL}`);
    console.log(`Tenant ID      : ${process.env.AZURE_TENANT_ID ? '✓ set' : '✗ MISSING'}`);
    console.log(`Client ID      : ${process.env.AZURE_CLIENT_ID ? '✓ set' : '✗ MISSING'}`);
    console.log(`Client secret  : ${process.env.AZURE_CLIENT_SECRET ? '✓ set' : '✗ MISSING'}\n`);

    if (!process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
        console.error('ERROR: Azure credentials missing from .env — add AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
        process.exit(1);
    }

    // ── Step 1: Create leave events ─────────────────────────────────────────
    console.log('Step 1: Creating leave events (2024-06-10 → 2024-06-14)...');
    const result = await createLeaveEvents({
        employeeEmail: EMPLOYEE_EMAIL,
        employeeName: 'Test Employee',
        leaveType: 'Annual Leave',
        startDate: '2024-06-10',
        endDate: '2024-06-14',
        managerName: 'Test Manager',
    });

    console.log(`  Shared calendar event ID  : ${result.sharedEventId ?? 'FAILED (check logs above)'}`);
    console.log(`  Personal calendar event ID: ${result.personalEventId ?? 'FAILED (check logs above)'}\n`);

    if (!result.sharedEventId && !result.personalEventId) {
        console.error('Both event creations failed — check the [Outlook] error logs above.');
        process.exit(1);
    }

    console.log('Check Outlook now — you should see an OOF event on both calendars.\n');

    // ── Step 2: Wait for confirmation ───────────────────────────────────────
    await new Promise(res => setTimeout(res, 3000));

    // ── Step 3: Delete leave events ─────────────────────────────────────────
    console.log('Step 3: Deleting leave events...');
    await deleteLeaveEvents(result.sharedEventId, result.personalEventId, EMPLOYEE_EMAIL);
    console.log('  Done — events should now be removed from both calendars.\n');

    console.log('=== Smoke test complete ===');
}

run().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
