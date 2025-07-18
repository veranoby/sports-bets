import React, { memo } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "../admin/AdminSidebar";

const AdminLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

AdminLayout.displayName = "AdminLayout";

export default AdminLayout;
