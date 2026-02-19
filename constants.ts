
import { Employee } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP001',
    name: 'Alex Rivera',
    role: 'Senior Developer',
    department: 'Engineering',
    avatar: 'https://picsum.photos/seed/alex/150/150',
    password: 'password123'
  },
  {
    id: 'EMP002',
    name: 'Jordan Smith',
    role: 'Product Designer',
    department: 'Design',
    avatar: 'https://picsum.photos/seed/jordan/150/150',
    password: 'design2024'
  },
  {
    id: 'EMP003',
    name: 'Sarah Chen',
    role: 'Project Manager',
    department: 'Operations',
    avatar: 'https://picsum.photos/seed/sarah/150/150',
    password: 'admin321'
  }
];

export const APP_STORAGE_KEY = 'synctime_pro_data';
