"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  ExternalLink,
  CheckCircle2,
  FileText,
  User,
  GraduationCap,
  Clock,
  Sparkles,
} from "lucide-react";

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderRole: "GURU" | "MURID" | "ADMIN" | "SUPERADMIN";
  status: "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR";
  kelas?: string | null;
  notes?: string | null;
  attendanceId?: string | null;
  isRead?: boolean;
  createdAt: string;
}

interface NotificationManagerProps {
  currentUserRole?: "SUPERADMIN" | "ADMIN" | "GURU" | "MURID";
  onNavigateToApproval?: () => void;
  /** Sembunyikan modal izin notifikasi (hanya tampil bell icon) */
  hidePermissionBanner?: boolean;
}

export default function NotificationManager({
  currentUserRole,
  onNavigateToApproval,
  hidePermissionBanner = false,
}: NotificationManagerProps) {
  // Hanya aktif untuk Superadmin dan Admin
  const isPrivileged = currentUserRole === "SUPERADMIN" || currentUserRole === "ADMIN";

  const [toasts, setToasts] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<RealtimeNotification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPermissionBannerVisible, setIsPermissionBannerVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fungsi mendaftarkan Service Worker & Subscribe Web Push
  const registerServiceWorkerAndSubscribe = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      setIsSubscribing(true);
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!sub && vapidPublicKey) {
        // Konversi key VAPID urlBase64 ke Uint8Array
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      if (sub) {
        // Kirim subscription ke backend untuk disimpan di Neon
        await fetch("/api/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            userAgent: navigator.userAgent,
          }),
        });
      }
    } catch (err) {
      console.warn("Registrasi Push Notification gagal atau dibatalkan:", err);
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  // 1. Cek Dukungan Push Notification & Status Izin
  useEffect(() => {
    if (!isPrivileged || typeof window === "undefined") return;

    const timer = setTimeout(() => {
      if ("Notification" in window) {
        const isDismissed = sessionStorage.getItem("notif_permission_dismissed") === "true";
        if (Notification.permission === "default" && !isDismissed) {
          // Tampilkan banner izin di tengah layar
          setIsPermissionBannerVisible(true);
        } else if (Notification.permission === "granted") {
          // Jika sudah diizinkan, daftarkan subscription Web Push
          registerServiceWorkerAndSubscribe();
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isPrivileged, registerServiceWorkerAndSubscribe]);

  const handleDismissBanner = () => {
    setIsPermissionBannerVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("notif_permission_dismissed", "true");
    }
  };

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Browser Anda tidak mendukung push notification.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsPermissionBannerVisible(false);
        await registerServiceWorkerAndSubscribe();
      } else {
        setIsPermissionBannerVisible(false);
      }
    } catch (e) {
      console.error("Izin notifikasi gagal:", e);
    }
  };

  // 2. Polling Realtime Notifikasi (Setiap 5 detik)
  useEffect(() => {
    if (!isPrivileged) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?limit=25");
        if (!res.ok) return;

        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);

        if (Array.isArray(data.notifications)) {
          setNotificationsList(data.notifications);

          // Cek apakah ada notifikasi baru untuk memicu Pop-Up Toast
          if (data.notifications.length > 0) {
            const newest = data.notifications[0];
            if (!lastSeenIdRef.current) {
              // Pertama kali fetch saat halaman dibuka:
              // Tampilkan toast jika ada notifikasi belum dibaca yang baru (< 10 menit lalu)
              const now = new Date().getTime();
              const freshUnread = data.notifications.filter((n: RealtimeNotification) => {
                if (n.isRead) return false;
                const createdTime = new Date(n.createdAt).getTime();
                return now - createdTime < 10 * 60 * 1000;
              });

              if (freshUnread.length > 0) {
                setToasts(freshUnread.slice(0, 3));
              }
            } else if (lastSeenIdRef.current !== newest.id) {
              // Ada notifikasi baru yang masuk saat admin sedang membuka halaman!
              const newItems = data.notifications.filter(
                (n: RealtimeNotification) => n.id !== lastSeenIdRef.current && !n.isRead
              );

              if (newItems.length > 0) {
                if ("vibrate" in navigator) {
                  navigator.vibrate([100, 50, 100]);
                }
                setToasts((prev) => [...newItems, ...prev].slice(0, 4));
              }
            }
            lastSeenIdRef.current = newest.id;
          }
        }
      } catch (err) {
        console.error("Polling notifikasi error:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [isPrivileged]);

  // Hapus toast setelah beberapa detik
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tandai sudah dibaca
  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDetail = (notif: RealtimeNotification) => {
    markAsRead(notif.id);
    dismissToast(notif.id);
    setIsDropdownOpen(false);
    if (onNavigateToApproval) {
      onNavigateToApproval();
    }
  };

  if (!isPrivileged) return null;

  // Konten modal izin notifikasi (di-portal ke document.body agar selalu di center)
  const permissionModalContent =
    isPermissionBannerVisible && !hidePermissionBanner ? (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 max-w-sm w-full mx-auto space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 leading-snug">
                Aktifkan Notifikasi di HP Anda?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dapatkan info langsung saat ada murid &amp; guru yang mengisi presensi, izin, atau sakit tanpa perlu membuka aplikasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDismissBanner}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-2xs"
            >
              Nanti
            </button>
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={isSubscribing}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aktifkan</span>
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // Konten toast notifikasi (di-portal ke document.body agar tidak ter-clip)
  const toastContent =
    toasts.length > 0 ? (
      <div className="fixed top-1/2 -translate-y-1/2 left-4 right-4 sm:top-4 sm:translate-y-0 sm:left-auto sm:right-4 z-[9998] flex flex-col gap-2.5 max-w-sm sm:w-full mx-auto sm:mx-0 pointer-events-none px-2 sm:px-0">
        {toasts.map((toast) => {
          const isMurid = toast.senderRole === "MURID";
          const isHadir = toast.status === "HADIR";
          const isIzin = toast.status === "IZIN";
          const isSakit = toast.status === "SAKIT";

          return (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-sky-100 shadow-sky-200/50 space-y-3 animate-in zoom-in-95 sm:slide-in-from-right-8 duration-300 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isHadir
                        ? "bg-emerald-100 text-emerald-700"
                        : isIzin
                        ? "bg-amber-100 text-amber-700"
                        : isSakit
                        ? "bg-rose-100 text-rose-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {isHadir ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isIzin || isSakit ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </span>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-800 leading-tight">
                      {toast.title.replace("🔔 ", "")}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      {new Date(toast.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 transition p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Data Detail Pengguna */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 text-[11px] space-y-1 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                    {isMurid ? <GraduationCap className="w-3 h-3 text-sky-600" /> : <User className="w-3 h-3 text-emerald-600" />}
                    {toast.senderName}
                  </span>
                  <span className="font-semibold text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {toast.senderRole} {toast.kelas ? `• ${toast.kelas}` : ""}
                  </span>
                </div>
                <div className="text-slate-600 leading-relaxed font-medium">
                  <span className="font-bold text-slate-700">Status: </span>
                  <span
                    className={`font-extrabold ${
                      isHadir
                        ? "text-emerald-600"
                        : isIzin
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {toast.status}
                  </span>
                  {toast.notes && (
                    <span className="text-slate-500 block truncate">
                      Ket: {toast.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 rounded-lg transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDetail(toast)}
                  className="px-3 py-1 text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition flex items-center gap-1"
                >
                  <span>Lihat Detail</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    ) : null;

  return (
    <>
      {/* Portal modal & toast ke document.body agar di tengah layar penuh mobile dan tidak terganggu overflow/parent */}
      {mounted && permissionModalContent && createPortal(permissionModalContent, document.body)}
      {mounted && toastContent && createPortal(toastContent, document.body)}

      {/* 3. TOMBOL LONCENG NOTIFICATION CENTER (FLOATING ATAU EMBEDDED DI NAV) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative p-2.5 rounded-2xl bg-white border border-sky-100 shadow-xs hover:bg-sky-50 transition text-slate-600 hover:text-sky-600"
          title="Pusat Notifikasi Presensi"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Modal Mengapung (Floating Bottom Sheet di Mobile & Popover Mengapung di Desktop) */}
        {isDropdownOpen &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-start justify-center sm:justify-end sm:p-6 pointer-events-auto">
              {/* Backdrop klik di luar untuk menutup */}
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Panel Konten Notifikasi Mengapung */}
              <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sky-100 z-10 overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-top-3 sm:zoom-in-95 duration-200 mb-0 sm:mt-12 sm:mr-4 max-h-[85vh] flex flex-col">
                {/* Header Dropdown */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Pusat Notifikasi
                      </h4>
                      <p className="text-[10px] text-slate-400">Pemberitahuan aktivitas terbaru</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-sky-100 text-sky-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full ml-1">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 transition px-2 py-1 rounded-md hover:bg-sky-50"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      aria-label="Tutup notifikasi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Opsi Cepat: Aktifkan Push Notification HP jika belum aktif */}
                <div className="bg-sky-50/70 border-b border-sky-100 p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700">Push Notifikasi HP</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={isSubscribing}
                    className="px-2.5 py-1 text-[10px] font-extrabold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
                  >
                    {isSubscribing ? "Mengaktifkan..." : "Aktifkan di HP"}
                  </button>
                </div>

                {/* List Notifikasi */}
                <div className="overflow-y-auto divide-y divide-slate-100 flex-1 overscroll-contain">
                  {notificationsList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto opacity-50" />
                      <p>Belum ada notifikasi aktivitas presensi.</p>
                    </div>
                  ) : (
                    notificationsList.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleOpenDetail(n)}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 active:bg-slate-100 ${
                          !n.isRead ? "bg-sky-50/40" : ""
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                            n.status === "HADIR"
                              ? "bg-emerald-100 text-emerald-700"
                              : n.status === "IZIN"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {n.senderName ? n.senderName.charAt(0).toUpperCase() : "U"}
                        </span>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {n.senderName}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600">
                            {n.title.replace("🔔 ", "")} •{" "}
                            <span className="font-extrabold text-sky-600">
                              {n.status}
                            </span>
                          </p>
                          {n.notes && (
                            <p className="text-[10px] text-slate-400 truncate">
                              &ldquo;{n.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 self-center"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
}

// Helper untuk konversi VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

