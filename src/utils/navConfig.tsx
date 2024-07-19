

const navConfig = [
  {
    title: 'dashboard',
    path: '/',
    icon: '🏠',
    permissions: ['admin', 'user'],
  },
  {
    title: 'apply leave',
    path: '/apply-leave',
    icon: '😊',
    permissions: ['admin', 'user'],
  },
  {
    title: 'manage employees',
    path: '/manage-employees',
    icon: '👥',
    permissions: ['admin'],
  },
  {
    title: 'manage leave requests',
    path: '/manage-requests',
    icon: '📝',
    permissions: ['admin'],
  },
  {
    title: 'My Leave History',
    path: '/leave-history',
    icon: '⏳',
    permissions: ['admin', 'user'],
  },
  {
    title: 'view profile',
    path: '/view-profile',
    icon: '🧑‍💻',
    permissions: ['admin', 'user'],
  },
];

export default navConfig;
