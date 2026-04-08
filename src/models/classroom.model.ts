export interface Course {
  courseId: string
  name: string
  code: string
  credits: number
  description?: string
}

export interface ClassRoom {
  id?: number
  classId: string
  name: string
  semester: string
  academicYear: string
  maxStudents: number
  schedule?: string
  course?: Course
  teacher?: {
    userId: string
    fullName: string
    email: string
  }
  studentCount?: number
}

export interface CreateClassRoomPayload {
  name: string
  courseId: string
  teacherId: string
  semester: string
  academicYear: string
  maxStudents: number
  schedule?: string
}