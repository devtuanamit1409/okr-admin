import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Button,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
} from "antd";
import {
  EditOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import { Link } from "react-router-dom";

const { Option } = Select;

interface PositionDetail {
  createdAt: string;
  isAdmin: boolean;
  name: string;
  publishedAt: string;
  updatedAt: string;
}

interface Position {
  id: number;
  attributes: PositionDetail;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility
  const [form] = Form.useForm();

  const fetchUsers = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await api.get("/users", {
        params: {
          "pagination[page]": page,
          "pagination[pageSize]": pageSize,
          populate: "postion", // Include position relation
        },
      });

      // Extract data and metadata
      const { data, meta } = response.data;

      setUsers(data);
      setPagination({
        current: meta.pagination.page,
        pageSize: meta.pagination.pageSize,
        total: meta.pagination.total,
      });
    } catch (error) {
      message.error("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await api.get("/postions");
      setPositions(response.data.data); // Gán danh sách positions
    } catch (error) {
      message.error("Failed to load positions. Please try again later.");
    }
  };
  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
    fetchPositions();
  }, []);

  const handleAddUser = async (values: any) => {
    try {
      await api.post("/users", {
        ...values,
        password: "123456", // Password mặc định
        role: 1, // Role ID mặc định cho Authenticated
        postion: values.position, // Mapping vị trí
        confirmed: true, // Trạng thái mặc định
        blocked: false, // Trạng thái mặc định
      });
      message.success("User added successfully");
      setIsModalVisible(false); // Đóng modal
      form.resetFields(); // Reset form
      fetchUsers(pagination.current, pagination.pageSize); // Refresh danh sách users
    } catch (error) {
      message.error("Failed to add user. Please try again later.");
    }
  };

  const handleDelete = async (record: any) => {
    try {
      await api.delete(`/users/${record.id}`); // Delete user by ID
      message.success(`User "${record.username}" deleted successfully`);
      fetchUsers(pagination.current, pagination.pageSize); // Refresh list after deletion
    } catch (error) {
      message.error("Failed to delete user. Please try again later.");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điên thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Name",
      dataIndex: "name", // Access the `name` field
      key: "name",
    },
    {
      title: "Ví trí",
      dataIndex: ["postion", "name"], // Access the name of the position from the relation
      key: "position",
      render: (position: string | undefined) => (position ? position : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Chỉnh sửa
          </Button>
          <Link to={`/users/managent-task/${record.id}`}>
            <Button type="default" icon={<UnorderedListOutlined />}>
              Quản lý task
            </Button>
          </Link>

          <Popconfirm
            title={`Bạn có chắc muốn xóa user "${record.username}" không?`}
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    message.info(`Chỉnh sửa user: ${record.username}`);
  };

  const handleManageTasks = (record: any) => {
    message.info(`Quản lý task cho user: ${record.username}`);
  };

  const handleTableChange = (pagination: any) => {
    fetchUsers(pagination.current, pagination.pageSize);
  };
  console.log(positions);

  return (
    <AppLayout pageTitle="Danh sách nhân viên" onLogout={handleLogout}>
      <div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ marginBottom: 16 }}
        >
          Thêm User
        </Button>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
          }}
          onChange={handleTableChange}
        />
        <Modal
          title="Thêm User"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleAddUser}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please enter the username" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter the email" }, // Bắt buộc nhập
                { type: "email", message: "The input is not a valid email!" }, // Kiểm tra định dạng email
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: "Please enter the email" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="name"
              label="Họ và tên"
              rules={[{ required: true, message: "Please enter the name" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="position"
              label="Position"
              rules={[{ required: true, message: "Please select a position" }]}
            >
              <Select placeholder="Chọn vị trí">
                {positions.map((pos) => (
                  <Option key={pos.id} value={pos.id}>
                    {pos?.attributes?.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Thêm
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Users;
