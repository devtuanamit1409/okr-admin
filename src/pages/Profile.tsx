import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Row, Col, message } from "antd";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import { useFetchUser } from "../hooks/useFetchUser";
import api from "../services/api";

const Profile: React.FC = () => {
  const { user } = useFetchUser(); // Lấy thông tin user từ hook
  const [profileLoading, setProfileLoading] = useState(false); // Loading state cho form thông tin cá nhân
  const [passwordLoading, setPasswordLoading] = useState(false); // Loading state cho form đổi mật khẩu
  const [form] = Form.useForm(); // Form quản lý cập nhật thông tin
  const [passwordForm] = Form.useForm(); // Form quản lý đổi mật khẩu

  // Khi user thay đổi, set giá trị cho form
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        phone: user.phone,
        email: user.email,
      });
    }
  }, [user]);

  // Hàm cập nhật thông tin cá nhân
  const handleUpdateProfile = async (values: any) => {
    try {
      setProfileLoading(true); // Set loading chỉ cho form cập nhật thông tin

      // Gửi payload trực tiếp (không cần bọc trong "data")
      await api.put(`/users/${user?.id}`, values);

      message.success("Thông tin cá nhân đã được cập nhật.");
    } catch (error: any) {
      console.error("Error updating profile:", error.response || error.message);

      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Không thể cập nhật thông tin. Vui lòng thử lại.");
      }
    } finally {
      setProfileLoading(false); // Tắt loading của form thông tin cá nhân
    }
  };

  // Hàm xử lý đổi mật khẩu
  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setPasswordLoading(true); // Bắt đầu trạng thái loading
      const response = await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        password: values.newPassword,
        passwordConfirmation: values.confirmPassword,
      });

      // Kiểm tra kết quả từ backend
      if (response.status === 200) {
        message.success("Mật khẩu đã được thay đổi.");
        passwordForm.resetFields();
      } else {
        throw new Error("Không thể đổi mật khẩu, thử lại sau.");
      }
    } catch (error: any) {
      console.error("Lỗi đổi mật khẩu:", error);

      if (error.response?.data?.error?.message) {
        // Hiển thị lỗi cụ thể từ backend
        message.error(error.response.data.error.message);
      } else {
        message.error("Đã xảy ra lỗi, vui lòng thử lại.");
      }
    } finally {
      setPasswordLoading(false); // Dừng trạng thái loading
    }
  };

  return (
    <AppLayout pageTitle="Thông tin cá nhân" onLogout={handleLogout}>
      <div className="p-6 bg-gray-50">
        <Row gutter={[16, 16]}>
          {/* Form Thông tin cá nhân */}
          <Col xs={24} lg={12}>
            <Card title="Thông tin cá nhân" bordered>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
              >
                <Form.Item label="Username">
                  <Input value={user?.username} disabled />
                </Form.Item>
                <Form.Item label="Vị trí">
                  <Input
                    value={user?.postion?.name || "Không xác định"}
                    disabled
                  />
                </Form.Item>
                <Form.Item
                  name="name"
                  label="Họ và tên"
                  rules={[
                    { required: true, message: "Vui lòng nhập họ và tên" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    {
                      pattern: /^[0-9]{10,11}$/,
                      message: "Số điện thoại không hợp lệ",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={profileLoading}
                  >
                    Cập nhật thông tin
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Form Đổi mật khẩu */}
          <Col xs={24} lg={12}>
            <Card title="Đổi mật khẩu" bordered>
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
              >
                <Form.Item
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập mật khẩu hiện tại",
                    },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  rules={[
                    { required: true, message: "Vui lòng nhập lại mật khẩu" },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={passwordLoading}
                  >
                    Đổi mật khẩu
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
};

export default Profile;
