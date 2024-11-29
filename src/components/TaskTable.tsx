import React, { useState } from "react";
import { Table, Tag, Progress, Tooltip } from "antd";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { InfoCircleOutlined, DragOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../styles/TaskTable.css"; // Import CSS for styles

// Define interfaces for tasks and columns
interface Task {
  id: string;
  title: string;
  progess: number;
  Tags: string;
  deadline: string;
}

interface Column {
  title: string;
  dataIndex: keyof Task;
  key: string;
  render?: (value: any) => React.ReactNode;
}

const TaskTable: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([
    {
      title: "Trạng thái",
      dataIndex: "Tags",
      key: "Tags",
      render: (tag: string) => {
        let color: string;
        switch (tag) {
          case "Done":
            color = "green";
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
        return <Tag color={color}>{tag}</Tag>;
      },
    },
    {
      title: "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      render: (deadline: string) =>
        deadline ? dayjs(deadline).format("YYYY-MM-DD HH:mm") : "Chưa xác định",
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
      title: "Mô tả",
      dataIndex: "title",
      key: "title",
    },
  ]);

  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Task 1",
      progess: 50,
      Tags: "In progress",
      deadline: "2024-11-30T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      progess: 100,
      Tags: "Done",
      deadline: "2024-12-01T00:00:00Z",
    },
    {
      id: "3",
      title: "Task 3",
      progess: 20,
      Tags: "Pending",
      deadline: "2024-12-02T00:00:00Z",
    },
  ]);

  // Handle drag-and-drop
  const handleDragEnd = (result: DropResult): void => {
    const { source, destination } = result;

    if (!destination) return;

    const reorderedColumns = Array.from(columns);
    const [removed] = reorderedColumns.splice(source.index, 1);
    reorderedColumns.splice(destination.index, 0, removed);

    setColumns(reorderedColumns);
  };

  return (
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
                  <Draggable key={col.key} draggableId={col.key} index={index}>
                    {(provided, snapshot) => (
                      <th
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                        className={`draggable-header ${
                          snapshot.isDragging ? "dragging-header" : ""
                        }`}
                      >
                        <Tooltip title="Kéo để sắp xếp cột">
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
                        </Tooltip>
                      </th>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, rowIndex) => (
                <tr key={task.id}>
                  {columns.map((col, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`}>
                      {col.render
                        ? col.render(task[col.dataIndex])
                        : task[col.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default TaskTable;
