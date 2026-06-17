import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import CounselorDetail from "@/pages/CounselorDetail";
import Login from "@/pages/Login";
import RegisterSelect from "@/pages/RegisterSelect";
import RegisterClient from "@/pages/RegisterClient";
import RegisterCounselor from "@/pages/RegisterCounselor";
import Booking from "@/pages/Booking";
import Session from "@/pages/Session";
import ProtectRoute from "@/components/ProtectRoute";
import ClientLayout from "@/pages/ClientLayout";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientPackages from "@/pages/ClientPackages";
import ClientReviews from "@/pages/ClientReviews";
import CounselorLayout from "@/pages/CounselorLayout";
import CounselorDashboard from "@/pages/CounselorDashboard";
import CounselorProfile from "@/pages/CounselorProfile";
import CounselorSchedule from "@/pages/CounselorSchedule";
import CounselorRecords from "@/pages/CounselorRecords";
import { authStore } from "@/store/authStore";

export default function App() {
  useEffect(() => {
    authStore.getState().init();
  }, []);

  return (
    <Router>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/counselor/:id" element={<CounselorDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterSelect />} />
        <Route path="/register/client" element={<RegisterClient />} />
        <Route path="/register/counselor" element={<RegisterCounselor />} />

        {/* 预约与会话 - 双角色均可访问 */}
        <Route element={<ProtectRoute allowedRoles={["client", "counselor"]} />}>
          <Route path="/booking/:counselorId" element={<Booking />} />
          <Route path="/session/:appointmentId" element={<Session />} />
        </Route>

        {/* 来访者中心 */}
        <Route element={<ProtectRoute allowedRoles={["client"]} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="/client/dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="packages" element={<ClientPackages />} />
            <Route path="reviews" element={<ClientReviews />} />
          </Route>
        </Route>

        {/* 咨询师后台 */}
        <Route element={<ProtectRoute allowedRoles={["counselor"]} />}>
          <Route path="/counselor" element={<CounselorLayout />}>
            <Route index element={<Navigate to="/counselor/dashboard" replace />} />
            <Route path="dashboard" element={<CounselorDashboard />} />
            <Route path="profile" element={<CounselorProfile />} />
            <Route path="schedule" element={<CounselorSchedule />} />
            <Route path="records" element={<CounselorRecords />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-50">
              <div className="text-6xl font-serif font-bold text-primary-700">404</div>
              <div className="text-lg">页面不存在</div>
              <a href="/" className="btn-primary mt-4">返回首页</a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
