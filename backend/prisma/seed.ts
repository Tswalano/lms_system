import { manager_feedback_type, notification_category, notification_type, notification_priority, PrismaClient, document_categories } from '../lib/generated/prisma';

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
            departmentId: departments[0].id, // Engineering
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
            departmentId: departments[0].id, // Engineering
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
            departmentId: departments[1].id, // Marketing (Product Manager)
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
            departmentId: departments[0].id, // Engineering
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
            departmentId: departments[2].id, // Sales
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
            departmentId: departments[1].id, // Marketing
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
                departmentId: departments[0].id, // Engineering
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
                departmentId: departments[0].id, // Engineering
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
                departmentId: departments[1].id, // Marketing
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
                departmentId: departments[2].id, // Sales
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
                departmentId: departments[3].id, // Operations
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
                departmentId: departments[0].id, // Engineering
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
        { user_id: glen.id, department_id: departments[0].id },
        { user_id: xolani.id, department_id: departments[0].id },
        { user_id: philemon.id, department_id: departments[0].id },
        { user_id: newUserIds[0], department_id: departments[0].id }, // Sarah
        { user_id: newUserIds[1], department_id: departments[0].id }, // David
        { user_id: newUserIds[7], department_id: departments[0].id }, // Alex
        // Marketing assignments
        { user_id: hannes.id, department_id: departments[1].id }, // Hannes
        { user_id: emma.id, department_id: departments[1].id }, // Emma
        { user_id: newUserIds[3], department_id: departments[1].id }, // James
        // Sales assignments
        { user_id: newUserIds[4], department_id: departments[2].id }, // Lisa
        { user_id: robert.id, department_id: departments[2].id }, // Robert
        // Operations assignments
        { user_id: newUserIds[6], department_id: departments[3].id }, // Jennifer
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

    // Final summary
    console.log(`
🎉 Seed completed successfully!

📊 Summary:
- Departments: ${departments.length}
- Admin Users: ${adminUsers.length}
- Additional Users: ${allCreatedUsers.length}
- User Department Assignments: ${userDepartments.length}

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
✅ Leave Management System
✅ Document Management with Training
✅ Performance Review System (Q3 2025)
✅ Notification Center
✅ User Hierarchy & Departments
✅ Comprehensive audit trails
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