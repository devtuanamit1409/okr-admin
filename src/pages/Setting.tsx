import React, { useState, useEffect } from "react";
import { Switch, Typography, Tooltip, Card, Spin, message } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { useFetchUser } from "../hooks/useFetchUser";
import api from "../services/api";
import { handleLogout } from "../helper/authHelpers";

const Setting: React.FC = () => {
  const { user, loading } = useFetchUser(); // Lấy thông tin user từ hook
  const [isGuideEnabled, setIsGuideEnabled] = useState<boolean | null>(null); // Trạng thái bật/tắt hướng dẫn

  useEffect(() => {
    if (user) {
      setIsGuideEnabled(user.isInstruct ?? false); // Đồng bộ giá trị từ user
    }
  }, [user]);

  const handleGuideSwitchChange = async (checked: boolean) => {
    setIsGuideEnabled(checked); // Cập nhật ngay trong giao diện
    try {
      await api.put(`/users/${user?.id}`, { isInstruct: checked });
      message.success("Cập nhật chế độ hướng dẫn thành công!");
    } catch (error) {
      console.error("Không thể cập nhật trạng thái hướng dẫn:", error);
      message.error("Cập nhật thất bại. Vui lòng thử lại.");
      setIsGuideEnabled(!checked); // Hoàn tác nếu cập nhật thất bại
    }
  };

  if (loading || isGuideEnabled === null) {
    // Hiển thị spinner nếu đang load dữ liệu hoặc `isGuideEnabled` chưa được khởi tạo
    return (
      <AppLayout pageTitle="Cài đặt" onLogout={handleLogout}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Cài đặt" onLogout={handleLogout}>
      <Card
        style={{
          maxWidth: 600,
          margin: "24px auto",
          padding: "16px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography.Title level={4}>Cài đặt chung</Typography.Title>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tooltip title="Bật/Tắt chế độ hướng dẫn">
              <QuestionCircleOutlined
                style={{
                  color: "#1890ff",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
            <Typography.Text>Chế độ hướng dẫn</Typography.Text>
          </div>
          <Switch
            checked={isGuideEnabled ?? false}
            onChange={handleGuideSwitchChange}
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
          />
        </div>
      </Card>
    </AppLayout>
  );
};

export default Setting;
