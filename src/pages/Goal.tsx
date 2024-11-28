import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Space,
  Card,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import { useFetchUser } from "../hooks/useFetchUser";
import api from "../services/api";

const { Title } = Typography;

const Goal: React.FC = () => {
  const { user } = useFetchUser(); // Lấy thông tin user từ hook
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("goalWeek");
  const [goals, setGoals] = useState<Record<string, any[]>>({
    goalWeek: [],
    goalPrecious: [],
    goalMonth: [],
    goalYear: [],
  });

  const [isModalVisible, setIsModalVisible] = useState(false); // Trạng thái hiển thị Modal
  const [editingGoal, setEditingGoal] = useState<any | null>(null); // Lưu trữ mục tiêu đang được chỉnh sửa

  useEffect(() => {
    if (user) {
      setGoals({
        goalWeek: user.goalWeek || [],
        goalPrecious: user.goalPrecious || [],
        goalMonth: user.goalMonth || [],
        goalYear: user.goalYear || [],
      });
    }
  }, [user]);

  const handleAddGoal = (values: any) => {
    const newGoal = {
      ...values,
      progress: 0, // Mặc định progress là 0
    };
    setGoals((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newGoal],
    }));
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEditGoal = (values: any) => {
    const updatedGoals = goals[activeTab].map((goal, index) =>
      index === editingGoal.index
        ? { ...values, progress: goal.progress }
        : goal
    );
    setGoals((prev) => ({
      ...prev,
      [activeTab]: updatedGoals,
    }));
    setEditingGoal(null);
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleDeleteGoal = (index: number) => {
    setGoals((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((_, i) => i !== index),
    }));
  };

  const onFinish = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}`, goals);
      message.success("Cập nhật mục tiêu thành công!");
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật mục tiêu!");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const openEditModal = (record: any, index: number) => {
    setEditingGoal({ ...record, index });
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "Tên mục tiêu",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Tiến độ (%)",
      dataIndex: "progress",
      key: "progress",
    },
    {
      title: "Kỳ hạn",
      dataIndex: "period",
      key: "period",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: any, index: number) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record, index)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteGoal(index)}
          />
        </Space>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Mục tiêu cá nhân" onLogout={handleLogout}>
      <Card style={{ margin: "20px auto", padding: 20 }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Mục tiêu cá nhân
        </Title>
        <Tabs
          defaultActiveKey="goalWeek"
          onChange={(key) => {
            setActiveTab(key);
            setEditingGoal(null);
          }}
        >
          {["goalWeek", "goalPrecious", "goalMonth", "goalYear"].map((key) => (
            <Tabs.TabPane
              tab={
                key === "goalWeek"
                  ? "Mục tiêu tuần"
                  : key === "goalPrecious"
                  ? "Mục tiêu quý"
                  : key === "goalMonth"
                  ? "Mục tiêu tháng"
                  : "Mục tiêu năm"
              }
              key={key}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
                onClick={openAddModal}
              >
                Thêm mục tiêu
              </Button>
              <Table
                columns={columns}
                dataSource={goals[key]}
                rowKey={(record) => record.name + record.period}
                pagination={false}
              />
            </Tabs.TabPane>
          ))}
        </Tabs>
        <Modal
          title={editingGoal ? "Chỉnh sửa mục tiêu" : "Thêm mục tiêu"}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              editingGoal ? handleEditGoal(values) : handleAddGoal(values);
            }}
          >
            <Form.Item
              name="name"
              label="Tên mục tiêu"
              rules={[
                { required: true, message: "Vui lòng nhập tên mục tiêu!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="quantity"
              label="Số lượng"
              rules={[{ required: true, message: "Vui lòng nhập số lượng!" }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              name="period"
              label="Kỳ hạn"
              rules={[{ required: true, message: "Vui lòng nhập kỳ hạn!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingGoal ? "Cập nhật" : "Thêm"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button type="primary" onClick={onFinish} loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
};

export default Goal;
