import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { classesApi } from '@/lib/api/classes.api';
import { usersApi } from '@/lib/api/courses.api';
import type { IClass } from '@/server/api/classes/class.schema';
import type { IUser } from '@/server/api/auth/user.schema';
import ClientClassDetails from './client';

async function fetchClassData(id: string, token?: string) {
  try {
    const classDoc = await classesApi.getById(id, token);
    console.log('Server: Fetched class:', classDoc);
    return classDoc;
  } catch (error: any) {
    console.error('Server: fetchClassData error:', error);
    if (error.message === 'Class not found') notFound();
    throw error;
  }
}

async function fetchUserData(token?: string) {
  try {
    const user = await usersApi.getCurrentUser(token);
    console.log('Server: Fetched user:', user);
    return user;
  } catch (error: any) {
    console.error('Server: fetchUserData error:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const classDoc: IClass = await fetchClassData(id, token);
  const currentUser: IUser | null = await fetchUserData(token);

  return (
    <ClientClassDetails
      classDoc={classDoc}
      currentUser={currentUser}
    />
  );
}