import { renderTemplate } from './templateRenderer';

type LeaveStatus = 'approved' | 'rejected' | 'pending' | 'cancelled';

interface EmailTemplateData {
    subject: string;
    name: string;
    status: LeaveStatus;
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
    status: LeaveStatus;
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

interface DocumentReminderData {
    employeeName: string;
    documents: Array<{
        name: string;
        isMandatory: boolean;
        dueDate?: string;
        assignedDate: string;
    }>;
    portalUrl: string;
}

interface DocumentReminderVariables {
    employeeName: string;
    documents: Array<{
        name: string;
        isMandatory: boolean;
        dueDate?: string;
        assignedDate: string;
    }>;
    portalUrl: string;
}

const STATUS_MESSAGES: Record<LeaveStatus, string> = {
    approved: 'Your leave request has been approved! You can now proceed with your planned time off. Please ensure all handover documentation is completed before your leave begins.',
    rejected: 'Unfortunately, your leave request has been declined. Please contact your manager or HR department for more information about this decision.',
    pending: 'Your leave request is currently being reviewed. You will receive another notification once a decision has been made.',
    cancelled: 'Your leave request has been cancelled.',
};

const MANAGEMENT_STATUS_MESSAGES: Record<LeaveStatus, string> = {
    approved: 'This request has been approved and the employee has been notified. Please ensure a handover plan is in place before the leave starts.',
    rejected: 'This request has been declined and the employee has been notified. Consider following up directly if the employee may need to resubmit.',
    cancelled: 'This leave request has been cancelled. The employee has been notified. No further action is required unless a replacement was already arranged.',
    pending: 'This request is pending your review. Please log in to the LMS portal to approve or decline it.',
};

function buildDateRangeText(duration: string | undefined, startDate: string | undefined, endDate: string | undefined): string {
    if (!startDate) return '';
    const dur = (duration ?? '').toLowerCase().trim();
    const isSingleDay = dur.includes('half') || dur === '1 day' || dur === '1 days' || dur === '0.5 days';
    if (isSingleDay || !endDate || endDate === startDate) {
        return `on <strong>${startDate}</strong>`;
    }
    return `from <strong>${startDate}</strong> to <strong>${endDate}</strong>`;
}

function buildDocumentsHtml(documents: DocumentReminderData['documents']): string {
    return documents.map(doc => `
        <div class="document-item">
            <div class="document-name">
                ${doc.name}
                ${doc.isMandatory ? '<span class="mandatory-badge">Mandatory</span>' : ''}
            </div>
            <div class="document-meta">
                ${doc.dueDate
                    ? `<span class="due-date">Due: ${doc.dueDate}</span>`
                    : `<span>Assigned: ${doc.assignedDate}</span>`}
            </div>
        </div>
    `).join('');
}

const emailTemplate = (data: EmailTemplateData): string => {
    const statusClass = data.status.toLowerCase();
    const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);

    return renderTemplate('leaveStatus', {
        subject: data.subject,
        name: data.name,
        statusClass,
        statusLabel,
        body: data.body,
        messageBody: STATUS_MESSAGES[data.status] ?? '',
        year: String(new Date().getFullYear()),
    });
};

const managementEmailTemplate = (data: ManagementTemplateData): string => {
    const statusClass = data.status.toLowerCase();
    const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);

    return renderTemplate('managementNotification', {
        subject: data.subject,
        employeeName: data.employeeName,
        statusClass,
        statusLabel,
        leaveType: data.leaveType ?? 'leave',
        duration: data.duration ?? '',
        dateRangeText: buildDateRangeText(data.duration, data.startDate, data.endDate),
        statusMessage: MANAGEMENT_STATUS_MESSAGES[data.status] ?? '',
        body: data.body,
        year: String(new Date().getFullYear()),
    });
};

const documentReminderTemplate = (data: DocumentReminderData): string => {
    return renderTemplate('documentReminder', {
        employeeName: data.employeeName,
        documentsHtml: buildDocumentsHtml(data.documents),
        portalUrl: data.portalUrl,
    });
};

const documentAssignedTemplate = (data: DocumentReminderData): string => {
    return renderTemplate('documentAssigned', {
        employeeName: data.employeeName,
        documentsHtml: buildDocumentsHtml(data.documents),
        portalUrl: data.portalUrl,
    });
};

interface ReviewCycleReminderData {
    employeeName: string;
    cycleName: string;
    endDate: string;
    pendingItems: string[];
    portalUrl: string;
}

const reviewCycleReminderTemplate = (data: ReviewCycleReminderData): string => {
    return renderTemplate('reviewCycleReminder', {
        employeeName: data.employeeName,
        cycleName: data.cycleName,
        endDate: data.endDate,
        pendingItemsHtml: data.pendingItems.map((item) => `<div class="item">${item}</div>`).join(''),
        portalUrl: data.portalUrl,
    });
};

async function renderEmailTemplate(variables: TemplateVariables): Promise<string> {
    if (!variables.subject || !variables.name || !variables.status || !variables.body) {
        throw new Error('Missing required template variables. Required: subject, name, status, body');
    }

    const validStatuses: LeaveStatus[] = ['approved', 'rejected', 'pending'];
    if (!validStatuses.includes(variables.status)) {
        throw new Error(`Invalid status value: ${variables.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return emailTemplate({
        subject: variables.subject,
        name: variables.name,
        status: variables.status,
        body: variables.body,
    });
}

async function renderManagementEmailTemplate(variables: ManagementTemplateVariables): Promise<string> {
    if (!variables.subject || !variables.employeeName || !variables.status || !variables.body) {
        throw new Error('Missing required management template variables. Required: subject, employeeName, status, body');
    }

    const validStatuses: LeaveStatus[] = ['approved', 'rejected', 'pending', 'cancelled'];
    if (!validStatuses.includes(variables.status)) {
        throw new Error(`Invalid status value: ${variables.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return managementEmailTemplate({
        subject: variables.subject,
        employeeName: variables.employeeName,
        employeeEmail: variables.employeeEmail,
        status: variables.status,
        body: variables.body,
        leaveType: variables.leaveType,
        startDate: variables.startDate,
        endDate: variables.endDate,
        duration: variables.duration,
    });
}

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
        body,
    };
}

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
        duration,
    };
}

const generateEmail = (templateData: EmailTemplateData): string => emailTemplate(templateData);
const generateManagementEmail = (templateData: ManagementTemplateData): string => managementEmailTemplate(templateData);
const generateDocumentReminderEmail = (templateData: DocumentReminderData): string => documentReminderTemplate(templateData);

export {
    emailTemplate,
    managementEmailTemplate,
    documentReminderTemplate,
    documentAssignedTemplate,
    reviewCycleReminderTemplate,
    ReviewCycleReminderData,
    generateEmail,
    generateManagementEmail,
    generateDocumentReminderEmail,
    EmailTemplateData,
    ManagementTemplateData,
    DocumentReminderData,
    renderEmailTemplate,
    renderManagementEmailTemplate,
    createTemplateVariables,
    createManagementTemplateVariables,
    TemplateVariables,
    ManagementTemplateVariables,
    DocumentReminderVariables,
    LeaveStatus,
};
