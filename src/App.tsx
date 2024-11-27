import "./styles/App.css";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import ManagentTask from "./pages/ManagentTask";
import Task from "./pages/Task";
import Position from "./pages/Position";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        {/* Route không cần bảo vệ */}
        <Route element={<Login />} path="/" />
        <Route element={<Task />} path="/task" />
        <Route element={<Profile />} path="/profile" />

        {/* Route dành riêng cho admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/managent-task/:id"
          element={
            <ProtectedRoute>
              <ManagentTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/position"
          element={
            <ProtectedRoute>
              <Position />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
