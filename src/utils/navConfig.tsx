import { FaCalendarAlt } from "react-icons/fa";
import { HiHome, HiBell, HiDocumentText, HiClock, HiUserGroup } from "react-icons/hi";

const navConfig = [
  {
    title: 'dashboard',
    path: '/',
    icon: <HiHome size={22} />,
    permissions: ['admin', 'user'],
  },
  {
    title: 'apply for leave',
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
  {
    title: 'Employees Leave History',
    path: '/view-all-leave',
    icon: <HiClock size={22} />,
    permissions: ['admin'],
  },
];

export default navConfig;
