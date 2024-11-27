// src/pages/Dashboard.tsx

import React, { useState, useEffect } from "react";
import { Row, Col, message } from "antd";
import { Pie } from "@ant-design/plots";
import AppLayout from "../components/AppLayout";
import { handleLogout } from "../helper/authHelpers";
import api from "../services/api";

interface PositionData {
  type: string;
  value: number;
}

interface TaskStatusData {
  type: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const [positionData, setPositionData] = useState<PositionData[]>([]);
  const [taskStatusData, setTaskStatusData] = useState<TaskStatusData[]>([]);
  const [overdueTaskData, setOverdueTaskData] = useState<TaskStatusData[]>([]);
  const [mainPosition, setMainPosition] = useState([]);

  const fetchPositionMain = async () => {
    try {
      const response = await api.get("/postions", {
        params: {
          pagination: {
            page: 1,
            pageSize: 100, // Lấy tối đa 100 bản ghi, có thể tùy chỉnh
          },
        },
      });
      const positions = response.data.data || []; // Lấy danh sách position
      setMainPosition(positions);
      return positions;
    } catch (error) {
      message.error("Không thể lấy danh sách vị trí. Vui lòng thử lại sau.");
      return [];
    }
  };

  // Hàm lấy dữ liệu thống kê user theo position
  const fetchPositionData = async () => {
    try {
      const response = await api.get("/users", {
        params: {
          populate: "postion",
        },
      });
      const users = response.data.data || [];
      const positionCounts: Record<string, number> = {};

      users.forEach((user: any) => {
        const positionName = user.postion?.name || "Không xác định";
        positionCounts[positionName] = (positionCounts[positionName] || 0) + 1;
      });

      const data = Object.keys(positionCounts).map((key) => ({
        type: key,
        value: positionCounts[key],
      }));

      setPositionData(data);
    } catch (error) {
      message.error("Không thể lấy dữ liệu user theo position.");
    }
  };

  // Hàm lấy dữ liệu thống kê task theo trạng thái
  const fetchTaskStatusData = async () => {
    try {
      const response = await api.get("/tasks");
      const tasks = response.data.data || [];
      const statusCounts: Record<string, number> = {
        None: 0,
        Done: 0,
        "In progress": 0,
        Pending: 0,
      };

      tasks.forEach((task: any) => {
        const status = task.attributes.Tags || "None";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const data = Object.keys(statusCounts).map((key) => ({
        type: key,
        value: statusCounts[key],
      }));

      setTaskStatusData(data);
    } catch (error) {
      message.error("Không thể lấy dữ liệu task theo trạng thái.");
    }
  };

  // Hàm lấy dữ liệu thống kê các task bị trễ
  const fetchOverdueTaskData = async () => {
    try {
      const response = await api.get("/tasks");
      const tasks = response.data.data || [];
      console.log(tasks);

      const now = new Date();

      // Lọc task trễ hạn
      const overdueTasks = tasks.filter((task: any) => {
        const completionTime = task.attributes.completion_time
          ? new Date(task.attributes.completion_time)
          : null;

        // Nếu completion_time null hoặc nhỏ hơn thời gian hiện tại và task chưa hoàn thành
        return (
          (!completionTime || completionTime < now) &&
          task.attributes.Tags !== "Done"
        );
      });

      // Tạo dữ liệu thống kê
      const data = [
        { type: "Đúng hạn", value: tasks.length - overdueTasks.length },
        { type: "Trễ hạn", value: overdueTasks.length },
      ];

      // Cập nhật state
      setOverdueTaskData(data);
    } catch (error) {
      message.error("Không thể lấy dữ liệu task bị trễ.");
    }
  };

  // Gọi API lấy dữ liệu khi component mount
  useEffect(() => {
    fetchPositionData();
    fetchTaskStatusData();
    fetchOverdueTaskData();
    fetchPositionMain();
  }, []);

  return (
    <AppLayout pageTitle="Dashboard" onLogout={handleLogout}>
      <div style={{ padding: "24px" }}>
        <Row gutter={[16, 16]}>
          {/* Biểu đồ tròn thống kê user theo position */}
          <Col xs={24} md={12}>
            <h3 className="text-xl font-semibold text-blue-600 mb-4">
              Thống kê User theo Vị Trí
            </h3>
            <Pie
              data={positionData}
              angleField="value"
              colorField="type"
              radius={0.8}
              legend={{
                position: "bottom",
              }}
              label={{
                type: "spider",
                content: "{name}\n{value}",
                style: {
                  fontSize: 12,
                },
              }}
              height={250}
            />
          </Col>

          {/* Biểu đồ tròn thống kê task theo trạng thái */}
          <Col xs={24} md={12}>
            <h3 className="text-xl font-semibold text-blue-600 mb-4">
              Thống kê Task theo Trạng thái
            </h3>
            <Pie
              data={taskStatusData}
              angleField="value"
              colorField="type"
              radius={0.8}
              legend={{
                position: "bottom",
              }}
              label={{
                type: "spider",
                content: "{name}\n{value}",
                style: {
                  fontSize: 12,
                },
              }}
              height={250}
            />
          </Col>

          {/* Biểu đồ tròn thống kê các task bị trễ */}
          <Col xs={24} md={12}>
            <h3 className="text-xl font-semibold text-blue-600 mb-4">
              Thống kê Task Bị Trễ
            </h3>
            <Pie
              data={overdueTaskData}
              angleField="value"
              colorField="type"
              radius={0.8}
              legend={{
                position: "bottom",
              }}
              label={{
                type: "spider",
                content: "{name}\n{value}",
                style: {
                  fontSize: 12,
                },
              }}
              height={250}
            />
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
