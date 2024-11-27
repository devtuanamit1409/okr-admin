import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  DatePicker,
  message,
  Tag,
  Progress,
  Modal,
  Form,
  Input,
  Button,
  Checkbox,
} from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";

dayjs.extend(customParseFormat);

const ManagentTask: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Lấy ID user từ URL param
  const [tasks, setTasks] = useState([]); // State lưu trữ danh sách task
  const [loading, setLoading] = useState(false); // Loading state
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Ngày được chọn, mặc định là ngày hiện tại
  const [isModalVisible, setIsModalVisible] = useState(false); // Hiển thị modal
  const [form] = Form.useForm(); // Form quản lý thêm task

  // Hàm lấy danh sách task theo user và ngày
  const fetchTasks = async (date: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${id}`, {
        params: {
          populate: "tasks", // Populate tasks để lấy danh sách task
        },
      });

      const userTasks = response.data.data.tasks || [];
      // Lọc task theo ngày
      const filteredTasks = userTasks.filter((task: any) => {
        const taskDate = dayjs(task.createdAt).format("YYYY-MM-DD");
        return taskDate === date; // Chỉ lấy task có ngày khớp với ngày được chọn
      });

      setTasks(filteredTasks);
    } catch (error) {
      message.error("Không thể tải danh sách công việc. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi người dùng chọn ngày khác
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const formattedDate = date.format("YYYY-MM-DD");
      setSelectedDate(date);
      fetchTasks(formattedDate);
    }
  };

  // Gọi API lần đầu khi component được mount
  useEffect(() => {
    fetchTasks(selectedDate.format("YYYY-MM-DD"));
  }, [id]); // Chỉ chạy khi ID user thay đổi

  // Hàm xử lý gửi dữ liệu thêm task
  const handleAddTask = async (values: any) => {
    try {
      await api.post("/tasks", {
        data: {
          ...values,
          idUser: id, // Gắn user ID cho task
        },
      });
      message.success("Task đã được thêm thành công!");
      setIsModalVisible(false); // Đóng modal
      form.resetFields(); // Reset form
      fetchTasks(selectedDate.format("YYYY-MM-DD")); // Reload task list
    } catch (error) {
      message.error("Không thể thêm task. Vui lòng thử lại sau.");
    }
  };

  // Định nghĩa cột của bảng
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Tiến độ",
      dataIndex: "progess",
      key: "progess",
      render: (progress: number) => (
        <Progress
          percent={progress || 0} // Hiển thị tiến độ với giá trị mặc định là 0 nếu không có
          size="small"
          status={progress === 100 ? "success" : "active"} // Đổi màu khi đạt 100%
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "Tags",
      key: "Tags",
      render: (tag: string) => {
        let color;
        switch (tag) {
          case "Done":
            color = "green";
            break;
          case "None":
            color = "red";
            break;
          case "In progress":
            color = "blue";
            break;
          case "Pending":
            color = "orange";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{tag || "N/A"}</Tag>; // Hiển thị tag với màu phù hợp hoặc N/A nếu không có
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Thời gian hoàn thành",
      dataIndex: "completion_time",
      key: "completion_time",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Lặp lại mỗi ngày",
      dataIndex: "repeat",
      key: "repeat",
      render: (repeat: boolean) => (repeat ? "Có" : "Không"),
    },
  ];

  return (
    <AppLayout pageTitle={`Quản lý công việc`} onLogout={handleLogout}>
      <div>
        <h3>Danh sách công việc</h3>
        <Button
          type="primary"
          style={{ marginBottom: 16 }}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm Task
        </Button>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          style={{ marginBottom: 16, marginLeft: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={false} // Tắt phân trang vì task đã lọc theo ngày
        />
        <Modal
          title="Thêm Task"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleAddTask}>
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề task" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả task" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="repeat"
              valuePropName="checked"
              label="Lặp lại mỗi ngày"
            >
              <Checkbox />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Thêm Task
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default ManagentTask;
