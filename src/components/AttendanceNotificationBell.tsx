"use client";

import NotificationManager from "@/components/NotificationManager";

interface AttendanceNotificationBellProps {
  currentUserRole?: "SUPERADMIN" | "ADMIN" | "GURU" | "MURID";
  hidePermissionBanner?: boolean;
}

export default function AttendanceNotificationBell({
  currentUserRole = "SUPERADMIN",
  hidePermissionBanner = true,
}: AttendanceNotificationBellProps) {
  return (
    <NotificationManager
      currentUserRole={currentUserRole}
      hidePermissionBanner={hidePermissionBanner}
      onNavigateToApproval={() => {
        if (typeof window !== "undefined") {
          window.location.hash = "#approval";
        }
      }}
    />
  );
}
