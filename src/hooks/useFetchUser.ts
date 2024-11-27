import { useEffect, useState } from "react";
import api from "../services/api";
interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  phone?: string; // Có thể tùy chọn nếu không bắt buộc
  name?: string; // Tên hiển thị
  role?: {
    id: number;
    name: string;
    description: string;
    type: string;
  };
  postion?: {
    id: number;
    name: string;
    isAdmin: string;
  };
}
export const useFetchUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        // Gán token vào header Authorization
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await api.get("/users/me?populate=role,postion");
        setUser(response.data); // Lưu thông tin người dùng
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null); // Đặt user null nếu không thể lấy thông tin
      } finally {
        setLoading(false); // Kết thúc trạng thái loading
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};
