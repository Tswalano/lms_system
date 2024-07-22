import { HiHome, HiBell, HiDocumentText, HiClock, HiUserGroup } from "react-icons/hi";

const navConfig = [
  {
    title: 'dashboard',
    path: '/',
    icon: <HiHome size={22} />,
    permissions: ['admin', 'user'],
  },
  {
    title: 'apply leave',
    path: '/apply-leave',
    icon: <HiBell size={22} />,
    permissions: ['admin', 'user'],
  },
  {
    title: 'manage employees',
    path: '/manage-employees',
    icon: <HiUserGroup size={22} />,
    permissions: ['admin'],
  },
  {
    title: 'manage leave requests',
    path: '/manage-requests',
    icon: <HiDocumentText size={22} />,
    permissions: ['admin'],
  },
  {
    title: 'My Leave History',
    path: '/leave-history',
    icon: <HiClock size={22} />,
    permissions: ['admin', 'user'],
  },
  // {
  //   title: 'view profile',
  //   path: '/view-profile',
  //   icon: '🧑‍💻',
  //   permissions: ['admin', 'user'],
  // },
];

export default navConfig;
