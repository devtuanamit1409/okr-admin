import React from "react";
import { Layout, Menu } from "antd";
import {
  ClusterOutlined,
  DashboardOutlined,
  HomeOutlined,
  IdcardOutlined,
  ProfileOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom"; // Dùng React Router
import { useFetchUser } from "../hooks/useFetchUser";

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const { user } = useFetchUser();

  const location = useLocation();
  const currentPath = location.pathname;

  // Hàm xác định menu key dựa trên tiền tố URL
  const getMenuKey = () => {
    if (currentPath.startsWith("/users")) return "/users"; // Tiền tố "/users"
    if (currentPath.startsWith("/task")) return "/task"; // Tiền tố "/task"
    if (currentPath.startsWith("/dashboard")) return "/dashboard"; // Tiền tố "/dashboard"
    if (currentPath.startsWith("/position")) return "/position";
    if (currentPath.startsWith("/profile")) return "/profile";

    return ""; // Trường hợp không khớp
  };

  const selectedKey = getMenuKey(); // Xác định key được active

  return (
    <Sider
      width="15%"
      style={{
        position: "fixed",
        height: "100vh",
        top: 0,
        left: 0,
        zIndex: 100,
        background: "#fff",
        boxShadow:
          "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="logo" style={{ padding: "16px", textAlign: "center" }}>
        <img src="/logo.png" width={150} alt="Logo" />
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]} // Dựa trên key tiền tố
        style={{ height: "100%", borderRight: 0 }}
      >
        {/* Tab dành cho mọi user */}
        <Menu.Item key="/task" icon={<ProfileOutlined />}>
          <Link to="/task">Task của tôi</Link>
        </Menu.Item>
        <Menu.Item key="/profile" icon={<IdcardOutlined />}>
          <Link to="/profile">Hồ sơ</Link>
        </Menu.Item>

        {/* Tab chỉ dành cho admin */}
        {user?.postion?.isAdmin && (
          <>
            <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>
              <Link to="/dashboard">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="/users" icon={<TeamOutlined />}>
              <Link to="/users">Danh sách nhân viên</Link>
            </Menu.Item>
            <Menu.Item key="/position" icon={<ClusterOutlined />}>
              <Link to="/position">Quản lý vị trí</Link>
            </Menu.Item>
          </>
        )}
      </Menu>
    </Sider>
  );
};

export default Sidebar;
