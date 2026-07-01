import { manager_feedback_type, notification_category, notification_type, notification_priority, PrismaClient, document_categories, leave_status, leave_requests_leave_length, document_priority, document_assignment_status, user_role_type, performance_review_status, question_type, review_phase } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Leave requests are seeded across the next 3 months
    const now = new Date();
    const leavePeriodStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const leavePeriodEnd = new Date(now.getFullYear(), now.getMonth() + 3, 28);

    // Existing admin user IDs
    const existingAdmins = [
        '6f329acb-665f-4841-a1f2-22af84c4c374', // Glen Mogane
        '90f19835-c07c-4f3e-9b66-7f686bdde1ca', // Xolani Zulu 
        'ab5a63df-a985-486d-8d2b-5e814b03b3ce', // Hannes Swanepoel
        '36e69224-62d0-46d4-87fc-3874670f71e7', // Philemon Maitisa
    ];

    // New user IDs for additional employees
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

    // All user IDs combined
    const allUserIds = [...existingAdmins, ...newUserIds];

    // 1. Create departments first (needed for foreign key references)
    console.log('🏢 Creating departments...');
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

    // Ensure we have all departments
    if (departments.length !== 4) {
        throw new Error(`Expected 4 departments, but got ${departments.length}`);
    }

    // Create department references for easier access
    const engineeringDept = departments.find(d => d.name === 'Engineering');
    const marketingDept = departments.find(d => d.name === 'Marketing');
    const salesDept = departments.find(d => d.name === 'Sales');
    const operationsDept = departments.find(d => d.name === 'Operations');

    if (!engineeringDept || !marketingDept || !salesDept || !operationsDept) {
        throw new Error('One or more departments could not be found or created');
    }

    console.log(`✅ Created ${departments.length} departments`);

    // 2. Create admin users with proper relationships (create in order: managers first)
    console.log('👤 Creating admin users...');

    // First create Glen (CEO - no manager)
    const glen = await prisma.users.upsert({
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
            employeeId: 'EMP001',
            departmentId: engineeringDept.id, // Engineering
            managerId: null, // CEO/Founder - no manager
            roleType: 'admin',
            jobLevel: 'Executive',
            isActive: true,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
    });

    // Then create users who report to Glen
    const xolani = await prisma.users.upsert({
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
            employeeId: 'EMP002',
            departmentId: engineeringDept.id, // Engineering
            managerId: glen.id, // Reports to Glen
            roleType: 'engineer',
            jobLevel: 'Lead',
            isActive: true,
            createdAt: new Date('2025-02-10'),
            updatedAt: new Date('2025-02-10'),
        },
    });

    const hannes = await prisma.users.upsert({
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
            employeeId: 'EMP003',
            departmentId: marketingDept.id, // Marketing (Product Manager)
            managerId: glen.id, // Reports to Glen
            roleType: 'product_manager',
            jobLevel: 'Senior',
            isActive: true,
            createdAt: new Date('2025-03-05'),
            updatedAt: new Date('2025-03-05'),
        },
    });

    // Finally create users who report to Xolani
    const philemon = await prisma.users.upsert({
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
            employeeId: 'EMP004',
            departmentId: engineeringDept.id, // Engineering
            managerId: xolani.id, // Reports to Xolani
            roleType: 'engineer',
            jobLevel: 'Senior',
            isActive: true,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
    });

    const adminUsers = [glen, xolani, hannes, philemon];
    console.log(`✅ Created ${adminUsers.length} admin users.`);

    // 3. Create additional employees (in proper hierarchy order)
    console.log('👥 Creating additional users...');

    // First create managers who report to existing admins
    const robert = await prisma.users.upsert({
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
            employeeId: 'EMP010',
            departmentId: salesDept.id, // Sales
            managerId: glen.id, // Reports to Glen
            roleType: 'manager',
            jobLevel: 'Senior',
            isActive: true,
            createdAt: new Date('2025-06-01'),
            updatedAt: new Date('2025-06-01'),
        },
    });

    const emma = await prisma.users.upsert({
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
            employeeId: 'EMP007',
            departmentId: marketingDept.id, // Marketing
            managerId: hannes.id, // Reports to Hannes
            roleType: 'manager',
            jobLevel: 'Senior',
            isActive: true,
            createdAt: new Date('2025-05-20'),
            updatedAt: new Date('2025-05-20'),
        },
    });

    // Then create employees who report to these managers and other admins
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
                employeeId: 'EMP005',
                departmentId: engineeringDept.id, // Engineering
                managerId: xolani.id, // Reports to Xolani
                roleType: 'engineer',
                jobLevel: 'Senior',
                isActive: true,
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
                employeeId: 'EMP006',
                departmentId: engineeringDept.id, // Engineering
                managerId: xolani.id, // Reports to Xolani
                roleType: 'engineer',
                jobLevel: 'Mid',
                isActive: true,
                createdAt: new Date('2025-06-15'),
                updatedAt: new Date('2025-06-15'),
            },
        }),
        // Marketing Team
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
                employeeId: 'EMP008',
                departmentId: marketingDept.id, // Marketing
                managerId: emma.id, // Reports to Emma Davis
                roleType: 'engineer', // No direct content creator role, using engineer
                jobLevel: 'Mid',
                isActive: true,
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
                employeeId: 'EMP009',
                departmentId: salesDept.id, // Sales
                managerId: robert.id, // Reports to Robert Wilson
                roleType: 'engineer', // No sales role in enum, using engineer
                jobLevel: 'Mid',
                isActive: true,
                createdAt: new Date('2025-05-15'),
                updatedAt: new Date('2025-05-15'),
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
                employeeId: 'EMP011',
                departmentId: operationsDept.id, // Operations
                managerId: glen.id, // Reports to Glen
                roleType: 'admin', // Operations coordinator
                jobLevel: 'Mid',
                isActive: true,
                createdAt: new Date('2025-04-15'),
                updatedAt: new Date('2025-04-15'),
            },
        }),
        // Junior Developer
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
                employeeId: 'EMP012',
                departmentId: engineeringDept.id, // Engineering
                managerId: philemon.id, // Reports to Philemon
                roleType: 'engineer',
                jobLevel: 'Junior',
                isActive: true,
                createdAt: new Date('2025-08-01'),
                updatedAt: new Date('2025-08-01'),
            },
        }),
    ]);

    // Add the created managers to the users array
    const allCreatedUsers = [robert, emma, ...users];
    console.log(`✅ Created ${allCreatedUsers.length} additional users`);

    // 4. Create user department assignments
    console.log('👥 Creating user department assignments...');
    const userDeptData = [
        // Engineering assignments
        { user_id: glen.id, department_id: engineeringDept.id },
        { user_id: xolani.id, department_id: engineeringDept.id },
        { user_id: philemon.id, department_id: engineeringDept.id },
        { user_id: newUserIds[0], department_id: engineeringDept.id }, // Sarah
        { user_id: newUserIds[1], department_id: engineeringDept.id }, // David
        { user_id: newUserIds[7], department_id: engineeringDept.id }, // Alex
        // Marketing assignments
        { user_id: hannes.id, department_id: marketingDept.id }, // Hannes
        { user_id: emma.id, department_id: marketingDept.id }, // Emma
        { user_id: newUserIds[3], department_id: marketingDept.id }, // James
        // Sales assignments
        { user_id: newUserIds[4], department_id: salesDept.id }, // Lisa
        { user_id: robert.id, department_id: salesDept.id }, // Robert
        // Operations assignments
        { user_id: newUserIds[6], department_id: operationsDept.id }, // Jennifer
    ];

    const userDepartments = [];
    for (const userDept of userDeptData) {
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

    // 5. Create dummy leave requests — 3 per month, scattered across the next 3 months
    console.log('📅 Creating dummy leave requests...');

    const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Family Responsibility Leave', 'Maternity Leave', 'Study Leave'];
    const leaveRequests = [];

    // Helper function to add days to a date
    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // Scatter 3 requests within each month: early, mid, and late (with a little jitter)
    const scatterDays = [4, 14, 24];

    for (let monthOffset = 1; monthOffset <= 3; monthOffset++) {
        for (let slot = 0; slot < 3; slot++) {
            const userId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
            const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
            const day = scatterDays[slot] + Math.floor(Math.random() * 4); // jitter of 0-3 days
            const startDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, day);
            const duration = Math.floor(Math.random() * 5) + 1; // 1-5 days
            const endDate = addDays(startDate, duration - 1);
            const leaveLength: leave_requests_leave_length =
                Math.random() > 0.8
                    ? leave_requests_leave_length.half_day
                    : leave_requests_leave_length.full_day;

            // Future requests: mostly pending, roughly a third already approved
            const status: leave_status = Math.random() < 0.33 ? 'approved' : 'pending';

            const approvedBy = status === 'approved' ? glen.id : null;
            const approvedAt = status === 'approved' ? new Date() : null;

            const requestData = {
                uid: userId,
                leave_type: leaveType,
                status: status,
                duration: duration,
                start_date: startDate,
                end_date: endDate,
                leave_length: leaveLength,
                leave_comment: `${leaveType} request for ${duration} day${duration > 1 ? 's' : ''}`,
                feedback: null,
                approved_by: approvedBy,
                approved_at: approvedAt,
                createdAt: new Date(), // Requested now, for a future date
                updatedAt: approvedAt || new Date(),
            };

            try {
                const leaveRequest = await prisma.leave_requests.create({
                    data: requestData
                });
                leaveRequests.push(leaveRequest);

                // Create action log entry for approved requests
                if (status === 'approved') {
                    await prisma.leave_action_log.create({
                        data: {
                            leave_id: leaveRequest.id,
                            manager_id: glen.id, // Glen approves most requests
                            action: 'approved',
                            previous_status: 'pending',
                            new_status: status,
                            timestamp: approvedAt || new Date(),
                        }
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Could not create leave request: ${error}`);
            }
        }
    }

    console.log(`✅ Created ${leaveRequests.length} leave requests`);

    // 6. Create some document categories and sample documents
    console.log('📄 Creating document categories and sample documents...');

    const docCategories = [];
    const categoryData = [
        { name: 'HR Policies', description: 'Human Resources policies and procedures', departmentId: operationsDept.id, color: '#3B82F6' },
        { name: 'Engineering Standards', description: 'Technical standards and best practices', departmentId: engineeringDept.id, color: '#10B981' },
        { name: 'Marketing Guidelines', description: 'Brand guidelines and marketing procedures', departmentId: marketingDept.id, color: '#F59E0B' },
        { name: 'Sales Training', description: 'Sales processes and training materials', departmentId: salesDept.id, color: '#EF4444' },
    ];

    for (const category of categoryData) {
        const existing = await prisma.document_categories.findFirst({
            where: { name: category.name }
        });

        if (existing) {
            docCategories.push(existing);
        } else {
            const created = await prisma.document_categories.create({
                data: category
            });
            docCategories.push(created);
        }
    }

    // Create sample documents
    const documents = [];
    const documentData = [
        { name: 'Employee Handbook 2025', categoryId: docCategories[0].id, priority: 'high' as document_priority, createdBy: glen.id },
        { name: 'Code Review Guidelines', categoryId: docCategories[1].id, priority: 'medium' as document_priority, createdBy: xolani.id },
        { name: 'Brand Style Guide', categoryId: docCategories[2].id, priority: 'medium' as document_priority, createdBy: hannes.id },
        { name: 'Sales Process Manual', categoryId: docCategories[3].id, priority: 'high' as document_priority, createdBy: robert.id },
        { name: 'Remote Work Policy', categoryId: docCategories[0].id, priority: 'low' as document_priority, createdBy: glen.id },
    ];

    for (const doc of documentData) {
        const existing = await prisma.documents.findFirst({
            where: { name: doc.name }
        });

        if (!existing) {
            const created = await prisma.documents.create({
                data: {
                    name: doc.name,
                    category_id: doc.categoryId,
                    file_url: `/documents/${doc.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
                    file_size: `${Math.floor(Math.random() * 500) + 100}KB`,
                    content: `This is the content for ${doc.name}`,
                    priority: doc.priority,
                    created_by: doc.createdBy,
                }
            });
            documents.push(created);
        }
    }

    console.log(`✅ Created ${docCategories.length} document categories and ${documents.length} documents`);

    // 7. Configure onboarding auto-assignment on sample documents
    // (auto_assign_new_users flag + document_auto_assign_rules — used by POST /add-user
    // and POST /admin-docs/assignments/sync-onboarding)
    console.log('⚡ Configuring document auto-assignment...');

    let autoAssignConfigured = 0;

    // Employee Handbook: mandatory, auto-assigned to every new employee (no scoping rules)
    const handbook = await prisma.documents.findFirst({ where: { name: 'Employee Handbook 2025' } });
    if (handbook) {
        await prisma.document_training_metadata.upsert({
            where: { document_id: handbook.id },
            update: { auto_assign_new_users: true, is_mandatory: true },
            create: { document_id: handbook.id, auto_assign_new_users: true, is_mandatory: true },
        });
        autoAssignConfigured++;
    }

    // Code Review Guidelines: auto-assigned to new Engineering employees only, due in 14 days
    const codeReviewDoc = await prisma.documents.findFirst({ where: { name: 'Code Review Guidelines' } });
    if (codeReviewDoc) {
        await prisma.document_training_metadata.upsert({
            where: { document_id: codeReviewDoc.id },
            update: { auto_assign_new_users: true },
            create: { document_id: codeReviewDoc.id, auto_assign_new_users: true },
        });
        const existingRule = await prisma.document_auto_assign_rules.findFirst({
            where: { document_id: codeReviewDoc.id, department_id: engineeringDept.id, role: null },
        });
        if (!existingRule) {
            await prisma.document_auto_assign_rules.create({
                data: { document_id: codeReviewDoc.id, department_id: engineeringDept.id, due_days: 14 },
            });
        }
        autoAssignConfigured++;
    }

    console.log(`✅ Configured auto-assignment on ${autoAssignConfigured} documents`);

    // 8. Seed an active TEST performance review cycle for the existing admins
    // Each admin is their own peer reviewer and manager appraiser (test-mode full circle),
    // so any of these accounts can walk self-review → peer review → manager appraisal →
    // admin submissions immediately after seeding. Excluded from reports; deletable via
    // DELETE /performance/cycles/:id.
    console.log('🧪 Creating test performance review cycle...');

    const TEST_CYCLE_ID = '00000000-0000-4000-8000-00000000c1c1';
    const testCycle = await prisma.review_cycles.upsert({
        where: { id: TEST_CYCLE_ID },
        update: { status: 'active', isTest: true },
        create: {
            id: TEST_CYCLE_ID,
            name: 'Seed Test Cycle',
            startDate: now,
            endDate: addDays(now, 30),
            status: 'active',
            isTest: true,
            createdById: glen.id,
        },
    });

    // Self-peer assignments (reviewer == reviewee is allowed in test cycles)
    await prisma.peer_review_assignments.createMany({
        data: existingAdmins.map((adminId) => ({
            cycleId: TEST_CYCLE_ID,
            revieweeId: adminId,
            reviewerId: adminId,
        })),
        skipDuplicates: true,
    });

    // Question stubs mirror what POST /cycles/:id/activate creates
    const [selfQs, nextStepsQs, managerQs] = await Promise.all([
        prisma.review_questions.findMany({ where: { reviewType: 'self_review', isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true } }),
        prisma.review_questions.findMany({ where: { reviewType: 'next_steps', isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true } }),
        prisma.review_questions.findMany({ where: { reviewType: 'manager_appraisal', isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true } }),
    ]);
    if (selfQs.length === 0) {
        console.warn('⚠️ No review questions found — run `npx ts-node -r dotenv/config prisma/seed-review-questions.ts` first for pre-created response stubs.');
    }

    let testReviewsCreated = 0;
    for (const adminId of existingAdmins) {
        // Self-review (+ response stubs so the employee page can save immediately)
        let selfReview = await prisma.performance_reviews.findFirst({
            where: { employeeId: adminId, reviewType: 'self_review', cycleId: TEST_CYCLE_ID },
            select: { id: true },
        });
        if (!selfReview) {
            selfReview = await prisma.performance_reviews.create({
                data: { employeeId: adminId, managerId: adminId, cycleId: TEST_CYCLE_ID, reviewPeriod: testCycle.name, reviewType: 'self_review' },
                select: { id: true },
            });
            testReviewsCreated++;
        }
        await prisma.review_responses.createMany({
            data: [...selfQs, ...nextStepsQs].map((q) => ({
                performanceReviewId: selfReview!.id,
                questionId: q.id,
                employeeId: adminId,
                reviewerType: 'self' as const,
            })),
            skipDuplicates: true,
        });

        // Manager appraisal — managerId is the admin themself so one login completes it
        let managerAppraisal = await prisma.performance_reviews.findFirst({
            where: { employeeId: adminId, reviewType: 'manager_appraisal', cycleId: TEST_CYCLE_ID },
            select: { id: true },
        });
        if (!managerAppraisal) {
            managerAppraisal = await prisma.performance_reviews.create({
                data: { employeeId: adminId, managerId: adminId, cycleId: TEST_CYCLE_ID, reviewPeriod: testCycle.name, reviewType: 'manager_appraisal' },
                select: { id: true },
            });
            testReviewsCreated++;
        }
        await prisma.review_responses.createMany({
            data: managerQs.map((q) => ({
                performanceReviewId: managerAppraisal!.id,
                questionId: q.id,
                employeeId: adminId,
                reviewerType: 'manager' as const,
            })),
            skipDuplicates: true,
        });

        // Peer review record (self-review of a peer) linked to the assignment
        let peerReview = await prisma.performance_reviews.findFirst({
            where: { employeeId: adminId, revieweeId: adminId, reviewType: 'peer_review', cycleId: TEST_CYCLE_ID },
            select: { id: true },
        });
        if (!peerReview) {
            peerReview = await prisma.performance_reviews.create({
                data: { employeeId: adminId, revieweeId: adminId, managerId: adminId, cycleId: TEST_CYCLE_ID, reviewPeriod: testCycle.name, reviewType: 'peer_review' },
                select: { id: true },
            });
            testReviewsCreated++;
        }
        await prisma.peer_review_assignments.updateMany({
            where: { cycleId: TEST_CYCLE_ID, revieweeId: adminId, reviewerId: adminId, performanceReviewId: null },
            data: { performanceReviewId: peerReview!.id },
        });
    }

    console.log(`✅ Test cycle "${testCycle.name}" active with ${existingAdmins.length} participants (${testReviewsCreated} new review records)`);

    // 9. Create some notifications
    console.log('🔔 Creating sample notifications...');

    const notifications = [];
    const notificationData = [
        {
            recipientId: xolani.id,
            createdById: glen.id,
            type: 'info' as notification_type,
            category: 'leave_management' as notification_category,
            title: 'Leave Request Approved',
            message: 'Your annual leave request has been approved.',
            priority: 'normal' as notification_priority,
        },
        {
            recipientId: newUserIds[0], // Sarah
            createdById: hannes.id,
            type: 'action_required' as notification_type,
            category: 'document_management' as notification_category,
            title: 'Document Review Required',
            message: 'Please review and sign the updated Employee Handbook.',
            priority: 'high' as notification_priority,
        },
        {
            recipientId: newUserIds[1], // David
            createdById: null,
            type: 'reminder' as notification_type,
            category: 'performance_reviews' as notification_category,
            title: 'Performance Review Due',
            message: 'Your Q3 performance review is due in 3 days.',
            priority: 'normal' as notification_priority,
        },
    ];

    for (const notif of notificationData) {
        const created = await prisma.notifications.create({
            data: notif
        });
        notifications.push(created);
    }

    console.log(`✅ Created ${notifications.length} notifications`);

    // Final summary
    console.log(`
🎉 Seed completed successfully!

📊 Summary:
- Departments: ${departments.length}
- Admin Users: ${adminUsers.length}
- Additional Users: ${allCreatedUsers.length}
- User Department Assignments: ${userDepartments.length}
- Leave Requests: ${leaveRequests.length}
- Document Categories: ${docCategories.length}
- Documents: ${documents.length}
- Auto-assign Documents: ${autoAssignConfigured}
- Test Review Cycle: "${testCycle.name}" (participants: ${existingAdmins.length} existing admins)
- Notifications: ${notifications.length}

📅 Leave Requests Timeline:
- Period: ${leavePeriodStart.toDateString()} to ${leavePeriodEnd.toDateString()} (3 per month, scattered)
- Total Requests: ${leaveRequests.length}
- Approved: ${leaveRequests.filter(req => req.status === 'approved').length}
- Pending: ${leaveRequests.filter(req => req.status === 'pending').length}

👥 Organization Structure:
- Glen Mogane (CEO) - No manager
- Xolani Zulu (Lead Dev) - Reports to Glen
- Hannes Swanepoel (Product Manager) - Reports to Glen  
- Philemon Maitisa (Senior Engineer) - Reports to Xolani
- Sarah Williams (Senior Frontend Dev) - Reports to Xolani
- David Johnson (Backend Dev) - Reports to Xolani
- Emma Davis (Marketing Manager) - Reports to Hannes
- James Brown (Content Creator) - Reports to Emma
- Lisa Miller (Sales Rep) - Reports to Robert
- Robert Wilson (Sales Manager) - Reports to Glen
- Jennifer Garcia (Operations Coordinator) - Reports to Glen
- Alex Thompson (Junior Developer) - Reports to Philemon

🔄 System Features Ready:
✅ Leave Management System (3 scattered requests per month, next 3 months)
✅ Document Management with Training & Onboarding Auto-assignment
✅ Performance Review System with active TEST cycle (existing admins review themselves — full circle from one login)
✅ Notification Center
✅ User Hierarchy & Departments
✅ Comprehensive audit trails

🧪 Test cycle walkthrough (any existing admin account):
1. /performance-review — complete self-review & own peer review
2. Amber banner button — complete your own manager appraisal
3. /performance-review-admin — view submissions, apply overrides, close cycle
4. Delete the test cycle from the admin page when done
    `);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
    });