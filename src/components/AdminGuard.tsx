import { Navigate } from "react-router-dom";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuth = sessionStorage.getItem("admin_auth") === "1";
  if (!isAuth) return <Navigate to="/gate" replace />;
  return <>{children}</>;
};

export default AdminGuard;
