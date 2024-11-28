import React, { useState, useEffect } from "react";
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
import { useFetchUser } from "../hooks/useFetchUser";
import "../styles/Loading.css";

dayjs.extend(customParseFormat);

const Task: React.FC = () => {
  const { user } = useFetchUser(); // Lấy thông tin người dùng hiện tại
  const id = user?.id; // Lấy ID user từ thông tin user
  const [tasks, setTasks] = useState([]); // State lưu trữ danh sách task
  const [loading, setLoading] = useState(false); // Loading state
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Ngày được chọn, mặc định là ngày hiện tại
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); // Hiển thị modal chỉnh sửa task
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false); // Hiển thị modal cập nhật tiến độ
  const [currentTask, setCurrentTask] = useState<any>(null); // Lưu trữ task hiện tại để chỉnh sửa hoặc cập nhật tiến độ
  const [form] = Form.useForm(); // Form quản lý thêm task
  const [editForm] = Form.useForm(); // Form quản lý chỉnh sửa task
  const [progressForm] = Form.useForm(); // Form quản lý cập nhật tiến độ
  const [isModalVisible, setIsModalVisible] = useState(false); // Hiển thị modal
  const [hoursWork, setHoursWork] = useState(0);

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

      // Cộng dồn trường hours
      const totalHours = sortedTasks.reduce((sum: number, task: any) => {
        return sum + (task.hours || 0); // Nếu task không có hours, mặc định là 0
      }, 0);

      setTasks(sortedTasks); // Cập nhật danh sách task
      setHoursWork(totalHours); // Cập nhật tổng thời gian làm việc
    } catch (error) {
      message.error("Không thể tải danh sách công việc. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API lần đầu khi component được mount
  useEffect(() => {
    if (id) {
      fetchTasks(selectedDate.format("YYYY-MM-DD"));
    }
  }, [id]);

  // Hàm xử lý khi người dùng chọn ngày khác
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const formattedDate = date.format("YYYY-MM-DD");
      setSelectedDate(date);
      fetchTasks(formattedDate);
    }
  };

  // Hàm xử lý cập nhật tiến độ
  const handleUpdateProgress = async (values: any) => {
    if (!currentTask) return;
    try {
      await api.put(`/tasks/${currentTask.id}`, {
        data: {
          progess: values.progess,
        },
      });
      message.success("Tiến độ đã được cập nhật.");
      setIsProgressModalVisible(false);
      fetchTasks(selectedDate.format("YYYY-MM-DD"));
    } catch (error) {
      message.error("Không thể cập nhật tiến độ. Vui lòng thử lại sau.");
    }
  };

  // Hàm xử lý chỉnh sửa task
  const handleEditTask = async (values: any) => {
    if (!currentTask) return;
    try {
      await api.put(`/tasks/${currentTask.id}`, {
        data: values,
      });
      message.success("Task đã được cập nhật.");
      setIsEditModalVisible(false);
      fetchTasks(selectedDate.format("YYYY-MM-DD"));
    } catch (error) {
      message.error("Không thể cập nhật task. Vui lòng thử lại sau.");
    }
  };

  // Hàm xử lý xóa task
  const handleDeleteTask = async (taskId: number) => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn xóa task này không?",
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/tasks/${taskId}`);
          message.success("Task đã được xóa.");
          fetchTasks(selectedDate.format("YYYY-MM-DD")); // Làm mới danh sách task
        } catch (error) {
          message.error("Không thể xóa task. Vui lòng thử lại sau.");
        }
      },
    });
  };

  // hàm thêm task
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

  const handleStartTask = async (taskId: number) => {
    try {
      await api.put(`/tasks/${taskId}`, {
        data: {
          startAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
      });
      message.success("Task đã được bắt đầu.");
      fetchTasks(selectedDate.format("YYYY-MM-DD"));
    } catch (error) {
      message.error("Không thể bắt đầu task. Vui lòng thử lại sau.");
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
          percent={progress || 0}
          size="small"
          status={progress === 100 ? "success" : "active"}
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
        return <Tag color={color}>{tag || "N/A"}</Tag>;
      },
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "startAt",
      key: "startAt",
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
    {
      title: "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      render: (deadline: string) => dayjs(deadline).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Giờ hoàn thành",
      dataIndex: "hours",
      key: "hours",
      render: (hours: number) => `${hours} giờ`,
    },
    {
      title: "Thời gian thực",
      dataIndex: "timeDone",
      key: "timeDone",
      render: (timeDone: number) => `${timeDone} `,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: any) => (
        <>
          <Button
            type="primary"
            danger
            disabled={record.startAt} // Disable nếu task đã được bắt đầu
            onClick={() => {
              handleStartTask(record.id);
            }}
          >
            Thực hiện
          </Button>
          <Button
            type="link"
            onClick={() => {
              setCurrentTask(record);
              editForm.setFieldsValue({
                ...record,
                deadline: record.deadline ? dayjs(record.deadline) : null, // Chuyển đổi deadline thành Dayjs object
              });
              setIsEditModalVisible(true);
            }}
          >
            Chỉnh sửa
          </Button>

          <Button
            disabled={record.progess === 100} // Disable nếu tiến độ đã đạt 100%
            type="link"
            onClick={() => {
              setCurrentTask(record);
              progressForm.setFieldsValue({ progess: record.progess });
              setIsProgressModalVisible(true);
            }}
          >
            Cập nhật tiến độ
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteTask(record.id)} // Gọi hàm xóa với xác nhận
          >
            Xóa
          </Button>
        </>
      ),
    },
  ];

  return (
    <AppLayout
      pageTitle={`Task của tôi - ${user?.name}`}
      onLogout={handleLogout}
    >
      <Button
        type="primary"
        style={{ marginBottom: 16 }}
        onClick={() => setIsModalVisible(true)}
      >
        Thêm Task
      </Button>
      <div style={{ marginBottom: 16 }}>
        <strong>Tổng thời gian làm việc: {hoursWork} giờ</strong>
      </div>
      <div>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={false}
          rowClassName={(record) =>
            record.isImportant ? "important-task" : ""
          }
        />

        {/* Modal chỉnh sửa */}
        <Modal
          title="Chỉnh sửa Task"
          visible={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditTask}>
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
            <Form.Item name="repeat" valuePropName="checked" label="Lặp lại">
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="isImportant"
              valuePropName="checked"
              label="Quan trọng"
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="deadline"
              label="Hạn chót"
              rules={[{ message: "Vui lòng chọn thời hạn" }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
            {/* Trường giờ hoàn thành */}
            <Form.Item
              name="hours"
              label="Giờ hoàn thành"
              rules={[{ message: "Vui lòng nhập giờ hoàn thành" }]}
            >
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        {/* Modal cập nhật tiến độ */}
        <Modal
          title="Cập nhật tiến độ"
          visible={isProgressModalVisible}
          onCancel={() => setIsProgressModalVisible(false)}
          footer={null}
        >
          <Form
            form={progressForm}
            layout="vertical"
            onFinish={handleUpdateProgress}
          >
            <Form.Item
              name="progess"
              label="Tiến độ (%) (từ 0 đến 100)"
              rules={[{ required: true, message: "Vui lòng nhập tiến độ" }]}
            >
              <Input type="number" max={100} min={0} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Modal>

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
            <Form.Item
              name="isImportant"
              valuePropName="checked"
              label="Quan trọng"
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="deadline"
              label="Hạn chót"
              rules={[{ required: true, message: "Vui lòng chọn thời hạn" }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
            {/* Trường giờ hoàn thành */}
            <Form.Item
              name="hours"
              label="Giờ hoàn thành"
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

export default Task;
