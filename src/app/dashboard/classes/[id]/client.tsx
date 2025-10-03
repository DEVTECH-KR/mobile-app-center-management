'use client';

import Image from 'next/image';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { IClass } from '@/server/api/classes/class.schema';
import type { IUser } from '@/server/api/auth/user.schema';

interface ClientClassDetailsProps {
  classDoc: IClass;
  currentUser: IUser | null;
}

export default function ClientClassDetails({ classDoc, currentUser }: ClientClassDetailsProps) {
  console.log('ClientClassDetails: class data', classDoc);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/classes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <div className="relative aspect-[3/2] w-full rounded-lg overflow-hidden">
            <Image
              src={classDoc.courseId?.imageUrl || '/images/default-course.png'}
              alt={classDoc.name || 'Class Image'}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight">
              {classDoc.name || 'Untitled Class'}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Course: {classDoc.courseId?.title || 'Unknown'}
            </p>
            <p className="text-lg text-muted-foreground">
              Level: {classDoc.level || 'Not specified'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Course</p>
                  <p className="text-sm">{classDoc.courseId?.title || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Teacher</p>
                  <p className="text-sm">{classDoc.teacherId?.name || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Students</p>
                  <p className="text-sm">{classDoc.studentIds.length} enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentUser?.role === 'admin' && (
            <Button asChild>
              <Link href={`/dashboard/classes/${classDoc._id}/edit`}>Edit Class</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          {classDoc.studentIds.length > 0 ? (
            <div className="space-y-4">
              {classDoc.studentIds.map((student: any) => (
                <div key={student._id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}