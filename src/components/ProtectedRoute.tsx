import React from "react";
import { Navigate } from "react-router-dom";
import { useFetchUser } from "../hooks/useFetchUser";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useFetchUser();
  console.log(user?.postion?.isAdmin);

  // Kiểm tra nếu user không phải admin
  if (user && !user?.postion?.isAdmin) {
    return <Navigate to="/task" replace />; // Chuyển hướng về "/task"
  }

  return <>{children}</>; // Render nội dung nếu là admin
};

export default ProtectedRoute;
