import React, { useState } from "react";
import { Form, Input, Button, Row, Col, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api from "../services/api";

interface LoginFormValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      // Gửi request login
      const response = await api.post("/auth/local", {
        identifier: values.username,
        password: values.password,
      });
      console.log(response);

      message.success("Đăng nhập thành công!");
      localStorage.setItem("token", response.data.jwt);

      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Login error:", error);
      message.error("Đăng nhập thất bại, vui lòng kiểm tra thông tin.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Row justify="center" align="middle" className="min-h-screen bg-gray-100">
      <Col xs={24} sm={20} md={12} lg={8} xl={6}>
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="mx-auto mb-4"
            style={{ maxWidth: "150px", height: "auto" }}
          />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Đăng nhập vào hệ thống OKR
          </h2>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Col>
    </Row>
  );
};

export default Login;
