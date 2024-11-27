import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Checkbox,
} from "antd";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import api from "../services/api";

interface Position {
  id: number;
  name: string;
  isAdmin: boolean;
}

const Position: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]); // Danh sách vị trí
  const [loading, setLoading] = useState(false); // Trạng thái loading
  const [isModalVisible, setIsModalVisible] = useState(false); // Hiển thị modal
  const [editingPosition, setEditingPosition] = useState<Position | null>(null); // Dữ liệu chỉnh sửa
  const [form] = Form.useForm(); // Form quản lý thêm/sửa vị trí
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
  const [pageSize, setPageSize] = useState(10); // Số mục trên mỗi trang
  const [total, setTotal] = useState(0); // Tổng số mục

  // Lấy danh sách vị trí từ API
  const fetchPositions = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await api.get("/postions", {
        params: {
          pagination: { page, pageSize },
        },
      });
      const data = response.data.data.map((item: any) => ({
        id: item.id,
        ...item.attributes,
      }));
      setPositions(data);
      setTotal(response.data.meta.pagination.total); // Tổng số mục
    } catch (error) {
      message.error("Không thể tải danh sách vị trí.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi gửi form thêm/sửa
  const handleSubmit = async (values: any) => {
    try {
      if (editingPosition) {
        // Chỉnh sửa vị trí
        await api.put(`/postions/${editingPosition.id}`, { data: values });
        message.success("Vị trí đã được cập nhật.");
      } else {
        // Thêm mới vị trí
        await api.post("/postions", { data: values });
        message.success("Vị trí đã được thêm.");
      }
      fetchPositions(currentPage, pageSize); // Làm mới danh sách
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Không thể lưu vị trí. Vui lòng thử lại.");
    }
  };

  // Hàm xử lý xóa vị trí
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn xóa vị trí này không?",
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/postions/${id}`);
          message.success("Vị trí đã được xóa.");
          fetchPositions(currentPage, pageSize); // Làm mới danh sách
        } catch (error) {
          message.error("Không thể xóa vị trí. Vui lòng thử lại.");
        }
      },
    });
  };

  // Hiển thị modal thêm/sửa
  const openModal = (position?: Position) => {
    setEditingPosition(position || null);
    setIsModalVisible(true);
    if (position) {
      form.setFieldsValue(position);
    } else {
      form.resetFields();
    }
  };

  // Xử lý khi chuyển trang
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Lấy danh sách vị trí khi component được mount hoặc phân trang thay đổi
  useEffect(() => {
    fetchPositions(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Cột của bảng
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Tên vị trí",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Admin",
      dataIndex: "isAdmin",
      key: "isAdmin",
      render: (isAdmin: boolean) => (isAdmin ? "Có" : "Không"),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: Position) => (
        <>
          <Button type="link" onClick={() => openModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa vị trí này không?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Quản lý vị trí" onLogout={handleLogout}>
      <div>
        <Button
          type="primary"
          style={{ marginBottom: 16 }}
          onClick={() => openModal()}
        >
          Thêm Vị Trí
        </Button>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={positions}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange} // Xử lý phân trang
        />
        <Modal
          title={editingPosition ? "Chỉnh sửa Vị Trí" : "Thêm Vị Trí"}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Tên vị trí"
              rules={[{ required: true, message: "Vui lòng nhập tên vị trí" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="isAdmin" valuePropName="checked" label="Admin">
              <Checkbox>Đây là vị trí Admin</Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Lưu
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Position;
