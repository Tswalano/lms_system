type LeaveStatus = 'approved' | 'rejected' | 'pending' | 'cancelled';

interface EmailTemplateData {
    subject: string;
    name: string;
    status: LeaveStatus
    body: string;
}

interface ManagementTemplateData {
    subject: string;
    employeeName: string;
    employeeEmail: string;
    status: LeaveStatus;
    body: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
}

interface TemplateVariables {
    subject: string;
    name: string;
    status: LeaveStatus
    body: string;
}

interface ManagementTemplateVariables {
    subject: string;
    employeeName: string;
    employeeEmail: string;
    status: LeaveStatus;
    body: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
}

async function renderEmailTemplate(variables: TemplateVariables): Promise<string> {
    console.log("Rendering email template with variables:", variables);

    try {
        // Validate required variables
        if (!variables.subject || !variables.name || !variables.status || !variables.body) {
            throw new Error("Missing required template variables. Required: subject, name, status, body");
        }

        // Validate status value
        const validStatuses = ['approved', 'rejected', 'pending'];
        if (!validStatuses.includes(variables.status)) {
            throw new Error(`Invalid status value: ${variables.status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        console.log("Template variables validated successfully");

        // Create EmailTemplateData object
        const templateData: EmailTemplateData = {
            subject: variables.subject,
            name: variables.name,
            status: variables.status,
            body: variables.body
        };

        console.log("Generating HTML from template...");

        // Render the HTML using our string template
        const html: string = emailTemplate(templateData);

        console.log("Template rendered successfully, HTML size:", html.length, "characters");

        return html;
    } catch (error) {
        console.error("Error rendering email template:", error);
        throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function renderManagementEmailTemplate(variables: ManagementTemplateVariables): Promise<string> {
    console.log("Rendering management email template with variables:", variables);

    try {
        // Validate required variables
        if (!variables.subject || !variables.employeeName || !variables.employeeEmail || !variables.status || !variables.body) {
            throw new Error("Missing required management template variables. Required: subject, employeeName, employeeEmail, status, body");
        }

        // Validate status value
        const validStatuses: LeaveStatus[] = ['approved', 'rejected', 'pending', 'cancelled'];
        if (!validStatuses.includes(variables.status)) {
            throw new Error(`Invalid status value: ${variables.status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        console.log("Management template variables validated successfully");

        // Create ManagementTemplateData object
        const templateData: ManagementTemplateData = {
            subject: variables.subject,
            employeeName: variables.employeeName,
            employeeEmail: variables.employeeEmail,
            status: variables.status,
            body: variables.body,
            leaveType: variables.leaveType,
            startDate: variables.startDate,
            endDate: variables.endDate,
            duration: variables.duration
        };

        console.log("Generating management HTML from template...");

        // Render the HTML using our management template
        const html: string = managementEmailTemplate(templateData);

        console.log("Management template rendered successfully, HTML size:", html.length, "characters");

        return html;
    } catch (error) {
        console.error("Error rendering management email template:", error);
        throw new Error(`Failed to render management email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Optional: Helper function to create template variables with defaults
function createTemplateVariables(
    name: string,
    status: 'approved' | 'rejected' | 'pending',
    body: string,
    subject?: string
): TemplateVariables {
    return {
        subject: subject || `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        name,
        status,
        body
    };
}

// Helper function to create management template variables
function createManagementTemplateVariables(
    employeeName: string,
    employeeEmail: string,
    status: LeaveStatus,
    body: string,
    subject?: string,
    leaveType?: string,
    startDate?: string,
    endDate?: string,
    duration?: string
): ManagementTemplateVariables {
    return {
        subject: subject || `[MANAGEMENT] Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)} - ${employeeName}`,
        employeeName,
        employeeEmail,
        status,
        body,
        leaveType,
        startDate,
        endDate,
        duration
    };
}

const emailTemplate = (data: EmailTemplateData): string => {
    const { subject, name, status, body } = data;

    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 20px;
            display: block;
        }

        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 8px;
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
        }

        .status-card {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid;
            position: relative;
        }

        .status-approved {
            border-left-color: #10b981;
            background-color: #f0fdf4;
        }

        .status-rejected {
            border-left-color: #ef4444;
            background-color: #fef2f2;
        }

        .status-pending {
            border-left-color: #f59e0b;
            background-color: #fffbeb;
        }

        .status-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .status-approved .status-title {
            color: #065f46;
        }

        .status-rejected .status-title {
            color: #991b1b;
        }

        .status-pending .status-title {
            color: #92400e;
        }

        .status-message {
            font-size: 16px;
            line-height: 1.5;
        }

        .status-approved .status-message {
            color: #047857;
        }

        .status-rejected .status-message {
            color: #dc2626;
        }

        .status-pending .status-message {
            color: #d97706;
        }

        .message-body {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 32px;
        }

        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 16px;
        }

        .footer-link {
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
        }

        .footer-link:hover {
            color: #4f46e5;
        }

        .company-info {
            font-size: 12px;
            color: #9ca3af;
        }

        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }

            .header,
            .content,
            .footer {
                padding: 30px 20px;
            }

            .header h1 {
                font-size: 20px;
            }

            .greeting {
                font-size: 16px;
            }

            .status-card {
                padding: 20px;
            }
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <img src="https://media.licdn.com/dms/image/v2/C4D0BAQHlFAds119B6A/company-logo_200_200/company-logo_200_200/0/1630575475283/disraptor_pty_ltd_logo?e=2147483647&v=beta&t=cQL2fJXEZpeu3rK3s5iQ9BJdIGKvAhYldV6Z6spiUTI" alt="Disraptor Logo" />
            </div>
            <h1>Disraptor LMS</h1>
            <p>Leave Management System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hello ${name},</div>

            <!-- Status Card -->
            <div class="status-card status-${status.toLowerCase()}">
                <div class="status-title">
                    Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                <div class="status-message">
                    ${body}
                </div>
            </div>

            <div class="message-body">
                ${status.toLowerCase() === 'approved' ?
            'Your leave request has been approved! You can now proceed with your planned time off. Please ensure all handover documentation is completed before your leave begins.' :
            status.toLowerCase() === 'rejected' ?
                'Unfortunately, your leave request has been declined. Please contact your manager or HR department for more information about this decision.' :
                'Your leave request is currently being reviewed. You will receive another notification once a decision has been made.'}
            </div>

            <div class="message-body">
                    Regards,
                    <br>
                    <strong>Disraptor Leave Management System</strong>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                This is an automated message from the Disraptor Leave Management System.
            </div>

            <div class="company-info">
                © ${new Date().getFullYear()} Disraptor. All rights reserved.<br>
                This email was sent to ${name} regarding leave request status update.
            </div>
        </div>
    </div>
</body>

</html>`;
};

const managementEmailTemplate = (data: ManagementTemplateData): string => {
    const { subject, employeeName, employeeEmail, status, body, leaveType, startDate, endDate, duration } = data;

    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 20px;
            display: block;
        }

        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 8px;
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .management-badge {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .content {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
        }

        .employee-info {
            background-color: #f3f4f6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border-left: 4px solid #6b7280;
        }

        .employee-info h3 {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .info-label {
            font-weight: 500;
            color: #6b7280;
        }

        .info-value {
            color: #374151;
            font-weight: 500;
        }

        .status-card {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid;
            position: relative;
        }

        .status-approved {
            border-left-color: #10b981;
            background-color: #f0fdf4;
        }

        .status-rejected {
            border-left-color: #ef4444;
            background-color: #fef2f2;
        }

        .status-pending {
            border-left-color: #f59e0b;
            background-color: #fffbeb;
        }

        .status-cancelled {
            border-left-color: #6b7280;
            background-color: #f9fafb;
        }

        .status-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .status-approved .status-title {
            color: #065f46;
        }

        .status-rejected .status-title {
            color: #991b1b;
        }

        .status-pending .status-title {
            color: #92400e;
        }

        .status-cancelled .status-title {
            color: #374151;
        }

        .status-message {
            font-size: 16px;
            line-height: 1.5;
        }

        .status-approved .status-message {
            color: #047857;
        }

        .status-rejected .status-message {
            color: #dc2626;
        }

        .status-pending .status-message {
            color: #d97706;
        }

        .status-cancelled .status-message {
            color: #6b7280;
        }

        .message-body {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 32px;
        }

        .action-required {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }

        .action-required h4 {
            color: #92400e;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .action-required p {
            color: #d97706;
            font-size: 14px;
        }

        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 16px;
        }

        .company-info {
            font-size: 12px;
            color: #9ca3af;
        }

        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }

            .header,
            .content,
            .footer {
                padding: 30px 20px;
            }

            .header h1 {
                font-size: 20px;
            }

            .greeting {
                font-size: 16px;
            }

            .status-card {
                padding: 20px;
            }

            .info-row {
                flex-direction: column;
                gap: 4px;
            }
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <img src="https://media.licdn.com/dms/image/v2/C4D0BAQHlFAds119B6A/company-logo_200_200/company-logo_200_200/0/1630575475283/disraptor_pty_ltd_logo?e=2147483647&v=beta&t=cQL2fJXEZpeu3rK3s5iQ9BJdIGKvAhYldV6Z6spiUTI" alt="Disraptor Logo" />
            </div>
            <div class="management-badge">Management Notification</div>
            <h1>Disraptor LMS</h1>
            <p>Leave Management System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Dear Management Team,</div>

            <div class="message-body">
                A new leave request has been submitted by <strong>${employeeName}</strong>. Please review the details below:
            </div>

            <!-- Status Card -->
            <div class="status-card status-${status.toLowerCase()}">
                <div class="status-title">
                    Leave Request Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                <div class="status-message">
                    ${body}
                </div>
            </div>

            <!-- Employee Information -->
            <div class="employee-info">
                <h3>Employee Leave Request Details</h3>
                <div class="info-row">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">${employeeName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${employeeEmail}</span>
                </div>
                ${leaveType ? `
                <div class="info-row">
                    <span class="info-label">Leave Type:</span>
                    <span class="info-value">${leaveType}</span>
                </div>` : ''}
                ${startDate ? `
                <div class="info-row">
                    <span class="info-label">Start Date:</span>
                    <span class="info-value">${startDate}</span>
                </div>` : ''}
                ${endDate ? `
                <div class="info-row">
                    <span class="info-label">End Date:</span>
                    <span class="info-value">${endDate}</span>
                </div>` : ''}
                ${duration ? `
                <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${duration}</span>
                </div>` : ''}
            </div>

            ${status.toLowerCase() === 'pending' ? `
            <div class="action-required">
                <h4>🔔 Action Required</h4>
                <p>This leave request requires management approval. Please review and take appropriate action.</p>
            </div>` : ''}

            <div class="message-body">
                ${status.toLowerCase() === 'approved' ?
            'The employee has been notified that their leave request has been approved. Please ensure proper handover procedures are followed.' :
            status.toLowerCase() === 'rejected' ?
                'The employee has been notified that their leave request has been declined. You may want to follow up with them directly.' :
                status.toLowerCase() === 'cancelled' ?
                    'The employee\'s leave request has been cancelled. The employee has been notified of this change.' :
                    'This leave request is awaiting your review and approval. Please log into the LMS to process this request.'}
            </div>

            <div class="message-body">
                Regards,
                <br>
                <strong>Disraptor Leave Management System</strong>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                This is an automated management notification from the Disraptor Leave Management System.
            </div>

            <div class="company-info">
                © ${new Date().getFullYear()} Disraptor. All rights reserved.<br>
                This notification was sent regarding ${employeeName}'s leave request.
            </div>
        </div>
    </div>
</body>

</html>`;
};

// Usage example:
const generateEmail = (templateData: EmailTemplateData): string => {
    return emailTemplate(templateData);
};

const generateManagementEmail = (templateData: ManagementTemplateData): string => {
    return managementEmailTemplate(templateData);
};

export {
    emailTemplate,
    managementEmailTemplate,
    generateEmail,
    generateManagementEmail,
    EmailTemplateData,
    ManagementTemplateData,
    renderEmailTemplate,
    renderManagementEmailTemplate,
    createTemplateVariables,
    createManagementTemplateVariables,
    TemplateVariables,
    ManagementTemplateVariables,
    LeaveStatus
};