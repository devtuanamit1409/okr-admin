export const handleLogout = () => {
  console.log("Logging out...");
  // Xử lý xóa token hoặc thông tin người dùng khỏi localStorage/sessionStorage
  localStorage.removeItem("token");

  // Chuyển hướng người dùng về trang đăng nhập hoặc trang chủ
  window.location.href = "/";
};
