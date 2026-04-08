import { useState, useEffect } from "react";
import { userService } from "../services/user.service";
import type { User } from "../models/user.model";
import type { PageResponse } from "../models/report.model";
import { useDebounce } from "../hooks/useDebounce";
import toast from "react-hot-toast";

export function useUserViewModel() {
  const [data, setData] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const load = async () => {
    setLoading(true);
    try {
      const res = await userService.list({
        role: role || undefined,
        search: debouncedSearch || undefined,
        page,
        size: 20,
      });
      setData(res);
    } catch {
      toast.error("Không thể tải danh sách user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [debouncedSearch, role, page]);

  const createUser = async (payload: any) => {
    try {
      await userService.create(payload);
      toast.success("Tạo user thành công");
      await load();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tạo user thất bại");
      return false;
    }
  };

  const updateUser = async (userId: string, payload: any) => {
    try {
      await userService.update(userId, payload);
      toast.success("Cập nhật user thành công");
      await load();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
      return false;
    }
  };

  // Vô hiệu hóa (active = false) - gọi DELETE endpoint (BE set active=false)
  const disableUser = async (userId: string) => {
    try {
      await userService.deactivateUser(userId);
      toast.success("Đã vô hiệu hóa user");
      await load();
    } catch {
      toast.error("Vô hiệu hóa thất bại");
    }
  };
  const activateUser = async (userId: string) => {
    try {
      await userService.activate(userId);
      toast.success("Đã kích hoạt lại user");
      await load();
    } catch {
      toast.error("Kích hoạt thất bại");
    }
  };


  // Xóa cứng - gọi endpoint xóa thật (cần BE thêm endpoint này)
  // Hiện tại BE chỉ có soft-delete, nên dùng cùng endpoint nhưng UI tách riêng
  // Khi BE thêm DELETE thật, chỉ cần đổi service call ở đây
  const deleteUser = async (userId: string) => {
    try {
      await userService.hardDelete(userId);
      toast.success("Đã xóa user");
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    }
  };

  return {
    data,
    loading,
    search,
    setSearch,
    role,
    setRole,
    page,
    setPage,
    createUser,
    updateUser,
    disableUser,
    deleteUser,
    activateUser,
    reload: load,
  };
}
