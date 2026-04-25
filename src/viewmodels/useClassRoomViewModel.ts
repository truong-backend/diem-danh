import { useState, useEffect } from 'react'
import { classroomService } from '../services/classroom.service'
import type { ClassRoom, CreateClassRoomPayload } from '../models/classroom.model'
import type { User } from '../models/user.model'
import toast from 'react-hot-toast'

export function useClassRoomViewModel() {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setClasses(await classroomService.list())
    } catch {
      toast.error('Không thể tải danh sách lớp')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createClass = async (data: CreateClassRoomPayload) => {
    try {
      await classroomService.create(data)
      toast.success('Tạo lớp học thành công')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo lớp thất bại')
      return false
    }
  }

  const updateClass = async (classId: string, data: CreateClassRoomPayload) => {
    try {
      await classroomService.update(classId, data)
      toast.success('Cập nhật lớp học thành công')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật lớp thất bại')
      return false
    }
  }

  const deleteClass = async (classId: string) => {
    try {
      await classroomService.delete(classId)
      toast.success('Đã xoá lớp học')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xoá lớp thất bại')
      return false
    }
  }

  return { classes, loading, createClass, updateClass, deleteClass, reload: load }
}

export function useClassDetailViewModel(classId: string) {
  const [classRoom, setClassRoom] = useState<ClassRoom | null>(null)
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!classId) return
    setLoading(true)
    try {
      const [cr, sv] = await Promise.all([
        classroomService.getOne(classId),
        classroomService.getStudents(classId),
      ])
      setClassRoom(cr)
      setStudents(sv)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải thông tin lớp')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (classId) load() }, [classId])

  const enroll = async (studentId: string) => {
    try {
      await classroomService.enroll(classId, studentId)
      toast.success('Đã thêm sinh viên vào lớp')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thêm sinh viên thất bại')
    }
  }

  const unenroll = async (studentId: string) => {
    try {
      await classroomService.unenroll(classId, studentId)
      toast.success('Đã xoá sinh viên khỏi lớp')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xoá sinh viên thất bại')
    }
  }

  return { classRoom, students, loading, enroll, unenroll, reload: load }
}
