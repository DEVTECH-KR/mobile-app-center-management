

import { User, Course, PaymentDetails, Event, Document, UserRole, Partner, Class, CenterInfo, EnrollmentRequest } from './types';

export const MOCK_USERS: { [key: string]: User } = {
  student: {
    id: 'user-1',
    name: 'Alex Doe',
    email: 'student@ffbf.com',
    role: 'student',
    avatarUrl: 'https://picsum.photos/seed/101/100/100',
    enrolledCourseIds: ['course-1'],
    enrollmentRequestIds: ['req-2'],
    classIds: ['class-1'],
    gender: 'male',
    nationality: 'Congolese',
    educationLevel: 'Bachelors',
    university: 'University of Kinshasa',
    address: '123 Main St, Kinshasa, DRC',
    phone: '+243 812 345 678'
  },
  student2: {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'student',
    avatarUrl: 'https://picsum.photos/seed/103/100/100',
    enrolledCourseIds: [],
    enrollmentRequestIds: ['req-1'],
    classIds: [],
    gender: 'female',
    nationality: 'Burundian',
    educationLevel: 'Masters',
    university: 'University of Burundi',
    address: '456 Market St, Bujumbura, Burundi',
    phone: '+257 22 40 12 34'
  },
  teacher: {
    id: 'user-teacher',
    name: 'Dr. Evelyn Reed',
    email: 'e.reed@ffbf.com',
    role: 'teacher',
    avatarUrl: 'https://picsum.photos/seed/201/200/200',
    enrolledCourseIds: [],
    classIds: ['class-2'],
    gender: 'female',
    nationality: 'Other',
    otherNationality: 'American',
    educationLevel: 'Doctorate',
    university: 'MIT',
    address: '789 Tech Ave, Cambridge, USA',
    phone: '+1 617 555 0100'
  },
  teacher2: {
    id: 'user-teacher2',
    name: 'Marcus Chen',
    email: 'm.chen@ffbf.com',
    role: 'teacher',
    avatarUrl: 'https://picsum.photos/seed/202/200/200',
    enrolledCourseIds: [],
    classIds: ['class-1'],
    gender: 'male',
    nationality: 'Other',
    otherNationality: 'Canadian',
    educationLevel: 'Masters',
    university: 'University of Toronto',
    address: '101 University Ave, Toronto, Canada',
    phone: '+1 416 555 0101'
  },
  admin: {
    id: 'user-admin',
    name: 'Admin Director',
    email: 'admin@ffbf.com',
    role: 'admin',
    avatarUrl: 'https://picsum.photos/seed/102/100/100',
    gender: 'other',
    nationality: 'Congolese',
    educationLevel: 'Masters',
    university: 'Harvard University',
    address: 'Admin Palace, Kinshasa, DRC',
    phone: '+243 800 000 000'
  },
};

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Office (Bureautics)',
    description: 'Master the full Microsoft Office suite, from Word and Excel to PowerPoint and Outlook.',
    price: 50000,
    teacherIds: ['user-teacher2'],
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '09:00',
    endTime: '11:00',
    imageUrl: 'https://picsum.photos/seed/1/600/400',
    imageHint: 'computer desk',
    levels: ['Beginner', 'Advanced'],
  },
  {
    id: 'course-2',
    title: 'Programming',
    description: 'Learn the fundamentals of web development with HTML, CSS, JavaScript, and React.',
    price: 100000,
    teacherIds: ['user-teacher'],
    days: ['Tue', 'Thu'],
    startTime: '18:00',
    endTime: '20:00',
    imageUrl: 'https://picsum.photos/seed/2/600/400',
    imageHint: 'code screen',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    id: 'course-3',
    title: 'English & French',
    description: 'Improve your language proficiency with our comprehensive English and French courses.',
    price: 40000,
    teacherIds: [],
    days: ['Sat'],
    startTime: '10:00',
    endTime: '13:00',
    imageUrl: 'https://picsum.photos/seed/3/600/400',
    imageHint: 'books library',
    levels: ['All levels'],
  },
];

export const MOCK_CLASSES: Class[] = [
    { id: 'class-1', name: 'Room A', courseId: 'course-1', level: 'Beginner', teacherId: 'user-teacher2', studentIds: ['user-1'] },
    { id: 'class-2', name: 'Lab 1', courseId: 'course-2', level: 'Fundamentals', teacherId: 'user-teacher', studentIds: [] },
    { id: 'class-3', name: 'Room B', courseId: 'course-3', level: 'First Level', teacherId: null, studentIds: ['user-2'] },
];

const officeMinerval = MOCK_COURSES.find(c => c.id === 'course-1')?.price || 0;
const installmentAmount = officeMinerval / 4;

