import { Search } from 'lucide-react'

interface FilterProps {
  search: string
  onSearch: (v: string) => void
  role: string
  onRole: (v: string) => void
}

export function UserFilter({ search, onSearch, role, onRole }: FilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Tìm kiếm tên, email..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      <select className="input w-40" value={role} onChange={e => onRole(e.target.value)}>
        <option value="">Tất cả role</option>
        <option value="ADMIN">Admin</option>
        <option value="TEACHER">Giáo viên</option>
        <option value="STUDENT">Sinh viên</option>
      </select>
    </div>
  )
}