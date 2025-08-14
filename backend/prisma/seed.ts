// prisma/seed.ts
import { manager_feedback_type, PrismaClient } from '../lib/generated/prisma';

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
                feedback: 'Enjoy your time off!',
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
                feedback: 'Get well soon!',
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
                feedback: 'Enjoy your break! Take lots of pictures!',
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
                feedback: 'Have a great time!',
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
                feedback: 'Enjoy your extended break!',
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
                feedback: 'Good luck with your studies!',
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
                feedback: 'Enjoy your time off!',
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
                feedback: 'Wishing you a speedy recovery!',
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
                feedback: 'Awaiting approval from manager',
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
                feedback: 'Awaiting approval from Glen Mogane',
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
                feedback: 'Approved after project completion',
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
                feedback: 'Approved by Hannes Swanepoel',
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

    // 13. Update existing admin users with performance review fields
    console.log('🎯 Updating admin users with performance review data...');

    const adminUpdates = await Promise.all([
        prisma.users.update({
            where: { id: existingAdmins[0] }, // Glen Mogane
            data: {
                employeeId: 'EMP001',
                departmentId: departments[0].id, // Engineering
                managerId: null, // CEO/Founder - no manager
                roleType: 'admin',
                jobLevel: 'Executive',
                isActive: true,
            },
        }),
        prisma.users.update({
            where: { id: existingAdmins[1] }, // Xolani Zulu
            data: {
                employeeId: 'EMP002',
                departmentId: departments[0].id, // Engineering
                managerId: existingAdmins[0], // Reports to Glen
                roleType: 'engineer',
                jobLevel: 'Lead',
                isActive: true,
            },
        }),
        prisma.users.update({
            where: { id: existingAdmins[2] }, // Hannes Swanepoel
            data: {
                employeeId: 'EMP003',
                departmentId: departments[1].id, // Marketing (Product Manager)
                managerId: existingAdmins[0], // Reports to Glen
                roleType: 'product_manager',
                jobLevel: 'Senior',
                isActive: true,
            },
        }),
        prisma.users.update({
            where: { id: existingAdmins[3] }, // Philemon Maitisa
            data: {
                employeeId: 'EMP004',
                departmentId: departments[0].id, // Engineering
                managerId: existingAdmins[1], // Reports to Xolani
                roleType: 'engineer',
                jobLevel: 'Senior',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Updated ${adminUpdates.length} admin users with performance review data`);

    // 14. Create review questions (matching your component structure)
    console.log('❓ Creating performance review questions...');

    const selfQuestions = [
        {
            category: 'DevOps Technical Skills',
            questionText: 'What was your most impactful DevOps automation or infrastructure contribution this period?',
            phase: 'self',
        },
        {
            category: 'DevOps Leadership',
            questionText: 'Describe a DevOps project where you led the implementation or migration.',
            phase: 'self',
        },
        {
            category: 'Cloud Expertise',
            questionText: 'How would you rate your proficiency in AWS services? Provide specific examples of services you\'ve implemented.',
            phase: 'self',
        },
        {
            category: 'Infrastructure as Code',
            questionText: 'Describe your experience with Terraform, CloudFormation, or other IaC tools. What complex infrastructure have you automated?',
            phase: 'self',
        },
        {
            category: 'CI/CD Pipeline Design',
            questionText: 'What CI/CD pipelines have you designed or improved? What tools and best practices did you implement?',
            phase: 'self',
        },
        {
            category: 'Containerization',
            questionText: 'Describe your experience with Docker and Kubernetes. What container orchestration challenges have you solved?',
            phase: 'self',
        },
        {
            category: 'Monitoring & Observability',
            questionText: 'How do you implement monitoring, logging, and alerting? What tools do you use and why?',
            phase: 'self',
        },
        {
            category: 'Security & Compliance',
            questionText: 'How do you integrate security into DevOps processes? Describe your DevSecOps practices.',
            phase: 'self',
        },
        {
            category: 'Innovation & Future Goals',
            questionText: 'What DevOps innovations would you like to implement? What are your goals for the next quarter?',
            phase: 'self',
        },
        {
            category: 'Communication & Stakeholders',
            questionText: 'How do you communicate technical DevOps concepts to non-technical stakeholders and leadership?',
            phase: 'self',
        },
    ];

    const peerQuestions = [
        {
            category: 'DevOps Delivery',
            questionText: 'Rate: Delivers DevOps solutions on time with high quality and reliability.',
            phase: 'peer',
        },
        {
            category: 'AWS Expertise',
            questionText: 'Rate: Demonstrates deep proficiency in AWS services and cloud architecture.',
            phase: 'peer',
        },
        {
            category: 'Infrastructure as Code',
            questionText: 'Rate: Effectively designs and implements Infrastructure as Code using Terraform/CloudFormation.',
            phase: 'peer',
        },
        {
            category: 'CI/CD Pipeline Management',
            questionText: 'Rate: Builds and maintains robust CI/CD pipelines with proper testing and deployment strategies.',
            phase: 'peer',
        },
        {
            category: 'Technical Communication',
            questionText: 'Rate: Communicates complex DevOps concepts clearly to technical and non-technical audiences.',
            phase: 'peer',
        },
        {
            category: 'Problem Solving',
            questionText: 'Rate: Demonstrates innovative problem-solving skills in DevOps challenges.',
            phase: 'peer',
        },
        {
            category: 'DevOps Leadership',
            questionText: 'Rate: Shows leadership in promoting DevOps best practices and culture.',
            phase: 'peer',
        },
        {
            category: 'Collaboration',
            questionText: 'Rate: Collaborates effectively with development teams to improve deployment processes.',
            phase: 'peer',
        },
    ];

    const nominationQuestions = [
        {
            category: 'Team Nominations',
            questionText: 'Who would you trust to lead a critical AWS migration project?',
            phase: 'nomination',
        },
        {
            category: 'Team Nominations',
            questionText: 'Who demonstrates the strongest expertise in cloud architecture and design?',
            phase: 'nomination',
        },
        {
            category: 'Team Nominations',
            questionText: 'Who would you choose to implement a complex Infrastructure as Code solution?',
            phase: 'nomination',
        },
        {
            category: 'Team Nominations',
            questionText: 'Who consistently shows ownership of production systems and reliability?',
            phase: 'nomination',
        },
        {
            category: 'Team Nominations',
            questionText: 'Who would you nominate as a technical mentor for junior team members?',
            phase: 'nomination',
        },
        {
            category: 'Team Nominations',
            questionText: 'Who demonstrates the strongest problem-solving abilities under pressure?',
            phase: 'nomination',
        },
        {
            category: 'Team Nominations',
            questionText: 'Who made the biggest contribution toward improving our cloud infrastructure this quarter?',
            phase: 'nomination',
        },
    ];

    // Create all questions
    const allQuestions = [...selfQuestions, ...peerQuestions, ...nominationQuestions];
    const createdQuestions = await Promise.all(
        allQuestions.map((q, index) =>
            prisma.review_questions.create({
                data: {
                    category: q.category,
                    questionText: q.questionText,
                    questionType: q.phase === 'self' ? 'text' : q.phase === 'peer' ? 'rating' : 'nomination',
                    phase: q.phase as any,
                    displayOrder: index + 1,
                    isActive: true,
                },
            })
        )
    );

    console.log(`✅ Created ${createdQuestions.length} review questions`);

    // 15. Create team members (for nominations)
    console.log('👥 Creating team members for nominations...');
    const teamMembersData = [
        { name: 'Glen Mogane', role: 'System Administrator', avatar: 'GM', userId: existingAdmins[0] },
        { name: 'Xolani Zulu', role: 'Lead Developer', avatar: 'XZ', userId: existingAdmins[1] },
        { name: 'Hannes Swanepoel', role: 'Product Manager', avatar: 'HS', userId: existingAdmins[2] },
        { name: 'Philemon Maitisa', role: 'Software Engineer', avatar: 'PM', userId: existingAdmins[3] },
        // Additional fictional team members for nominations
        { name: 'John Smith', role: 'Senior DevOps Engineer', avatar: 'JS', userId: null },
        { name: 'Sarah Johnson', role: 'Cloud Architect', avatar: 'SJ', userId: null },
        { name: 'Mike Chen', role: 'Platform Engineer', avatar: 'MC', userId: null },
        { name: 'Emily Davis', role: 'Site Reliability Engineer', avatar: 'ED', userId: null },
    ];

    const teamMembers = await Promise.all(
        teamMembersData.map((member) =>
            prisma.team_members.create({
                data: {
                    userId: member.userId,
                    name: member.name,
                    role: member.role,
                    avatar: member.avatar,
                    isActive: true,
                },
            })
        )
    );

    console.log(`✅ Created ${teamMembers.length} team members`);

    // 16. Create performance reviews for admins (Q3 2025 cycle)
    console.log('📋 Creating performance reviews for admins...');

    // Only create reviews for the 3 admins who have managers (excluding Glen who is CEO)
    const employeeAdmins = existingAdmins.slice(1); // Xolani, Hannes, Philemon

    const performanceReviews = await Promise.all(
        employeeAdmins.map(async (employeeId, index) => {
            // Determine manager - Glen manages Xolani and Hannes, Xolani manages Philemon
            let managerId;
            if (employeeId === existingAdmins[1] || employeeId === existingAdmins[2]) {
                managerId = existingAdmins[0]; // Glen manages Xolani and Hannes
            } else {
                managerId = existingAdmins[1]; // Xolani manages Philemon
            }

            const review = await prisma.performance_reviews.create({
                data: {
                    reviewPeriod: 'Q3 2025',
                    employeeId: employeeId,
                    managerId: managerId,
                    createdById: existingAdmins[0], // Glen created the reviews
                    status: index < 2 ? 'employee_completed' : 'employee_in_progress', // First 2 completed, 1 in progress
                    employeeCompletedAt: index < 2 ? new Date('2025-07-20') : null,
                    overallRating: index < 2 ? (4.2 + (Math.random() * 0.6)) : null, // Random rating between 4.2-4.8
                    createdAt: new Date('2025-07-01'),
                    updatedAt: new Date('2025-07-20'),
                },
            });
            return review;
        })
    );

    console.log(`✅ Created ${performanceReviews.length} performance reviews`);

    // 17. Create review responses (for completed reviews only)
    console.log('💬 Creating review responses...');

    const completedReviews = performanceReviews.filter(r => r.status === 'employee_completed');
    const responses = [];

    for (const review of completedReviews) {
        // Self review responses (10 questions)
        const selfQuestionIds = createdQuestions.filter(q => q.phase === 'self').slice(0, 10);
        for (const question of selfQuestionIds) {
            const sampleResponses = [
                'Led the migration of our legacy infrastructure to AWS EKS, resulting in 40% cost reduction and improved scalability.',
                'Implemented comprehensive Infrastructure as Code using Terraform, managing over 50 AWS resources across multiple environments.',
                'Designed and deployed CI/CD pipelines using GitLab CI and ArgoCD, reducing deployment time from 2 hours to 15 minutes.',
                'Established monitoring and alerting systems using Prometheus, Grafana, and PagerDuty, improving incident response time by 60%.',
                'Integrated security scanning into CI/CD pipelines using Trivy and SAST tools, identifying vulnerabilities before production.',
            ];

            responses.push({
                performanceReviewId: review.id,
                questionId: question.id,
                employeeId: review.employeeId,
                textResponse: sampleResponses[Math.floor(Math.random() * sampleResponses.length)],
                createdAt: new Date('2025-07-18'),
            });
        }

        // Peer review responses (8 questions, ratings 1-5)
        const peerQuestionIds = createdQuestions.filter(q => q.phase === 'peer').slice(0, 8);
        for (const question of peerQuestionIds) {
            responses.push({
                performanceReviewId: review.id,
                questionId: question.id,
                employeeId: review.employeeId,
                ratingResponse: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5 (high performers)
                createdAt: new Date('2025-07-19'),
            });
        }

        // Nomination responses (7 questions)
        const nominationQuestionIds = createdQuestions.filter(q => q.phase === 'nomination').slice(0, 7);
        for (const question of nominationQuestionIds) {
            const randomTeamMember = teamMembers[Math.floor(Math.random() * 4)]; // Pick from first 4 (actual admins)
            responses.push({
                performanceReviewId: review.id,
                questionId: question.id,
                employeeId: review.employeeId,
                nominationResponse: JSON.stringify({
                    memberId: randomTeamMember.id,
                    memberName: randomTeamMember.name,
                    reason: 'Demonstrates exceptional technical leadership and consistently delivers high-quality solutions.',
                }),
                createdAt: new Date('2025-07-20'),
            });
        }
    }

    const createdResponses = await Promise.all(
        responses.map((response) =>
            prisma.review_responses.create({
                data: response,
            })
        )
    );

    console.log(`✅ Created ${createdResponses.length} review responses`);

    // 18. Create manager feedback (for reviews being processed)
    console.log('📝 Creating manager feedback...');

    const managerFeedback = [];

    for (const review of completedReviews) {
        // General feedback
        managerFeedback.push({
            performanceReviewId: review.id,
            managerId: review.managerId,
            feedbackType: manager_feedback_type.general_feedback,
            managerComment: 'Excellent technical contributions this quarter. Shows strong leadership in DevOps practices and mentors junior team members effectively.',
            isVisible: true,
            createdAt: new Date('2025-07-22'),
        });

        // Salary justification
        const salaryIncrease = 6 + (Math.random() * 4); // 6-10% increase
        managerFeedback.push({
            performanceReviewId: review.id,
            managerId: review.managerId,
            feedbackType: manager_feedback_type.general_feedback,
            managerComment: `Recommending ${salaryIncrease.toFixed(1)}% salary increase based on exceptional performance, leadership contributions, and market benchmarking.`,
            isVisible: false, // Private for manager/HR
            createdAt: new Date('2025-07-22'),
        });

        // Development goals
        managerFeedback.push({
            performanceReviewId: review.id,
            managerId: review.managerId,
            feedbackType: manager_feedback_type.development_goals,
            managerComment: 'Focus areas for next quarter: AWS certification advancement, team mentoring expansion, and leading the new microservices architecture initiative.',
            isVisible: true,
            createdAt: new Date('2025-07-22'),
        });

        // Rating adjustment example (for one review)
        if (Math.random() > 0.5) {
            const randomResponse = createdResponses.find(r => r.performanceReviewId === review.id && r.ratingResponse);
            if (randomResponse) {
                managerFeedback.push({
                    performanceReviewId: review.id,
                    managerId: review.managerId,
                    feedbackType: manager_feedback_type.general_feedback,
                    questionReference: randomResponse.questionId,
                    originalResponse: randomResponse.ratingResponse?.toString(),
                    managerComment: 'Adjusting rating based on specific project outcomes and peer feedback. Performance exceeded expectations in this area.',
                    originalRating: randomResponse.ratingResponse,
                    managerRating: 5,
                    isVisible: false,
                    createdAt: new Date('2025-07-23'),
                });
            }
        }
    }

    const createdFeedback = await Promise.all(
        managerFeedback.map((feedback) =>
            prisma.manager_feedback.create({
                data: feedback,
            })
        )
    );

    console.log(`✅ Created ${createdFeedback.length} manager feedback entries`);

    // 19. Update performance reviews with final outcomes (for completed reviews)
    console.log('🎯 Updating reviews with final outcomes...');

    for (const review of completedReviews) {
        const currentUser = await prisma.users.findUnique({ where: { id: review.employeeId } });
        const salaryIncrease = 6 + (Math.random() * 4); // 6-10% increase
        // const newSalary = currentUser?.currentSalary ? currentUser.currentSalary.toNumber() * (1 + salaryIncrease / 100) : null;

        await prisma.performance_reviews.update({
            where: { id: review.id },
            data: {
                status: 'manager_reviewing',
                managerReviewCompletedAt: new Date('2025-07-23'),
                // salaryIncreasePercentage: salaryIncrease,
                // newSalary: '-',
                promotionRecommended: Math.random() > 0.7, // 30% chance of promotion recommendation
                newJobLevel: Math.random() > 0.7 ? 'Principal' : null,
                finalSummary: 'Outstanding performance this quarter with significant contributions to infrastructure modernization and team development. Demonstrates readiness for increased responsibilities.',
                updatedAt: new Date('2025-07-23'),
            },
        });
    }

    console.log('✅ Updated performance reviews with final outcomes');

    // Add to final summary
    console.log(`
🎯 Performance Review System Summary:
- Admin Users Updated: ${adminUpdates.length}
- Review Questions: ${createdQuestions.length} (10 self, 8 peer, 7 nomination)
- Team Members: ${teamMembers.length}
- Performance Reviews: ${performanceReviews.length} (for admins only)
- Review Responses: ${createdResponses.length} (25 per completed review)
- Manager Feedback: ${createdFeedback.length}

📊 Review Status:
- Employee Completed: 2 reviews
- Employee In Progress: 1 review
- Manager Reviewing: 2 reviews (with outcomes)

👥 Admin Hierarchy:
- Glen Mogane (CEO) - No manager, manages Xolani & Hannes
- Xolani Zulu (Lead Dev) - Reports to Glen, manages Philemon
- Hannes Swanepoel (Product Manager) - Reports to Glen
- Philemon Maitisa (Senior Engineer) - Reports to Xolani

💰 Salary Data:
- Glen: R180,000 (Executive level)
- Xolani: R145,000 (Lead level) 
- Hannes: R135,000 (Senior level)
- Philemon: R125,000 (Senior level)

🔄 Review Workflow Ready:
- Questions match your component structure (3 phases: self/peer/nomination)
- Manager dashboard can view all responses and provide feedback
- Salary recommendations and promotion tracking included
- Final review generation with comprehensive feedback
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