export const MOCK_PAYMENTS: PaymentDetails = {
  userId: 'user-1',
  courseId: 'course-1',
  registrationFee: 20000,
  installments: [
    { name: 'Registration Fee', amount: 20000, status: 'Paid', dueDate: '2024-01-15' },
    { name: 'Installment 1', amount: installmentAmount, status: 'Paid', dueDate: '2024-01-15' },
    { name: 'Installment 2', amount: installmentAmount, status: 'Paid', dueDate: '2024-02-15' },
    { name: 'Installment 3', amount: installmentAmount, status: 'Unpaid', dueDate: '2024-03-15' },
    { name: 'Installment 4', amount: installmentAmount, status: 'Unpaid', dueDate: '2024-04-15' },
  ],
  totalPaid: 20000 + installmentAmount * 2,
  totalDue: 20000 + officeMinerval,
};

export const MOCK_EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Tech Conference 2024',
    description: 'Join us for the annual tech conference featuring guest speakers from the industry. This is a great opportunity to network with professionals and learn about the latest trends in technology.',
    details: 'The conference will be held at the National Convention Center. Topics include AI, blockchain, and quantum computing. Breakfast and lunch will be provided. Please RSVP by October 1st.',
    date: '2024-10-25',
    isPast: false,
    imageUrls: ['https://picsum.photos/seed/4/600/400', 'https://picsum.photos/seed/41/600/400'],
    imageHint: 'conference presentation',
  },
  {
    id: 'event-2',
    title: 'Community Workshop',
    description: 'A hands-on workshop on modern web development techniques. Limited seats available!',
    details: 'This workshop is perfect for beginners and intermediate developers looking to sharpen their skills. We will cover React, Next.js, and Tailwind CSS. Bring your own laptop. Snacks and coffee will be available.',
    date: '2024-11-15',
    isPast: false,
    imageUrls: ['https://picsum.photos/seed/5/600/400'],
    imageHint: 'community gathering',
  },
  {
    id: 'event-3',
    title: 'Graduation Ceremony 2023',
    description: 'Celebrating the achievements of our 2023 graduates.',
    details: 'A memorable day for our students, their families, and our staff. The ceremony was held at the Grand Theater and featured a keynote speech by a renowned academic. All graduates received their diplomas and special awards were given for outstanding performance.',
    date: '2023-12-20',
    isPast: true,
    imageUrls: ['https://picsum.photos/seed/6/600/400', 'https://picsum.photos/seed/61/600/400', 'https://picsum.photos/seed/62/600/400'],
    imageHint: 'graduation ceremony',
  },
];

export const MOCK_DOCUMENTS: Document[] = [
    { id: 'doc-1', courseId: 'course-1', title: 'Course Syllabus', type: 'Syllabus', fileUrl: '#', uploadedAt: '2024-01-10', uploaderId: 'user-teacher2' },
    { id: 'doc-2', courseId: 'course-1', title: 'Excel Basics', type: 'Material', fileUrl: '#', uploadedAt: '2024-01-20', uploaderId: 'user-teacher2' },
    { id: 'doc-3', courseId: 'course-2', title: 'Intro to JavaScript', type: 'Material', fileUrl: '#', uploadedAt: '2024-02-01', uploaderId: 'user-teacher' },
    { id: 'doc-4', courseId: 'course-2', title: 'React Hooks Guide', type: 'Material', fileUrl: '#', uploadedAt: '2024-03-05', uploaderId: 'user-teacher' },
    { id: 'doc-5', courseId: 'course-1', title: 'Advanced Formulas Assignment', type: 'Assignment', fileUrl: '#', uploadedAt: '2024-03-10', uploaderId: 'user-teacher2' },
];

export const MOCK_CENTER_INFO: CenterInfo = {
  mission: 'To empower individuals with practical skills and knowledge, fostering personal and professional growth for a brighter future. We are committed to providing high-quality training in a supportive and dynamic learning environment.',
  schedule: 'Open Monday to Saturday, from 8:00 AM to 9:00 PM.',
  registrationFee: 20000,
  address: '123 Ave de la Liberation, Gombe, Kinshasa, DRC',
  contact: '+243 812 345 678 (Admin Director)',
};

export const MOCK_PARTNERS: Partner[] = [
  { name: 'Google', logoUrl: 'https://picsum.photos/seed/p1/100/100' },
  { name: 'Microsoft', logoUrl: 'https://picsum.photos/seed/p2/100/100' },
  { name: 'Coursera', logoUrl: 'https://picsum.photos/seed/p3/100/100' },
  { name: 'Local Chamber of Commerce', logoUrl: 'https://picsum.photos/seed/p4/100/100' }
];

export const MOCK_ENROLLMENT_REQUESTS: EnrollmentRequest[] = [
    { id: 'req-1', userId: 'user-2', courseId: 'course-3', requestDate: new Date().toISOString(), status: 'pending' },
    { id: 'req-2', userId: 'user-1', courseId: 'course-2', requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
];
    
