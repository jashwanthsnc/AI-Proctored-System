import {
  IconLayoutDashboard,
  IconClipboardList,
  IconFilePlus,
  IconListCheck,
  IconEye,
  IconShieldCheck,
  IconAlertTriangle,
  IconUsers,
  IconChartBar,
  IconBook,
  IconChartLine,
  IconReportAnalytics,
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Overview',
    roles: ['teacher', 'student'],
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'My Dashboard',
    icon: IconLayoutDashboard,
    href: '/student-dashboard',
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'My Exams',
    icon: IconClipboardList,
    href: '/exam',
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'Results & Grades',
    icon: IconChartBar,
    href: '/result',
    roles: ['student'],
  },
  // Teacher — Exam Management
  {
    navlabel: true,
    subheader: 'Exam Management',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Create Exam',
    icon: IconFilePlus,
    href: '/create-exam',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'All Exams',
    icon: IconClipboardList,
    href: '/all-exams',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Question Bank',
    icon: IconBook,
    href: '/add-questions',
    roles: ['teacher'],
  },
  // Teacher — Monitoring
  {
    navlabel: true,
    subheader: 'Monitoring & Security',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Live Proctoring',
    icon: IconEye,
    href: '/live-proctoring',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Violation Logs',
    icon: IconAlertTriangle,
    href: '/exam-log',
    roles: ['teacher'],
  },
  // Teacher — Students & Results
  {
    navlabel: true,
    subheader: 'Students & Results',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Students',
    icon: IconUsers,
    href: '/students',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Results',
    icon: IconChartLine,
    href: '/result',
    roles: ['teacher'],
  },
  // Teacher — Analytics
  {
    navlabel: true,
    subheader: 'Reports',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Analytics',
    icon: IconReportAnalytics,
    href: '/analytics',
    roles: ['teacher'],
  },
];

export default Menuitems;
