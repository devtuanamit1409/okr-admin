import React, { useState, useEffect } from "react";
import {
  Layout,
  Dropdown,
  Menu,
  Typography,
  Avatar,
  Spin,
  Switch,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useFetchUser } from "../hooks/useFetchUser";
import api from "../services/api"; // Import hàm gọi API

const { Header } = Layout;

interface HeaderProps {
  pageTitle: string;
  onLogout: () => void;
}

const HeaderBar: React.FC<HeaderProps> = ({ pageTitle }) => {
  const { user, loading } = useFetchUser(); // Gọi hook để lấy thông tin người dùng
  const [isGuideEnabled, setIsGuideEnabled] = useState<boolean | null>(null); // Bắt đầu với null để phân biệt khi chưa có dữ liệu

  useEffect(() => {
    if (user) {
      setIsGuideEnabled(user?.isInstruct ?? false); // Đồng bộ `isGuideEnabled` với giá trị từ `user`
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleGuideSwitchChange = async (checked: boolean) => {
    setIsGuideEnabled(checked); // Cập nhật ngay trong giao diện

    try {
      await api.put(`/users/${user?.id}`, {
        isInstruct: checked,
      });
      window.location.reload();
    } catch (error) {
      console.error("Không thể cập nhật trạng thái hướng dẫn:", error);
      // Hoàn tác trạng thái nếu có lỗi
      setIsGuideEnabled(!checked);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  if (loading || isGuideEnabled === null) {
    // Hiển thị spinner nếu đang load dữ liệu hoặc `isGuideEnabled` chưa được khởi tạo
    return (
      <Header
        style={{
          position: "fixed",
          top: 0,
          left: "15%",
          right: 0,
          background: "#fff",
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "64px",
          padding: "0 24px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Spin size="large" />
      </Header>
    );
  }

  return (
    <Header
      style={{
        position: "fixed",
        top: 0,
        left: "15%",
        right: 0,
        background: "#fff",
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Tiêu đề trang */}
      <Typography.Title level={4} style={{ margin: 0 }}>
        {pageTitle}
      </Typography.Title>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tooltip title="Bật/Tắt chế độ hướng dẫn">
            <QuestionCircleOutlined
              style={{ color: "#1890ff", fontSize: "18px", cursor: "pointer" }}
            />
          </Tooltip>
          <Switch
            checked={isGuideEnabled ?? false} // Nếu chưa có giá trị, mặc định là false
            onChange={handleGuideSwitchChange}
            checkedChildren="Bật hướng dẫn"
            unCheckedChildren="Tắt hướng dẫn"
          />
        </div> */}

        {/* Dropdown tài khoản */}
        <Dropdown overlay={menu} placement="bottomRight" arrow>
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <Avatar
              size="large"
              icon={<UserOutlined />}
              style={{ marginRight: 8 }}
            />
            <Typography.Text strong>{user?.name || "N/A"}</Typography.Text>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
