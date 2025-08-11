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
        '36e69224-62d0-46d4-87fc-3874670f71e7', // Philemon Maitisa
    ];

    // All user IDs (admins + new users) for document assignments
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

    // Combine all user IDs for complete testing data
    const allUserIds = [...existingAdmins, ...newUserIds];

    // 1. Create Existing Admin Users
    console.log('👤 Creating cognito admin users...')
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
            where: { id: '36e69224-62d0-46d4-87fc-3874670f71e7' },
            update: {},
            create: {
                id: '36e69224-62d0-46d4-87fc-3874670f71e7',
                firstName: 'Philemon',
                lastName: 'Maitisa',
                email: 'philemon.maitisa@disraptor.co.za',
                role: 'admin',
                jobTitle: 'Software Engineer',
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
                role: 'user',
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

    // 5. Create Document Assignments (now including admin users)
    console.log('📋 Creating document assignments...');
    const assignments = [];

    // Assign mandatory documents to ALL users (admins + regular users)
    const mandatoryDocIds = [
        createdDocuments[0].id, // Whistleblowing Policy
        createdDocuments[2].id, // Ethics Policy
        createdDocuments[3].id, // Safety Guidelines
        createdDocuments[5].id, // Data Protection Training
    ];

    // Assign mandatory documents to ALL users
    for (const userId of allUserIds) {
        for (const docId of mandatoryDocIds) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

            // Admins generally have better compliance rates
            const isAdmin = existingAdmins.includes(userId);
            const randomValue = Math.random();
            let status;

            if (isAdmin) {
                status = randomValue > 0.8 ? 'pending' : (randomValue > 0.3 ? 'signed' : 'viewed');
            } else {
                status = randomValue > 0.7 ? 'pending' : (randomValue > 0.5 ? 'viewed' : 'signed');
            }

            assignments.push({
                user_id: userId,
                document_id: docId,
                status: status as any,
                due_date: dueDate,
                assigned_at: new Date(),
                completed_at: status !== 'pending' ? new Date() : null,
            });
        }
    }

    // Assign employment contracts to all users
    for (const userId of allUserIds) {
        assignments.push({
            user_id: userId,
            document_id: createdDocuments[1].id, // Employment Contract
            status: 'signed' as const,
            due_date: new Date('2025-11-01'),
            assigned_at: new Date('2025-10-15'),
            completed_at: new Date('2025-10-25'),
        });
    }

    // Assign benefits handbook to all users
    for (const userId of allUserIds) {
        const isAdmin = existingAdmins.includes(userId);
        const status = Math.random() > (isAdmin ? 0.2 : 0.3) ? 'viewed' : 'overdue';
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
    // Software Development Standards - assign to developers (including admin developers)
    const devUsers = [
        newUserIds[0], newUserIds[1], newUserIds[7], // Sarah, David, Alex
        existingAdmins[0], existingAdmins[1], existingAdmins[3] // Glen, Xolani, Philemon (tech admins)
    ];
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

    // Marketing Guidelines - assign to marketing team + product manager admin
    const marketingUsers = [
        newUserIds[2], newUserIds[3], // Emma, James
        existingAdmins[2] // Hannes (Product Manager)
    ];
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
    for (const assignment of completedAssignments.slice(0, 25)) { // Increased to accommodate more signatures
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

    // Create multiple views for different users and documents (including admins)
    for (let i = 0; i < 30; i++) { // Increased to accommodate more users
        const randomUserId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
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

    // 8. Create Leave Requests (by all users, including admins, approved by existing admins)
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
        // Admin leave requests - they also need time off!
        prisma.leave_requests.create({
            data: {
                uid: existingAdmins[2], // Hannes Swanepoel
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: 5,
                start_date: new Date('2025-07-29'),
                end_date: new Date('2025-08-02'),
                leave_length: 'full_day',
                leave_comment: 'Annual family holiday to Cape Town',
                approved_by: existingAdmins[0], // Glen Mogane
                approved_at: new Date('2025-07-25'),
                createdAt: new Date('2025-07-20'),
                updatedAt: new Date('2025-07-25'),
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
        // Admin requesting leave from another admin
        prisma.leave_requests.create({
            data: {
                uid: existingAdmins[3], // Philemon Maitisa
                leave_type: 'Study Leave',
                status: 'approved',
                duration: 2,
                start_date: new Date('2025-08-28'),
                end_date: new Date('2025-08-29'),
                leave_length: 'full_day',
                leave_comment: 'Attending AWS certification training',
                approved_by: existingAdmins[0], // Glen Mogane
                approved_at: new Date('2025-08-25'),
                createdAt: new Date('2025-08-22'),
                updatedAt: new Date('2025-08-25'),
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
        // Admin leave request pending approval
        prisma.leave_requests.create({
            data: {
                uid: existingAdmins[1], // Xolani Zulu
                leave_type: 'Annual Leave',
                status: 'pending',
                duration: 3,
                start_date: new Date('2025-09-25'),
                end_date: new Date('2025-09-27'),
                leave_length: 'full_day',
                leave_comment: 'Heritage Day long weekend',
                createdAt: new Date('2025-09-22'),
                updatedAt: new Date('2025-09-22'),
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
        // Another admin leave request
        prisma.leave_requests.create({
            data: {
                uid: existingAdmins[0], // Glen Mogane
                leave_type: 'Personal Leave',
                status: 'approved',
                duration: 1,
                start_date: new Date('2025-10-01'),
                end_date: new Date('2025-10-01'),
                leave_length: 'full_day',
                leave_comment: 'Personal family matter',
                approved_by: existingAdmins[2], // Hannes Swanepoel
                approved_at: new Date('2025-09-28'),
                createdAt: new Date('2025-09-26'),
                updatedAt: new Date('2025-09-28'),
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

    // 10. Create departments with numeric IDs
    console.log('🏢 Creating departments...');

    // Check if departments already exist and create only if they don't
    const departmentData = [
        {
            name: 'Engineering',
            description: 'Responsible for software development and technical operations',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
        {
            name: 'Marketing',
            description: 'Handles marketing strategies and brand management',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
        {
            name: 'Sales',
            description: 'Responsible for sales strategies and customer relationships',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
        {
            name: 'Operations',
            description: 'Oversees daily operations and administrative tasks',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
    ];

    const departments = [];
    for (const dept of departmentData) {
        // Check if department exists
        const existing = await prisma.departments.findFirst({
            where: { name: dept.name }
        });

        if (existing) {
            departments.push(existing);
        } else {
            const created = await prisma.departments.create({
                data: dept
            });
            departments.push(created);
        }
    }
    console.log(`✅ Created ${departments.length} departments`);

    // 11. Document-departments assignments
    console.log('📂 Assigning documents to departments...');

    // Check and create document-department assignments to avoid duplicates
    const docDeptData = [
        { document_id: createdDocuments[7].id, department_id: departments[0].id }, // Software Development Standards -> Engineering
        { document_id: createdDocuments[9].id, department_id: departments[1].id }, // Marketing Guidelines -> Marketing
        { document_id: createdDocuments[8].id, department_id: departments[2].id }, // Sales Process Manual -> Sales
        { document_id: createdDocuments[4].id, department_id: departments[3].id }, // Benefits Handbook -> Operations
        { document_id: createdDocuments[0].id, department_id: departments[3].id }, // Whistleblowing Policy -> Operations
        { document_id: createdDocuments[2].id, department_id: departments[3].id }, // Ethics Policy -> Operations
    ];

    const documentDepartments = [];
    for (const docDept of docDeptData) {
        // Check if assignment already exists
        const existing = await prisma.document_departments.findFirst({
            where: {
                document_id: docDept.document_id,
                department_id: docDept.department_id
            }
        });

        if (!existing) {
            const created = await prisma.document_departments.create({
                data: docDept
            });
            documentDepartments.push(created);
        } else {
            documentDepartments.push(existing);
        }
    }
    console.log(`✅ Created ${documentDepartments.length} document department assignments`);

    // 12. User department assignments
    console.log('👥 Assigning users to departments...');

    // Check and create user-department assignments to avoid duplicates
    const userDeptData = [
        { user_id: newUserIds[0], department_id: departments[0].id }, // Sarah Williams -> Engineering
        { user_id: newUserIds[1], department_id: departments[0].id }, // David Johnson -> Engineering
        { user_id: existingAdmins[3], department_id: departments[0].id }, // Philemon Maitisa -> Engineering
        { user_id: newUserIds[2], department_id: departments[1].id }, // Emma Davis -> Marketing
        { user_id: existingAdmins[2], department_id: departments[0].id }, // Hannes Swanepoel -> Engineering
        { user_id: existingAdmins[0], department_id: departments[0].id }, // Glen Mogane -> Engineering
        { user_id: newUserIds[4], department_id: departments[2].id }, // Lisa Miller -> Sales
        { user_id: newUserIds[5], department_id: departments[2].id }, // Robert Wilson -> Sales
        { user_id: newUserIds[6], department_id: departments[3].id }, // Jennifer Garcia -> Operations
        { user_id: newUserIds[7], department_id: departments[0].id }, // Alex Thompson -> Engineering
    ];

    const userDepartments = [];
    for (const userDept of userDeptData) {
        // Check if assignment already exists
        const existing = await prisma.user_departments.findFirst({
            where: {
                user_id: userDept.user_id,
                department_id: userDept.department_id
            }
        });

        if (!existing) {
            const created = await prisma.user_departments.create({
                data: userDept
            });
            userDepartments.push(created);
        } else {
            userDepartments.push(existing);
        }
    }
    console.log(`✅ Created ${userDepartments.length} user department assignments`);

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Summary:
- Admin Users: ${adminUsers.length}
- Additional Users: ${users.length}
- Total Users with Data: ${allUserIds.length}
- Document Categories: ${categories.length}  
- Documents: ${createdDocuments.length}
- Training Metadata: ${trainingMetadata.length}
- Document Assignments: ${createdAssignments.length}
- Document Signatures: ${createdSignatures.length}
- Document Views: ${createdViews.length}
- Leave Requests: ${leaveRequests.length}
- Leave Action Logs: ${createdActionLogs.length}
- Departments: ${departments.length}
- Document Department Assignments: ${documentDepartments.length}
- User Department Assignments: ${userDepartments.length}

🔗 Data is linked to existing admins:
- Glen Mogane (${existingAdmins[0]}) - Created policies, approved leaves
- Xolani Zulu (${existingAdmins[1]}) - Created contracts & benefits, approved leaves
- Hannes Swanepoel (${existingAdmins[2]}) - Created training materials, approved leaves
- Philemon Maitisa (${existingAdmins[3]}) - Software Engineer admin

👥 All Users Now Have Testing Data:
Admins:
- Glen Mogane - System Administrator
- Xolani Zulu - Lead Developer
- Hannes Swanepoel - Product Manager  
- Philemon Maitisa - Software Engineer

Regular Users:
- Sarah Williams - Senior Frontend Developer
- David Johnson - Backend Developer  
- Emma Davis - Marketing Manager
- James Brown - Content Creator
- Lisa Miller - Sales Representative
- Robert Wilson - Sales Manager
- Jennifer Garcia - Operations Coordinator
- Alex Thompson - Junior Developer

📅 2025 Leave Requests Summary (Including Admins):
July: 3 requests (all approved)
August: 4 requests (3 approved, 1 rejected) 
September: 6 requests (4 approved, 2 pending)

📋 Document Assignment Coverage:
- Mandatory documents assigned to ALL users (admins + regular users)
- Role-specific documents assigned based on job functions
- Admin users have realistic compliance rates and document interactions
- Employment contracts signed by everyone
- Benefits handbook with mixed completion status across all users

📈 Realistic Testing Scenarios:
- Admin users can test document management from both creator and assignee perspectives
- Leave requests include admin-to-admin approval workflows
- Document views and signatures distributed across all user types
- Mixed completion statuses provide realistic testing conditions
- Role-based document assignments include relevant admins (e.g., tech admins get dev standards)
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