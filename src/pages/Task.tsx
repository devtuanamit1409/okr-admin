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
  Space,
  Select,
} from "antd";
import utc from "dayjs/plugin/utc"; // Import plugin utc

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import { useFetchUser } from "../hooks/useFetchUser";
import EditOutlined from "@ant-design/icons/EditOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import "../styles/Loading.css";
import {
  DragOutlined,
  PlusOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "../styles/TaskTable.css";

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
interface Task {
  id: string;
  title: string;
  progess: number;
  Tags: string;
  deadline: string;
  description: string; // Thuộc tính cần thiết
  [key: string]: any; // Các thuộc tính bổ sung
}

interface Column {
  title: React.ReactNode;
  dataIndex?: keyof Task;
  key: string;
  render?: (value: any, record?: Task) => React.ReactNode;
}

dayjs.extend(customParseFormat);

dayjs.extend(utc); // Kích hoạt plugin utc

const Task: React.FC = () => {
  const { user } = useFetchUser(); // Lấy thông tin người dùng hiện tại

  const id = user?.id; // Lấy ID user từ thông tin user
  const [tasks, setTasks] = useState<Task[]>([]); // State lưu trữ danh sách task
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
  const [goalDaily, setGoalDaily] = useState<any[]>([]);
  const [currentGoal, setCurrentGoal] = useState<any>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditGoalModalVisible, setIsEditGoalModalVisible] = useState(false);
  const [goalForm] = Form.useForm();
  const [filteredGoals, setFilteredGoals] = useState<any[]>(goalDaily);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [showTooltips, setShowTooltips] = useState<boolean>(false);
  const [columns, setColumns] = useState<Column[]>([]);
  useEffect(() => {
    setShowTooltips(user?.isInstruct ?? false); // Kiểm tra giá trị `isInstruct`
  }, [user?.isInstruct]);

  const generateColumns = (showTooltips: boolean): Column[] => [
    {
      title: showTooltips ? (
        <Tooltip title="Mô tả ngắn gọn về nhiệm vụ">
          <span>
            Mô tả{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Mô tả</span>
      ),
      dataIndex: "title",
      key: "title",
      render: (text: string) => text || "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Tiến độ hoàn thành của nhiệm vụ">
          <span>
            Tiến độ{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Tiến độ</span>
      ),
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
      title: showTooltips ? (
        <Tooltip title="Trạng thái hiện tại của nhiệm vụ">
          <span>
            Trạng thái{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Trạng thái</span>
      ),
      dataIndex: "Tags",
      key: "Tags",
      render: (tag: string) => {
        let color;
        let translatedTag;
        switch (tag) {
          case "Done":
            color = "green";
            translatedTag = "Hoàn thành";
            break;
          case "None":
            color = "red";
            translatedTag = "Chưa bắt đầu";
            break;
          case "In progress":
            color = "blue";
            translatedTag = "Đang thực hiện";
            break;
          case "Pending":
            color = "orange";
            translatedTag = "Đang chờ xử lý";
            break;
          default:
            color = "default";
            translatedTag = "Chưa xác định";
        }
        return <Tag color={color}>{translatedTag}</Tag>;
      },
    },
    {
      title: showTooltips ? (
        <Tooltip title="Thời gian bắt đầu nhiệm vụ">
          <span>
            Thời gian bắt đầu{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Thời gian bắt đầu</span>
      ),
      dataIndex: "startAt",
      key: "startAt",
      render: (text: string) =>
        text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Thời gian hoàn thành nhiệm vụ">
          <span>
            Thời gian hoàn thành{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Thời gian hoàn thành</span>
      ),
      dataIndex: "completion_time",
      key: "completion_time",
      render: (text: string) =>
        text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Nhiệm vụ có lặp lại mỗi ngày không">
          <span>
            Lặp lại mỗi ngày{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Lặp lại mỗi ngày</span>
      ),
      dataIndex: "repeat",
      key: "repeat",
      render: (repeat: boolean) =>
        repeat !== undefined ? (repeat ? "Có" : "Không") : "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Hạn chót hoàn thành nhiệm vụ">
          <span>
            Hạn chót{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Hạn chót</span>
      ),
      dataIndex: "deadline",
      key: "deadline",
      render: (deadline: string) =>
        deadline ? dayjs(deadline).format("YYYY-MM-DD HH:mm") : "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Tổng số giờ hoàn thành nhiệm vụ dự kiến">
          <span>
            Giờ dự kiến{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Giờ dự kiến</span>
      ),
      dataIndex: "hours",
      key: "hours",
      render: (hours: number) =>
        hours !== null ? `${hours} giờ` : "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Thời gian thực tế hoàn thành nhiệm vụ">
          <span>
            Giờ thực tế{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Giờ thực tế</span>
      ),
      dataIndex: "timeDone",
      key: "timeDone",
      render: (timeDone: number) =>
        timeDone !== null ? `${timeDone}` : "Chưa xác định",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Các hành động có thể thực hiện trên nhiệm vụ này">
          <span>
            Hành động{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Hành động</span>
      ),
      key: "actions",
      render: (_: any, record: any) => (
        <>
          <Button
            type="primary"
            danger
            disabled={record.Tags == "In progress" || record.Tags == "Done"}
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
                deadline: record.deadline ? dayjs(record.deadline) : null,
              });
              setIsEditModalVisible(true);
            }}
          >
            Chỉnh sửa
          </Button>
          <Button
            disabled={record.Tags == "Done"}
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
            onClick={() => handleDeleteTask(record.id)}
          >
            Xóa
          </Button>
        </>
      ),
    },
  ];

  const generateGoalDailyColumns = (showTooltips: boolean): Column[] => [
    {
      title: showTooltips ? (
        <Tooltip title="Mục tiêu cần theo dõi">
          <span>
            Tên mục tiêu{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Tên mục tiêu</span>
      ),
      dataIndex: "name",
      key: "name",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Mô tả về mục tiêu">
          <span>
            Mô tả{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Mô tả</span>
      ),
      dataIndex: "description",
      key: "description",
    },
    {
      title: showTooltips ? (
        <Tooltip title="Mục tiêu để đo lường">
          <span>
            Đo lường ( đơn vị đo lường ){" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Đo lường ( đơn vị đo lường )</span>
      ),
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number) => {
        const formattedQuantity = new Intl.NumberFormat("en-US").format(
          quantity
        );
        return <span>{formattedQuantity}</span>;
      },
    },
    {
      title: showTooltips ? (
        <Tooltip title="Tiến độ hoàn thành">
          <span>
            Tiến độ (%){" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Tiến độ (%)</span>
      ),
      dataIndex: "progess",
      key: "progess",
      render: (progess: number) => (
        <Progress
          percent={progess || 0}
          size="small"
          status={progess === 100 ? "success" : "active"}
        />
      ),
    },
    {
      title: showTooltips ? (
        <Tooltip title="Thao tác có thể thực hiện">
          <span>
            Hành động{" "}
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginLeft: 4, cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ) : (
        <span>Hành động</span>
      ),
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditGoalClick(record)}
          >
            Sửa
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteGoal(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    setColumns(generateColumns(showTooltips));
  }, [showTooltips]);

  const handleDragEnd = (result: DropResult): void => {
    const { source, destination } = result;

    if (!destination) return;

    const reorderedColumns = Array.from(columns);
    const [removed] = reorderedColumns.splice(source.index, 1);
    reorderedColumns.splice(destination.index, 0, removed);

    setColumns(reorderedColumns);
  };
  const handleAddGoal = async (values: any) => {
    try {
      const newGoal = {
        ...values,
        progess: 0, // Mặc định tiến độ = 0
      };

      // Thêm mục tiêu mới vào danh sách hiện tại
      const updatedGoals = [...goalDaily, newGoal];

      // Gửi danh sách cập nhật lên API
      await api.put(`/users/${user?.id}`, {
        goalDaily: updatedGoals,
      });

      // Cập nhật trực tiếp state `goalDaily`
      window.location.reload();
      message.success("Thêm mục tiêu thành công!");
      setIsAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Lỗi khi thêm mục tiêu:", error);
      message.error("Không thể thêm mục tiêu. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    if (user) {
      setGoalDaily(user.goalDaily || []); // Cập nhật goalDaily từ user
    }
  }, [user, handleAddGoal]);

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

  const handleEditGoalClick = (goal: any) => {
    setCurrentGoal(goal);
    goalForm.setFieldsValue(goal); // Sử dụng form riêng cho goalDaily
    setIsEditGoalModalVisible(true); // Mở modal sửa mục tiêu
  };

  const handleDeleteGoal = async (goalId: string) => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn xóa mục tiêu này không?",
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const updatedGoals = goalDaily.filter((goal) => goal.id !== goalId);
          await api.put(`/users/${user?.id}`, { goalDaily: updatedGoals });
          setGoalDaily(updatedGoals);
          message.success("Xóa mục tiêu thành công!");
          window.location.reload();
        } catch (error) {
          message.error("Không thể xóa mục tiêu. Vui lòng thử lại sau.");
        }
      },
    });
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

      // Lọc goalDaily dựa trên ngày
      const filtered = goalDaily.filter(
        (goal) => dayjs(goal.createdAt).format("YYYY-MM-DD") === formattedDate
      );
      setFilteredGoals(filtered); // Cập nhật danh sách mục tiêu hiển thị

      // Gọi fetchTasks để cập nhật danh sách nhiệm vụ
      fetchTasks(formattedDate);
    } else {
      // Nếu không chọn ngày, hiển thị tất cả mục tiêu
      setFilteredGoals(goalDaily);
    }
  };

  useEffect(() => {
    setFilteredGoals(goalDaily);
  }, [goalDaily]);

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
      const updatedValues = { ...values };

      // Định dạng lại trường deadline
      if (updatedValues.deadline) {
        updatedValues.deadline = updatedValues.deadline.format(
          "YYYY-MM-DD HH:mm:ss"
        );
      }

      // Đảm bảo trường hours là số
      if (updatedValues.hours) {
        updatedValues.hours = Number(updatedValues.hours);
      }

      // Định dạng lại các trường ngày giờ khác nếu cần
      // ...

      await api.put(`/tasks/${currentTask.id}`, {
        data: updatedValues,
      });
      message.success("Task đã được cập nhật.");
      setIsEditModalVisible(false);
      fetchTasks(selectedDate.format("YYYY-MM-DD"));
    } catch (error) {
      console.error("Lỗi khi cập nhật task:", error);
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
          window.location.reload();
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
      // Lưu thời gian hiện tại dưới dạng UTC
      const utcTime = dayjs().utc().format("YYYY-MM-DD HH:mm:ss");

      await api.put(`/tasks/${taskId}`, {
        data: {
          startAt: utcTime,
        },
      });

      message.success("Task đã được bắt đầu.");
      // fetchTasks(selectedDate.format("YYYY-MM-DD"))
      window.location.reload();
    } catch (error) {
      message.error("Không thể bắt đầu task. Vui lòng thử lại sau.");
    }
  };

  const handleEditGoal = async (values: any) => {
    if (!currentGoal) return;
    try {
      const updatedGoals = goalDaily.map((goal) =>
        goal.id === currentGoal.id ? { ...goal, ...values } : goal
      );
      await api.put(`/users/${user?.id}`, { goalDaily: updatedGoals });
      setGoalDaily(updatedGoals);
      window.location.reload();
      message.success("Cập nhật mục tiêu thành công!");
      setIsEditGoalModalVisible(false); // Đóng modal sửa goalDaily
      goalForm.resetFields(); // Reset form goalDaily
    } catch (error) {
      message.error("Không thể cập nhật mục tiêu. Vui lòng thử lại sau.");
    }
  };

  const goalDailyColumns = generateGoalDailyColumns(showTooltips);

  const handleExpandRow = (rowKey: string) => {
    if (expandedRowKeys.includes(rowKey)) {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));
    } else {
      setExpandedRowKeys([...expandedRowKeys, rowKey]);
    }
  };
  return (
    <AppLayout
      pageTitle={`Task của tôi - ${user?.name}`}
      onLogout={handleLogout}
    >
      <DatePicker
        value={selectedDate}
        onChange={handleDateChange}
        format="YYYY-MM-DD"
        style={{ marginBottom: 16 }}
      />
      <div
        className="py-4"
        style={{
          marginTop: 16,
          padding: "20px",
          backgroundColor: "#f6f8fa",
          borderRadius: "8px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          border: "3px solid #ff0000",
        }}
      >
        <h3
          style={{
            marginBottom: 16,
            fontSize: "20px",
            fontWeight: "bold",
            color: "#1890ff",
            textAlign: "center",
          }}
        >
          🌟 Mục tiêu ngày
        </h3>{" "}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginBottom: 16 }}
          onClick={() => setIsAddModalVisible(true)}
        >
          Thêm Mục Tiêu
        </Button>
        {/* modal thêm mục tiêu  */}
        <Modal
          title="Thêm Mục Tiêu Ngày"
          visible={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleAddGoal}>
            <Form.Item
              name="name"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập tên của mục tiêu ngày!">
                    <span>
                      Tên mục tiêu{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Tên mục tiêu</span>
                )
              }
              rules={[
                { required: true, message: "Vui lòng nhập tên mục tiêu" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập mô tả chi tiết của mục tiêu ngày!">
                    <span>
                      Mô tả{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Mô tả</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="quantity"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập số lượng dự kiến để đạt được mục tiêu này!">
                    <span>
                      Số lượng{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Số lượng</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <Input type="number" min={1} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Thêm
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        {/* modal sửa mục tiêu */}
        <Modal
          title="Chỉnh sửa Mục Tiêu Ngày"
          visible={isEditGoalModalVisible}
          onCancel={() => setIsEditGoalModalVisible(false)}
          footer={null}
        >
          <Form form={goalForm} layout="vertical" onFinish={handleEditGoal}>
            <Form.Item
              name="name"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập tên của mục tiêu ngày!">
                    <span>
                      Tên mục tiêu{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Tên mục tiêu</span>
                )
              }
              rules={[
                { required: true, message: "Vui lòng nhập tên mục tiêu" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập mô tả chi tiết của mục tiêu ngày!">
                    <span>
                      Mô tả{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Mô tả</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="quantity"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập số lượng dự kiến để đạt được mục tiêu này!">
                    <span>
                      Số lượng{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Số lượng</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <Input type="number" min={1} />
            </Form.Item>
            <Form.Item
              name="progess"
              label={
                showTooltips ? (
                  <Tooltip title="Nhập tiến độ hoàn thành của mục tiêu này (tính theo phần trăm)!">
                    <span>
                      Tiến độ{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Tiến độ</span>
                )
              }
            >
              <Input type="number" min={0} max={100} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        {/* bảng mục tiêu */}
        <Table
          rowKey="id"
          columns={goalDailyColumns}
          dataSource={filteredGoals} // Dùng danh sách đã được lọc
          loading={loading}
          pagination={false}
          bordered
          style={{
            backgroundColor: "white",
          }}
        />
      </div>

      <Button
        type="primary"
        className="mt-4"
        style={{ marginBottom: 16 }}
        onClick={() => setIsModalVisible(true)}
      >
        Thêm Task
      </Button>
      <div style={{ marginBottom: 16 }}>
        <strong>Tổng thời gian làm việc: {hoursWork} giờ</strong>
      </div>

      <div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
            {(provided) => (
              <table
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="custom-table"
              >
                <thead>
                  <tr>
                    {columns.map((col, index) => (
                      <Draggable
                        key={col.key}
                        draggableId={col.key}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <th
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            className={`draggable-header ${
                              snapshot.isDragging ? "dragging-header" : ""
                            }`}
                          >
                            <span
                              style={{
                                cursor: "grab",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <DragOutlined
                                style={{ marginRight: 8, color: "#888" }}
                              />
                              {col.title}
                            </span>
                          </th>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, rowIndex) => (
                    <>
                      <tr key={rowIndex}>
                        {columns.map((col, colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`}>
                            {col.dataIndex === "title" ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {col.render
                                  ? col.render(task[col.dataIndex!], task)
                                  : task[col.dataIndex!] || "N/A"}
                                {/* Nút mở rộng/thu gọn */}
                                <Button
                                  type="link"
                                  icon={
                                    expandedRowKeys.includes(
                                      String(task.id)
                                    ) ? (
                                      <CaretUpOutlined
                                        style={{ color: "#1890ff" }}
                                      />
                                    ) : (
                                      <CaretDownOutlined
                                        style={{ color: "#1890ff" }}
                                      />
                                    )
                                  }
                                  onClick={() =>
                                    handleExpandRow(String(task.id))
                                  }
                                />
                              </div>
                            ) : col.render ? (
                              col.render(task[col.dataIndex!], task)
                            ) : (
                              task[col.dataIndex!] || "N/A"
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Nội dung mở rộng */}
                      {expandedRowKeys.includes(String(task.id)) && (
                        <tr key={`${rowIndex}-expanded`}>
                          <td colSpan={columns.length}>
                            <div
                              style={{
                                padding: "16px",
                                backgroundColor: "#f9f9f9",
                                border: "1px solid #e8e8e8",
                                borderRadius: "8px",
                              }}
                            >
                              <p className="text-start">
                                <strong>Mô tả chi tiết:</strong>{" "}
                                {task.description || "Không có mô tả"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>

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
              label={
                showTooltips ? (
                  <Tooltip title="Nhập tiêu đề của task!">
                    <span>
                      Tiêu đề{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Tiêu đề</span>
                )
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
                showTooltips ? (
                  <Tooltip title="Nhập mô tả chi tiết về nhiệm vụ!">
                    <span>
                      Mô tả{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Mô tả</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng nhập mô tả task" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="repeat"
              valuePropName="checked"
              label={
                showTooltips ? (
                  <Tooltip title="Bật nếu nhiệm vụ lặp lại hàng ngày!">
                    <span>
                      Lặp lại{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Lặp lại</span>
                )
              }
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="isImportant"
              valuePropName="checked"
              label={
                showTooltips ? (
                  <Tooltip title="Đánh dấu nhiệm vụ là quan trọng!">
                    <span>
                      Quan trọng{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Quan trọng</span>
                )
              }
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="deadline"
              label={
                showTooltips ? (
                  <Tooltip title="Chọn hạn chót hoàn thành nhiệm vụ!">
                    <span>
                      Hạn chót{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Hạn chót</span>
                )
              }
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
                showTooltips ? (
                  <Tooltip title="Nhập thời gian dự kiến hoàn thành nhiệm vụ (tính bằng phút)!">
                    <span>
                      Giờ hoàn thành{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Giờ hoàn thành</span>
                )
              }
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              name="Tags"
              label={
                showTooltips ? (
                  <Tooltip title="Cập nhật trạng thái của nhiệm vụ!">
                    <span>
                      Trạng thái{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Trạng thái</span>
                )
              }
            >
              <Select placeholder="Chọn trạng thái">
                <Select.Option value="None">Chưa bắt đầu</Select.Option>
                <Select.Option value="In progress">
                  Đang thực hiện
                </Select.Option>
                <Select.Option value="Pending">Đang chờ xử lý</Select.Option>
                <Select.Option value="Done">Hoàn thành</Select.Option>
              </Select>
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
              label={
                showTooltips ? (
                  <Tooltip title="Nhập tiến độ hoàn thành của task (từ 0 đến 100)!">
                    <span>
                      Tiến độ (%){" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Tiến độ (%)</span>
                )
              }
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
              label={
                showTooltips ? (
                  <Tooltip title="Nhập tiêu đề của task!">
                    <span>
                      Tiêu đề{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Tiêu đề</span>
                )
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
                showTooltips ? (
                  <Tooltip title="Nhập mô tả chi tiết về nhiệm vụ!">
                    <span>
                      Mô tả{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Mô tả</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng nhập mô tả task" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="repeat"
              valuePropName="checked"
              label={
                showTooltips ? (
                  <Tooltip title="Bật nếu nhiệm vụ lặp lại hàng ngày!">
                    <span>
                      Lặp lại mỗi ngày{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Lặp lại mỗi ngày</span>
                )
              }
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="isImportant"
              valuePropName="checked"
              label={
                showTooltips ? (
                  <Tooltip title="Đánh dấu nhiệm vụ là quan trọng!">
                    <span>
                      Quan trọng{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Quan trọng</span>
                )
              }
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="deadline"
              label={
                showTooltips ? (
                  <Tooltip title="Chọn hạn chót hoàn thành nhiệm vụ!">
                    <span>
                      Hạn chót{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Hạn chót</span>
                )
              }
              rules={[{ required: true, message: "Vui lòng chọn thời hạn" }]}
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
                showTooltips ? (
                  <Tooltip title="Nhập thời gian dự kiến hoàn thành nhiệm vụ (tính bằng phút)!">
                    <span>
                      Giờ hoàn thành{" "}
                      <InfoCircleOutlined
                        style={{ color: "#1890ff", marginLeft: 4 }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span>Giờ hoàn thành</span>
                )
              }
              rules={[{ message: "Vui lòng nhập phút hoàn thành dự kiến" }]}
            >
              <Input
                type="number"
                min={0}
                placeholder="Nhập số phút hoàn thành dự kiến"
              />
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
