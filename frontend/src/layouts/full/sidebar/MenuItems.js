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
  IconCalendarEvent,
  IconBook,
  IconCode,
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
    roles: ['teacher', 'student'], 
  },
  {
    id: uniqueId(),
    title: 'Calendar',
    icon: IconCalendarEvent,
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
    title: 'Question Bank',
    icon: IconBook,
    href: '/add-questions',
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
  {
    id: uniqueId(),
    title: 'Security Settings',
    icon: IconShieldCheck,
    href: '/exam',
    roles: ['teacher'], 
  },
  {
    navlabel: true,
    subheader: 'Student Management',
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
    title: 'Submissions',
    icon: IconListCheck,
    href: '/exam',
    roles: ['teacher'], 
  },
];

export default Menuitems;
