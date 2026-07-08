"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  is_read: number;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;

  const fetchPage = useCallback(async (reset: boolean) => {
    if (reset) {
      offsetRef.current = 0;
      setInitialLoading(true);
    } else {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      setLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/notifications?offset=${offsetRef.current}`);
      if (!res.ok) return;
      const data: {
        notifications: NotificationItem[];
        hasMore: boolean;
        unreadCount: number;
      } = await res.json();

      setNotifications((prev) =>
        reset ? data.notifications : [...prev, ...data.notifications],
      );
      setHasMore(data.hasMore);
      setUnreadCount(data.unreadCount);
      offsetRef.current += data.notifications.length;
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(true);
  }, [fetchPage]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingMoreRef.current || !hasMoreRef.current) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      fetchPage(false);
    }
  }, [fetchPage]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "PATCH" });
  }, []);

  const handleNotificationClick = useCallback(
    (n: NotificationItem) => {
      if (n.is_read === 0) markAsRead(n.id);
      if (n.url) {
        router.push(n.url);
        setIsOpen(false);
      }
    },
    [markAsRead, router],
  );

  return (
    <div
      ref={panelRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3"
    >
      <div
        className={`w-[380px] bg-card border border-border rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-foreground" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={markAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[460px] overflow-y-auto overscroll-contain"
        >
          {initialLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
              <Bell className="w-8 h-8 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`relative flex items-start gap-3 px-4 py-3.5 transition-colors group ${
                    n.is_read === 0
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                      n.is_read === 0 ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(n)}
                  >
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1.5 uppercase tracking-wide">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {n.is_read === 0 && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 w-7 h-7 rounded-full border border-current text-primary/50 hover:text-primary hover:bg-primary/10 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
              ))}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
