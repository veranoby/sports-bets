// frontend/src/components/layouts/OperatorLayout.tsx
import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import OperatorHeader from "../operator/OperatorHeader";
import Breadcrumbs from "../shared/Breadcrumbs";

const OperatorLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OperatorHeader />
      <Breadcrumbs />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
});

OperatorLayout.displayName = "OperatorLayout";

export default OperatorLayout;
