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
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import { InfoCircleOutlined } from "@ant-design/icons";

dayjs.extend(customParseFormat);
interface TaskRecord {
  id: string;
  title: string;
  description: string;
  isImportant?: boolean; // Đảm bảo thêm isImportant vào kiểu dữ liệu
  [key: string]: any; // Nếu có thêm thuộc tính khác
}

const ManagentTask: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Lấy ID user từ URL param
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
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

      const userTasks = response.data.data?.tasks || [];

      // Lọc task theo ngày
      const filteredTasks = userTasks.filter((task: any) => {
        const taskDate = dayjs(task.createdAt).format("YYYY-MM-DD");
        return taskDate === date;
      });

      // Sắp xếp theo thứ tự:
      // 1. Task có `isImportant` lên đầu
      // 2. Task có `Tags` = "Done" tiếp theo
      // 3. Các task còn lại
      const sortedTasks = filteredTasks.sort((a: any, b: any) => {
        if (a.isImportant && !b.isImportant) return -1; // isImportant lên đầu
        if (!a.isImportant && b.isImportant) return 1;
        if (a.Tags === "Done" && b.Tags !== "Done") return -1; // Tags = "Done" tiếp theo
        if (a.Tags !== "Done" && b.Tags === "Done") return 1;
        return 0; // Giữ nguyên thứ tự nếu không thuộc các điều kiện trên
      });

      setTasks(sortedTasks); // Cập nhật danh sách task
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
      render: (text: string) => text || "Chưa xác định",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "Chưa xác định",
    },
    {
      title: "Tiến độ",
      dataIndex: "progess",
      key: "progess",
      render: (progress: number) =>
        progress !== undefined ? (
          <Progress
            percent={progress || 0}
            size="small"
            status={progress === 100 ? "success" : "active"}
          />
        ) : (
          "Chưa xác định"
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
        return <Tag color={color}>{tag || "Chưa xác định"}</Tag>;
      },
    },
    {
      title: "Thời gian hoàn thành",
      dataIndex: "completion_time",
      key: "completion_time",
      render: (text: string) =>
        text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "Chưa xác định",
    },
    {
      title: "Lặp lại mỗi ngày",
      dataIndex: "repeat",
      key: "repeat",
      render: (repeat: boolean) =>
        repeat !== undefined ? (repeat ? "Có" : "Không") : "Chưa xác định",
    },
    {
      title: "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      render: (deadline: string) =>
        deadline ? dayjs(deadline).format("YYYY-MM-DD HH:mm") : "Chưa xác định",
    },
    {
      title: "Giờ hoàn thành",
      dataIndex: "hours",
      key: "hours",
      render: (hours: number) =>
        hours !== undefined ? `${hours} giờ` : "Chưa xác định",
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
          rowClassName={(record) =>
            (record.isImportant ? "important-task" : "") || ""
          }
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
              label={
                <span>
                  Tiêu đề{" "}
                  <Tooltip title="Nhập tiêu đề của task!">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", marginLeft: 4 }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề task" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label={
                <span>
                  Mô tả{" "}
                  <Tooltip title="Nhập mô tả chi tiết về nhiệm vụ!">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", marginLeft: 4 }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập mô tả task" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="repeat"
              valuePropName="checked"
              label={
                <span>
                  Lặp lại mỗi ngày{" "}
                  <Tooltip title="Bật nếu nhiệm vụ lặp lại hàng ngày!">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", marginLeft: 4 }}
                    />
                  </Tooltip>
                </span>
              }
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="isImportant"
              valuePropName="checked"
              label={
                <span>
                  Quan trọng{" "}
                  <Tooltip title="Đánh dấu nhiệm vụ là quan trọng!">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", marginLeft: 4 }}
                    />
                  </Tooltip>
                </span>
              }
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="deadline"
              label={
                <span>
                  Hạn chót{" "}
                  <Tooltip title="Chọn hạn chót hoàn thành nhiệm vụ!">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", marginLeft: 4 }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[{ message: "Vui lòng chọn thời hạn" }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              name="hours"
              label={
                <span>
                  Giờ hoàn thành{" "}
                  <Tooltip title="Nhập thời gian dự kiến hoàn thành nhiệm vụ (tính bằng phút)!">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", marginLeft: 4 }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[{ message: "Vui lòng nhập giờ hoàn thành" }]}
            >
              <Input type="number" min={0} />
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
