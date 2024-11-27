import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Spin } from "antd"; // Sử dụng Spin của Ant Design để hiển thị loading

const withAuth = (WrappedComponent: React.FC) => {
  const AuthenticatedComponent: React.FC = (props) => {
    const [loading, setLoading] = useState(true); // Trạng thái loading
    const navigate = useNavigate();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          await api.get("/users/me"); // Gọi API để xác thực token
        } catch (error) {
          console.error("Not authenticated:", error);
          navigate("/"); // Chuyển về trang login nếu không hợp lệ
        } finally {
          setLoading(false); // Tắt trạng thái loading sau khi xác thực
        }
      };

      checkAuth();
    }, [navigate]);

    // Hiển thị loading spinner trong khi xác thực
    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Spin size="large" />
        </div>
      );
    }

    // Hiển thị WrappedComponent sau khi xác thực xong
    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
