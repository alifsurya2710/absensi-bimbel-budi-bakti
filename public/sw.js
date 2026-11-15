// Service Worker untuk Push Notification FORSIREMIS
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Menangani pesan push dari Web Push Server
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "🔔 Notifikasi FORSIREMIS";
    const options = {
      body: data.body || "Aktivitas presensi baru diterima.",
      icon: data.icon || "/logo-forsiremis.png",
      badge: data.badge || "/logo-forsiremis.png",
      vibrate: [300, 150, 300],
      tag: data.data?.approvalStatus
        ? `approval-${Date.now()}`
        : data.data?.notificationId || "presensi-update",
      renotify: true,
      requireInteraction: true,
      data: {
        url: data.url || "/attendance",
        ...data.data,
      },
      actions: [
        {
          action: "open",
          title: "Buka Aplikasi",
        },
        {
          action: "close",
          title: "Tutup",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Gagal mem-parsing payload push:", err);
  }
});

// Menangani klik pada notifikasi
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Jika tab sudah terbuka, bawa ke depan dan navigasikan
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Jika belum terbuka, buka window baru
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
