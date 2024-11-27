// src/components/AppLayout.tsx

import React from "react";
import { Layout } from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./Header";

const { Content } = Layout;

interface AppLayoutProps {
  pageTitle: string; // Tiêu đề trang, truyền từ từng page
  children: React.ReactNode; // Nội dung động của từng trang
  onLogout: () => void; // Hàm xử lý đăng xuất
}

const AppLayout: React.FC<AppLayoutProps> = ({
  pageTitle,
  children,
  onLogout,
}) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar cố định */}
      <Sidebar />

      {/* Main Layout */}
      <Layout style={{ marginLeft: "15%" }}>
        {/* Header cố định */}
        <HeaderBar pageTitle={pageTitle} onLogout={onLogout} />

        {/* Content cuộn độc lập */}
        <Content
          style={{
            marginTop: 64, // Tránh chồng lên Header
            padding: 24,
            background: "#fff",
            overflowY: "auto", // Cuộn dọc
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
