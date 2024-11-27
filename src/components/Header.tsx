import React from "react";
import { Layout, Dropdown, Menu, Typography, Avatar, Spin } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useFetchUser } from "../hooks/useFetchUser";

const { Header } = Layout;

interface HeaderProps {
  pageTitle: string;
  onLogout: () => void;
}

const HeaderBar: React.FC<HeaderProps> = ({ pageTitle }) => {
  const { user, loading } = useFetchUser(); // Gọi hook để lấy thông tin người dùng

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  if (loading) {
    // Hiển thị spinner nếu đang load dữ liệu
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
    </Header>
  );
};

export default HeaderBar;
