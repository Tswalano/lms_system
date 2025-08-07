// prisma/seed.ts
import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Existing admin user IDs
    const existingAdmins = [
        '6f329acb-665f-4841-a1f2-22af84c4c374', // Glen Mogane
        '90f19835-c07c-4f3e-9b66-7f686bdde1ca', // Xolani Zulu 
        'ab5a63df-a985-486d-8d2b-5e814b03b3ce', // Hannes Swanepoel
    ];

    // 1. Create Existing Admin Users
    console.log('👤 Creating existing admin users...')
    // Add the 3 missing admin users
    const adminUsers = await Promise.all([
        prisma.users.upsert({
            where: { id: '6f329acb-665f-4841-a1f2-22af84c4c374' },
            update: {},
            create: {
                id: '6f329acb-665f-4841-a1f2-22af84c4c374',
                firstName: 'Glen',
                lastName: 'Mogane',
                email: 'glen.mogane@disraptor.co.za',
                role: 'admin',
                jobTitle: 'System Administrator',
                phoneNumber: '+27123456789',
                dob: new Date('1985-05-20'),
                gender: 'Male',
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
            },
        }),
        prisma.users.upsert({
            where: { id: '90f19835-c07c-4f3e-9b66-7f686bdde1ca' },
            update: {},
            create: {
                id: '90f19835-c07c-4f3e-9b66-7f686bdde1ca',
                firstName: 'Xolani',
                lastName: 'Zulu',
                email: 'xolani.zulu@disraptor.co.za',
                role: 'admin',
                jobTitle: 'Lead Developer',
                phoneNumber: '+27123456790',
                dob: new Date('1988-08-10'),
                gender: 'Male',
                createdAt: new Date('2025-02-10'),
                updatedAt: new Date('2025-02-10'),
            },
        }),
        prisma.users.upsert({
            where: { id: 'ab5a63df-a985-486d-8d2b-5e814b03b3ce' },
            update: {},
            create: {
                id: 'ab5a63df-a985-486d-8d2b-5e814b03b3ce',
                firstName: 'Hannes',
                lastName: 'Swanepoel',
                email: 'hannes.swanepoel@disraptor.co.za',
                role: 'admin',
                jobTitle: 'Product Manager',
                phoneNumber: '+27123456791',
                dob: new Date('1990-04-05'),
                gender: 'Male',
                createdAt: new Date('2025-03-05'),
                updatedAt: new Date('2025-03-05'),
            },
        }),
    ]);

    console.log(`✅ Created ${adminUsers.length} admin users.`);

    // 1. Create Additional Users (employees)
    console.log('👥 Creating additional users...');
    const newUserIds = [
        'e8b4c2d1-5f7a-4b9c-8e1d-3a6f9c2b5e8d',
        'f9c5d3e2-6a8b-5c0d-9f2e-4b7a0d3c6f9c',
        'a0d6e4f3-7b9c-6d1e-0a3f-5c8b1e4d7a0d',
        'b1e7f5a4-8c0d-7e2f-1b4a-6d9c2f5e8b1e',
        'c2f8a6b5-9d1e-8f3a-2c5b-7e0d3a6f9c2f',
        'd3a9b7c6-0e2f-9a4b-3d6c-8f1e4b7a0d3a',
        'e4b0c8d7-1f3a-0b5c-4e7d-9a2f5c8b1e4b',
        'f5c1d9e8-2a4b-1c6d-5f8e-0b3a6d9c2f5c',
    ];

    const users = await Promise.all([
        // Software Development Team
        prisma.users.upsert({
            where: { id: newUserIds[0] },
            update: {},
            create: {
                id: newUserIds[0],
                firstName: 'Sarah',
                lastName: 'Williams',
                email: 'sarah.williams@disraptor.co.za',
                role: 'user',
                jobTitle: 'Senior Frontend Developer',
                phoneNumber: '+27123456792',
                dob: new Date('1992-03-15'),
                gender: 'Female',
                createdAt: new Date('2025-07-01'),
                updatedAt: new Date('2025-07-01'),
            },
        }),
        prisma.users.upsert({
            where: { id: newUserIds[1] },
            update: {},
            create: {
                id: newUserIds[1],
                firstName: 'David',
                lastName: 'Johnson',
                email: 'david.johnson@disraptor.co.za',
                role: 'user',
                jobTitle: 'Backend Developer',
                phoneNumber: '+27123456793',
                dob: new Date('1989-07-22'),
                gender: 'Male',
                createdAt: new Date('2025-06-15'),
                updatedAt: new Date('2025-06-15'),
            },
        }),
        // Marketing Team
        prisma.users.upsert({
            where: { id: newUserIds[2] },
            update: {},
            create: {
                id: newUserIds[2],
                firstName: 'Emma',
                lastName: 'Davis',
                email: 'emma.davis@disraptor.co.za',
                role: 'user',
                jobTitle: 'Marketing Manager',
                phoneNumber: '+27123456794',
                dob: new Date('1987-11-08'),
                gender: 'Female',
                createdAt: new Date('2025-05-20'),
                updatedAt: new Date('2025-05-20'),
            },
        }),
        prisma.users.upsert({
            where: { id: newUserIds[3] },
            update: {},
            create: {
                id: newUserIds[3],
                firstName: 'James',
                lastName: 'Brown',
                email: 'james.brown@disraptor.co.za',
                role: 'user',
                jobTitle: 'Content Creator',
                phoneNumber: '+27123456795',
                dob: new Date('1994-01-30'),
                gender: 'Male',
                createdAt: new Date('2025-06-10'),
                updatedAt: new Date('2025-06-10'),
            },
        }),
        // Sales Team
        prisma.users.upsert({
            where: { id: newUserIds[4] },
            update: {},
            create: {
                id: newUserIds[4],
                firstName: 'Lisa',
                lastName: 'Miller',
                email: 'lisa.miller@disraptor.co.za',
                role: 'user',
                jobTitle: 'Sales Representative',
                phoneNumber: '+27123456796',
                dob: new Date('1991-09-12'),
                gender: 'Female',
                createdAt: new Date('2025-05-15'),
                updatedAt: new Date('2025-05-15'),
            },
        }),
        prisma.users.upsert({
            where: { id: newUserIds[5] },
            update: {},
            create: {
                id: newUserIds[5],
                firstName: 'Robert',
                lastName: 'Wilson',
                email: 'robert.wilson@disraptor.co.za',
                role: 'manager',
                jobTitle: 'Sales Manager',
                phoneNumber: '+27123456797',
                dob: new Date('1984-05-18'),
                gender: 'Male',
                createdAt: new Date('2025-06-01'),
                updatedAt: new Date('2025-06-01'),
            },
        }),
        // Operations Team
        prisma.users.upsert({
            where: { id: newUserIds[6] },
            update: {},
            create: {
                id: newUserIds[6],
                firstName: 'Jennifer',
                lastName: 'Garcia',
                email: 'jennifer.garcia@disraptor.co.za',
                role: 'user',
                jobTitle: 'Operations Coordinator',
                phoneNumber: '+27123456798',
                dob: new Date('1993-12-03'),
                gender: 'Female',
                createdAt: new Date('2025-04-15'),
                updatedAt: new Date('2025-04-15'),
            },
        }),
        // New Graduate
        prisma.users.upsert({
            where: { id: newUserIds[7] },
            update: {},
            create: {
                id: newUserIds[7],
                firstName: 'Alex',
                lastName: 'Thompson',
                email: 'alex.thompson@disraptor.co.za',
                role: 'user',
                jobTitle: 'Junior Developer',
                phoneNumber: '+27123456799',
                dob: new Date('1999-04-25'),
                gender: 'Non-binary',
                createdAt: new Date('2025-08-01'),
                updatedAt: new Date('2025-08-01'),
            },
        }),
    ]);

    console.log(`✅ Created ${users.length} additional users`);

    // 2. Create Document Categories
    console.log('📁 Creating document categories...');
    const categories = await Promise.all([
        prisma.document_categories.upsert({
            where: { id: 'policies' },
            update: {},
            create: {
                id: 'policies',
                name: 'Company Policies',
                description: 'Official company policies and procedures',
                color: 'bg-blue-500',
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-15'),
            },
        }),
        prisma.document_categories.upsert({
            where: { id: 'contracts' },
            update: {},
            create: {
                id: 'contracts',
                name: 'Employment Documents',
                description: 'Employment contracts and agreements',
                color: 'bg-green-500',
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-15'),
            },
        }),
        prisma.document_categories.upsert({
            where: { id: 'training' },
            update: {},
            create: {
                id: 'training',
                name: 'Training Materials',
                description: 'Training guides and educational content',
                color: 'bg-purple-500',
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-15'),
            },
        }),
        prisma.document_categories.upsert({
            where: { id: 'benefits' },
            update: {},
            create: {
                id: 'benefits',
                name: 'Benefits & HR',
                description: 'Benefits information and HR documents',
                color: 'bg-orange-500',
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-15'),
            },
        }),
    ]);

    console.log(`✅ Created ${categories.length} document categories`);

    // 3. Create Documents (created by existing admins)
    console.log('📄 Creating documents...');
    const documents = [
        {
            name: 'Whistleblowing Policy v2.1',
            category_id: 'policies',
            file_url: 'https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/Disraptor_Whistleblowing_Policy_final.docx',
            file_size: '245 KB',
            content: 'This policy outlines the procedures for reporting workplace misconduct and ensures protection for whistleblowers.',
            priority: 'high' as const,
            created_by: existingAdmins[0], // Glen Mogane
        },
        {
            name: 'Employment Contract Template',
            category_id: 'contracts',
            file_url: 'https://pdfobject.com/pdf/sample.pdf',
            file_size: '892 KB',
            content: 'Standard employment contract template outlining terms of employment, compensation, and benefits.',
            priority: 'high' as const,
            created_by: existingAdmins[1], // Admin 2
        },
        {
            name: 'Ethics and Anti-Corruption Policy',
            category_id: 'policies',
            file_url: 'https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/cli_admin_user_accessKeys.csv',
            file_size: '428 KB',
            content: 'Company code of conduct and ethical guidelines covering professional behavior and compliance.',
            priority: 'high' as const,
            created_by: existingAdmins[0], // Glen Mogane
        },
        {
            name: 'Safety Guidelines',
            category_id: 'training',
            file_url: 'https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/DR_Staff+Training_2025.pptx',
            file_size: '156 KB',
            content: 'Comprehensive workplace safety guidelines covering emergency procedures and hazard identification.',
            priority: 'medium' as const,
            created_by: existingAdmins[2], // Admin 3
        },
        {
            name: 'Benefits Handbook 2025',
            category_id: 'benefits',
            file_url: 'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf',
            file_size: '1.2 MB',
            content: 'Complete guide to employee benefits including health insurance and retirement plans.',
            priority: 'medium' as const,
            created_by: existingAdmins[1], // Admin 2
        },
        {
            name: 'Data Protection Training',
            category_id: 'training',
            file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            file_size: '320 KB',
            content: 'Essential training on data protection regulations and GDPR compliance.',
            priority: 'high' as const,
            created_by: existingAdmins[0], // Glen Mogane
        },
        {
            name: 'Remote Work Policy',
            category_id: 'policies',
            file_url: '/sample-document.pdf',
            file_size: '180 KB',
            content: 'Guidelines for remote work arrangements and performance standards.',
            priority: 'medium' as const,
            created_by: existingAdmins[2], // Admin 3
        },
        {
            name: 'Software Development Standards',
            category_id: 'training',
            file_url: '/dev-standards.pdf',
            file_size: '650 KB',
            content: 'Coding standards, best practices, and development guidelines for engineering team.',
            priority: 'high' as const,
            created_by: existingAdmins[0], // Glen Mogane (assuming he's tech lead)
        },
        {
            name: 'Sales Process Manual',
            category_id: 'training',
            file_url: '/sales-manual.pdf',
            file_size: '890 KB',
            content: 'Complete sales process documentation including lead qualification and closing techniques.',
            priority: 'high' as const,
            created_by: existingAdmins[1], // Admin 2
        },
        {
            name: 'Marketing Guidelines',
            category_id: 'policies',
            file_url: '/marketing-guidelines.pdf',
            file_size: '430 KB',
            content: 'Brand guidelines, content standards, and marketing approval processes.',
            priority: 'medium' as const,
            created_by: existingAdmins[2], // Admin 3
        },
    ];

    const createdDocuments = await Promise.all(
        documents.map((doc) =>
            prisma.documents.create({
                data: doc,
            })
        )
    );

    console.log(`✅ Created ${createdDocuments.length} documents`);

    // 4. Create Document Training Metadata
    console.log('🎓 Creating document training metadata...');
    const trainingMetadata = await Promise.all([
        // Mandatory company-wide documents
        prisma.document_training_metadata.create({
            data: {
                document_id: createdDocuments[0].id, // Whistleblowing Policy
                version: 'v2.1',
                renewal_frequency: 365, // Annual
                expiry_date: new Date('2025-07-30'),
                is_mandatory: true,
                auto_assign_new_users: true,
            },
        }),
        prisma.document_training_metadata.create({
            data: {
                document_id: createdDocuments[2].id, // Ethics Policy
                version: 'v1.0',
                renewal_frequency: 365, // Annual
                expiry_date: new Date('2025-08-25'),
                is_mandatory: true,
                auto_assign_new_users: true,
            },
        }),
        prisma.document_training_metadata.create({
            data: {
                document_id: createdDocuments[3].id, // Safety Guidelines
                version: 'v1.2',
                renewal_frequency: 180, // Bi-annual
                expiry_date: new Date('2025-02-20'),
                is_mandatory: true,
                auto_assign_new_users: true,
            },
        }),
        prisma.document_training_metadata.create({
            data: {
                document_id: createdDocuments[5].id, // Data Protection Training
                version: 'v2.0',
                renewal_frequency: 365, // Annual
                expiry_date: new Date('2025-09-22'),
                is_mandatory: true,
                auto_assign_new_users: true,
            },
        }),
        // Role-specific training
        prisma.document_training_metadata.create({
            data: {
                document_id: createdDocuments[7].id, // Software Development Standards
                version: 'v3.1',
                renewal_frequency: 180, // Bi-annual for tech team
                expiry_date: new Date('2025-03-15'),
                is_mandatory: false,
                auto_assign_new_users: false,
            },
        }),
        prisma.document_training_metadata.create({
            data: {
                document_id: createdDocuments[8].id, // Sales Process Manual
                version: 'v2.3',
                renewal_frequency: 90, // Quarterly for sales team
                expiry_date: new Date('2025-11-15'),
                is_mandatory: false,
                auto_assign_new_users: false,
            },
        }),
    ]);

    console.log(`✅ Created ${trainingMetadata.length} training metadata records`);

    // 5. Create Document Assignments
    console.log('📋 Creating document assignments...');
    const assignments = [];

    // Assign mandatory documents to all new users
    const mandatoryDocIds = [
        createdDocuments[0].id, // Whistleblowing Policy
        createdDocuments[2].id, // Ethics Policy
        createdDocuments[3].id, // Safety Guidelines
        createdDocuments[5].id, // Data Protection Training
    ];

    // Assign mandatory documents to all new users
    for (const userId of newUserIds) {
        for (const docId of mandatoryDocIds) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

            assignments.push({
                user_id: userId,
                document_id: docId,
                status: Math.random() > 0.7 ? 'pending' : (Math.random() > 0.5 ? 'viewed' : 'signed') as any,
                due_date: dueDate,
                assigned_at: new Date(),
                completed_at: Math.random() > 0.6 ? new Date() : null,
            });
        }
    }

    // Assign employment contracts to all new users
    for (const userId of newUserIds) {
        assignments.push({
            user_id: userId,
            document_id: createdDocuments[1].id, // Employment Contract
            status: 'signed' as const,
            due_date: new Date('2025-11-01'),
            assigned_at: new Date('2025-10-15'),
            completed_at: new Date('2025-10-25'),
        });
    }

    // Assign benefits handbook to all
    for (const userId of newUserIds) {
        const status = Math.random() > 0.3 ? 'viewed' : 'overdue';
        assignments.push({
            user_id: userId,
            document_id: createdDocuments[4].id, // Benefits Handbook
            status: status as any,
            due_date: new Date('2025-11-15'),
            assigned_at: new Date('2025-10-20'),
            completed_at: status === 'viewed' ? new Date('2025-11-10') : null,
        });
    }

    // Role-specific assignments
    // Software Development Standards - assign to developers
    const devUsers = [newUserIds[0], newUserIds[1], newUserIds[7]]; // Sarah, David, Alex
    for (const userId of devUsers) {
        assignments.push({
            user_id: userId,
            document_id: createdDocuments[7].id, // Software Development Standards
            status: Math.random() > 0.5 ? 'signed' : 'viewed' as any,
            due_date: new Date('2025-12-01'),
            assigned_at: new Date('2025-11-01'),
            completed_at: new Date('2025-11-15'),
        });
    }

    // Sales Process Manual - assign to sales team
    const salesUsers = [newUserIds[4], newUserIds[5]]; // Lisa, Robert
    for (const userId of salesUsers) {
        assignments.push({
            user_id: userId,
            document_id: createdDocuments[8].id, // Sales Process Manual
            status: 'signed' as const,
            due_date: new Date('2025-11-20'),
            assigned_at: new Date('2025-11-05'),
            completed_at: new Date('2025-11-18'),
        });
    }

    // Marketing Guidelines - assign to marketing team
    const marketingUsers = [newUserIds[2], newUserIds[3]]; // Emma, James
    for (const userId of marketingUsers) {
        assignments.push({
            user_id: userId,
            document_id: createdDocuments[9].id, // Marketing Guidelines
            status: Math.random() > 0.5 ? 'signed' : 'pending' as any,
            due_date: new Date('2025-12-05'),
            assigned_at: new Date('2025-11-10'),
            completed_at: Math.random() > 0.5 ? new Date('2025-11-20') : null,
        });
    }

    const createdAssignments = await Promise.all(
        assignments.map((assignment) =>
            prisma.user_document_assignments.create({
                data: assignment,
            })
        )
    );

    console.log(`✅ Created ${createdAssignments.length} document assignments`);

    // 6. Create Document Signatures
    console.log('✍️ Creating document signatures...');
    const signatures = [];

    // Create signatures for completed assignments
    const completedAssignments = createdAssignments.filter(a => a.status === 'signed');
    for (const assignment of completedAssignments.slice(0, 15)) { // Limit to avoid too many
        signatures.push({
            user_id: assignment.user_id,
            document_id: assignment.document_id,
            signed_at: assignment.completed_at || new Date(),
            ip_address: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        });
    }

    const createdSignatures = await Promise.all(
        signatures.map((sig) =>
            prisma.document_signatures.create({
                data: sig,
            })
        )
    );

    console.log(`✅ Created ${createdSignatures.length} document signatures`);

    // 7. Create Document Views
    console.log('👁️ Creating document views...');
    const views = [];

    // Create multiple views for different users and documents
    for (let i = 0; i < 20; i++) {
        const randomUserId = newUserIds[Math.floor(Math.random() * newUserIds.length)];
        const randomDocId = createdDocuments[Math.floor(Math.random() * createdDocuments.length)].id;
        const viewDate = new Date();
        viewDate.setDate(viewDate.getDate() - Math.floor(Math.random() * 30));

        views.push({
            user_id: randomUserId,
            document_id: randomDocId,
            viewed_at: viewDate,
            ip_address: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
            duration: Math.floor(Math.random() * 900) + 60, // 1-15 minutes
            progress_data: JSON.stringify({
                page: Math.floor(Math.random() * 20) + 1,
                scrollPosition: Math.floor(Math.random() * 100)
            }),
        });
    }

    const createdViews = await Promise.all(
        views.map((view) =>
            prisma.document_views.create({
                data: view,
            })
        )
    );

    console.log(`✅ Created ${createdViews.length} document views`);

    // 8. Create Leave Requests (by new employees, approved by existing admins)
    console.log('🏖️ Creating leave requests...');
    const leaveRequests = await Promise.all([
        // July leave requests - Approved
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[0], // Sarah Williams
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: 3,
                start_date: new Date('2025-07-22'),
                end_date: new Date('2025-07-24'),
                leave_length: 'full_day',
                leave_comment: 'Family vacation during summer',
                approved_by: existingAdmins[0], // Glen Mogane
                approved_at: new Date('2025-07-18'),
                createdAt: new Date('2025-07-15'),
                updatedAt: new Date('2025-07-18'),
            },
        }),
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[1], // David Johnson
                leave_type: 'Sick Leave',
                status: 'approved',
                duration: 2,
                start_date: new Date('2025-07-08'),
                end_date: new Date('2025-07-09'),
                leave_length: 'full_day',
                leave_comment: 'Medical appointment and recovery',
                approved_by: existingAdmins[1], // Admin 2
                approved_at: new Date('2025-07-05'),
                createdAt: new Date('2025-07-04'),
                updatedAt: new Date('2025-07-05'),
            },
        }),
        // August leave requests - Mixed statuses
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[2], // Emma Davis
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: 5,
                start_date: new Date('2025-08-12'),
                end_date: new Date('2025-08-16'),
                leave_length: 'full_day',
                leave_comment: 'Summer holiday break',
                approved_by: existingAdmins[2], // Admin 3
                approved_at: new Date('2025-08-08'),
                createdAt: new Date('2025-08-05'),
                updatedAt: new Date('2025-08-08'),
            },
        }),
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[3], // James Brown
                leave_type: 'Personal Leave',
                status: 'rejected',
                duration: 1,
                start_date: new Date('2025-08-20'),
                end_date: new Date('2025-08-20'),
                leave_length: 'half_day',
                leave_comment: 'Personal appointment',
                feedback: 'Request denied due to project deadline conflicts',
                approved_by: existingAdmins[0], // Glen Mogane
                approved_at: new Date('2025-08-18'),
                createdAt: new Date('2025-08-17'),
                updatedAt: new Date('2025-08-18'),
            },
        }),
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[4], // Lisa Miller
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: 7,
                start_date: new Date('2025-08-26'),
                end_date: new Date('2025-09-01'),
                leave_length: 'full_day',
                leave_comment: 'Extended weekend getaway',
                approved_by: existingAdmins[1], // Admin 2
                approved_at: new Date('2025-08-22'),
                createdAt: new Date('2025-08-19'),
                updatedAt: new Date('2025-08-22'),
            },
        }),
        // September leave requests - Mix of approved and pending
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[5], // Robert Wilson (Sales Manager)
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: 4,
                start_date: new Date('2025-09-09'),
                end_date: new Date('2025-09-12'),
                leave_length: 'full_day',
                leave_comment: 'Long weekend with family',
                approved_by: existingAdmins[2], // Admin 3
                approved_at: new Date('2025-09-06'),
                createdAt: new Date('2025-09-03'),
                updatedAt: new Date('2025-09-06'),
            },
        }),
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[6], // Jennifer Garcia
                leave_type: 'Sick Leave',
                status: 'approved',
                duration: 1,
                start_date: new Date('2025-09-16'),
                end_date: new Date('2025-09-16'),
                leave_length: 'full_day',
                leave_comment: 'Doctor appointment',
                approved_by: existingAdmins[0], // Glen Mogane
                approved_at: new Date('2025-09-15'),
                createdAt: new Date('2025-09-14'),
                updatedAt: new Date('2025-09-15'),
            },
        }),
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[7], // Alex Thompson (Junior Developer)
                leave_type: 'Study Leave',
                status: 'pending',
                duration: 2,
                start_date: new Date('2025-09-23'),
                end_date: new Date('2025-09-24'),
                leave_length: 'full_day',
                leave_comment: 'Attending technical certification exam',
                createdAt: new Date('2025-09-20'),
                updatedAt: new Date('2025-09-20'),
            },
        }),
        // Additional September requests
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[0], // Sarah Williams - Second request
                leave_type: 'Personal Leave',
                status: 'pending',
                duration: 1,
                start_date: new Date('2025-09-27'),
                end_date: new Date('2025-09-27'),
                leave_length: 'half_day',
                leave_comment: 'Moving apartment - afternoon off',
                createdAt: new Date('2025-09-25'),
                updatedAt: new Date('2025-09-25'),
            },
        }),
        prisma.leave_requests.create({
            data: {
                uid: newUserIds[3], // James Brown - Another request after rejection
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: 3,
                start_date: new Date('2025-09-30'),
                end_date: new Date('2025-10-02'),
                leave_length: 'full_day',
                leave_comment: 'End of month break',
                approved_by: existingAdmins[1], // Admin 2
                approved_at: new Date('2025-09-27'),
                createdAt: new Date('2025-09-25'),
                updatedAt: new Date('2025-09-27'),
            },
        }),
    ]);
    console.log(`✅ Created ${leaveRequests.length} leave requests`);

    // 9. Create Leave Action Logs
    console.log('📝 Creating leave action logs...');
    const actionLogs = [];

    // Create action logs for approved and rejected leave requests
    const processedLeaves = leaveRequests.filter(lr => lr.status === 'approved' || lr.status === 'rejected');
    for (const leave of processedLeaves) {
        actionLogs.push({
            leave_id: leave.id,
            manager_id: leave.approved_by,
            action: leave.status === 'approved' ? 'approved' : 'rejected',
            previous_status: 'pending',
            new_status: leave.status,
            timestamp: leave.approved_at,
        });
    }

    const createdActionLogs = await Promise.all(
        actionLogs.map((log) =>
            prisma.leave_action_log.create({
                data: log,
            })
        )
    );

    console.log(`✅ Created ${createdActionLogs.length} leave action logs`);

    // 10. Create Invitations (sent by existing admins)
    console.log('📧 Creating invitations...');
    const invitations = await Promise.all([
        prisma.invitations.create({
            data: {
                firstname: 'Tom',
                surname: 'Anderson',
                email: 'tom.anderson@disraptor.co.za',
                status: 'pending',
                admin_id: existingAdmins[0], // Glen Mogane
                createdAt: new Date('2025-08-20'),
                updatedAt: new Date('2025-08-20'),
            },
        }),
        prisma.invitations.create({
            data: {
                firstname: 'Maria',
                surname: 'Rodriguez',
                email: 'maria.rodriguez@disraptor.co.za',
                status: 'accepted',
                admin_id: existingAdmins[1], // Admin 2
                createdAt: new Date('2025-07-15'),
                updatedAt: new Date('2025-07-22'),
            },
        }),
        prisma.invitations.create({
            data: {
                firstname: 'Kevin',
                surname: 'Lee',
                email: 'kevin.lee@disraptor.co.za',
                status: 'pending',
                admin_id: existingAdmins[2], // Admin 3
                createdAt: new Date('2025-09-18'),
                updatedAt: new Date('2025-09-18'),
            },
        }),
        prisma.invitations.create({
            data: {
                firstname: 'Sophie',
                surname: 'Taylor',
                email: 'sophie.taylor@disraptor.co.za',
                status: 'expired',
                admin_id: existingAdmins[0], // Glen Mogane
                createdAt: new Date('2025-06-15'),
                updatedAt: new Date('2025-07-15'),
            },
        }),
    ]);

    console.log(`✅ Created ${invitations.length} invitations`);

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Summary:
- Additional Users: ${users.length}
- Document Categories: ${categories.length}  
- Documents: ${createdDocuments.length}
- Training Metadata: ${trainingMetadata.length}
- Document Assignments: ${createdAssignments.length}
- Document Signatures: ${createdSignatures.length}
- Document Views: ${createdViews.length}
- Leave Requests: ${leaveRequests.length}
- Leave Action Logs: ${createdActionLogs.length}
- Invitations: ${invitations.length}

🔗 Data is linked to existing admins:
- Glen Mogane (${existingAdmins[0]}) - Created policies, approved leaves, sent invitations
- Admin 2 (${existingAdmins[1]}) - Created contracts & benefits, approved leaves, sent invitations
- Admin 3 (${existingAdmins[2]}) - Created training materials, approved leaves, sent invitations

👥 New Users Created:
- Sarah Williams - Senior Frontend Developer
- David Johnson - Backend Developer  
- Emma Davis - Marketing Manager
- James Brown - Content Creator
- Lisa Miller - Sales Representative
- Robert Wilson - Sales Manager
- Jennifer Garcia - Operations Coordinator
- Alex Thompson - Junior Developer

📅 2025 Leave Requests Summary:
July: 2 requests (both approved)
August: 3 requests (2 approved, 1 rejected) 
September: 5 requests (4 approved, 1 pending)

📋 Realistic Data Relationships:
- All new users have employment contracts signed in June 2025
- Mandatory training assigned with August 2025 deadlines
- Role-specific documents assigned to relevant teams
- Leave requests spanning July-September with proper approval workflows
- Document views and signatures tracking user engagement from summer 2025
- Invitation history showing admin activity throughout 2025
  `);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });