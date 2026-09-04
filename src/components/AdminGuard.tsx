import { Navigate } from "react-router-dom";
import { isAdminUnlocked } from "@/lib/adminAuth";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  if (!isAdminUnlocked()) return <Navigate to="/gate" replace />;
  return <>{children}</>;
};

export default AdminGuard;
