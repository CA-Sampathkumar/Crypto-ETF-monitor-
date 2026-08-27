import React, { useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Newspaper,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AppNotification, ETFApplication, NotificationCategory } from "../types";
import { notificationAudio } from "../services/notificationAudioService";

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectEtfByTicker?: (ticker: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectEtfByTicker,
  onNavigateToTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"ALL" | NotificationCategory>("ALL");
  const [soundEnabled, setSoundEnabled] = useState(notificationAudio.isSoundEnabled());
  const [desktopEnabled, setDesktopEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === "ALL") return true;
    return n.category === activeCategory;
  });

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationAudio.setSoundEnabled(next);
    if (next) {
      notificationAudio.playChime("APPROVAL");
    }
  };

  const handleEnableDesktopNotifications = async () => {
    const granted = await notificationAudio.requestBrowserNotificationPermission();
    setDesktopEnabled(granted);
    if (granted) {
      notificationAudio.sendDesktopNotification(
        "Crypto ETF Filing Notifications Enabled",
        "You will receive live alerts whenever an ETF is filed, approved, or withdrawn."
      );
      notificationAudio.playChime("NEWS");
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    onMarkAsRead(item.id);
    if (item.relatedTicker && onSelectEtfByTicker) {
      onSelectEtfByTicker(item.relatedTicker);
      setIsOpen(false);
    } else if (item.category === "NEWS" && onNavigateToTab) {
      onNavigateToTab("news");
      setIsOpen(false);
    } else if (onNavigateToTab) {
      onNavigateToTab("today");
      setIsOpen(false);
    }
  };

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case "APPROVAL":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "FILING":
        return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
      case "WITHDRAWAL":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case "NEWS":
        return <Newspaper className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Radio className="w-4 h-4 text-neutral-400 shrink-0" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Live Regulatory & Market Notifications"
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-[#222222] border-emerald-500/50 text-white"
            : unreadCount > 0
            ? "bg-[#141414] hover:bg-[#1f1f1f] border-[#2c2c2c] text-emerald-400"
            : "bg-[#101010] hover:bg-[#181818] border-[#222222] text-[#888888] hover:text-white"
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-emerald-400 animate-wiggle" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-black shadow-lg shadow-emerald-500/30">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-12 z-50 w-[92vw] sm:w-[460px] max-h-[85vh] bg-[#0c0c0c] border border-[#242424] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-[#111111] border-b border-[#202020] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Regulatory &amp; Filing Alerts
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#888888]">
                    Real-time SEC EDGAR filings, approvals, withdrawals &amp; breaking news
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Audio chime toggle */}
                <button
                  onClick={handleToggleSound}
                  title={soundEnabled ? "Audio chime on (Click to mute)" : "Audio chime muted (Click to enable)"}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    soundEnabled
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-[#181818] text-[#666666] border-[#2a2a2a]"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#202020] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Category Filter Chips */}
            <div className="px-3 py-2 bg-[#090909] border-b border-[#1c1c1c] flex items-center justify-between gap-1 text-[11px] overflow-x-auto">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCategory("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                    activeCategory === "ALL"
                      ? "bg-[#222222] text-white font-semibold"
                      : "text-[#888888] hover:text-[#cccccc]"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveCategory("APPROVAL")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                    activeCategory === "APPROVAL"
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold"
                      : "text-[#888888] hover:text-emerald-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Approvals
                </button>
                <button
                  onClick={() => setActiveCategory("FILING")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                    activeCategory === "FILING"
                      ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-semibold"
                      : "text-[#888888] hover:text-cyan-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Filings
                </button>
                <button
                  onClick={() => setActiveCategory("WITHDRAWAL")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                    activeCategory === "WITHDRAWAL"
                      ? "bg-amber-950/60 text-amber-300 border border-amber-500/40 font-semibold"
                      : "text-[#888888] hover:text-amber-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Withdrawals
                </button>
                <button
                  onClick={() => setActiveCategory("NEWS")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                    activeCategory === "NEWS"
                      ? "bg-purple-950/60 text-purple-300 border border-purple-500/40 font-semibold"
                      : "text-[#888888] hover:text-purple-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  News
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                  className="text-[10px] text-emerald-400 hover:underline shrink-0 pl-2 font-medium"
                >
                  Mark read
                </button>
              )}
            </div>

            {/* Quick Actions / Desktop Notification Banner */}
            {!desktopEnabled && typeof window !== "undefined" && "Notification" in window && (
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-950/40 to-neutral-900 border-b border-[#202020] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Get push notifications when filings are approved</span>
                </div>
                <button
                  onClick={handleEnableDesktopNotifications}
                  className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Enable
                </button>
              </div>
            )}

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#181818] max-h-[380px]">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-[#666666] text-xs">
                  <Bell className="w-7 h-7 mx-auto mb-2 opacity-30 text-[#aaaaaa]" />
                  <p>No notifications in this category</p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 hover:bg-[#141414] transition-colors cursor-pointer flex gap-3 group relative ${
                      !item.isRead ? "bg-[#0e1610]/40" : ""
                    }`}
                  >
                    {!item.isRead && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    )}

                    <div className="mt-0.5">{getCategoryIcon(item.category)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.relatedTicker && (
                            <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] text-[#e0e0e0] text-[10px] font-mono font-bold border border-[#2a2a2a]">
                              {item.relatedTicker}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              item.category === "APPROVAL"
                                ? "text-emerald-400"
                                : item.category === "WITHDRAWAL"
                                ? "text-amber-400"
                                : item.category === "FILING"
                                ? "text-cyan-400"
                                : "text-purple-400"
                            }`}
                          >
                            {item.category === "APPROVAL"
                              ? "SEC Order Approved"
                              : item.category === "WITHDRAWAL"
                              ? "Filing Withdrawn"
                              : item.category === "FILING"
                              ? "New S-1/19b-4 Filed"
                              : "Breaking Wire"}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#666666] shrink-0 font-mono">
                          {item.timeAgo}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h4>

                      <p
                        className="text-[11px] text-[#888888] mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: item.message }}
                      />

                      {item.valueUsd && item.valueUsd > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#181818] text-emerald-400 border border-[#262626]">
                            Est. Worth: ${(item.valueUsd / 1e6).toFixed(1)}M USD
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 bg-[#0a0a0a] border-t border-[#1c1c1c] flex items-center justify-between text-xs text-[#888888]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#666666]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SEC EDGAR Live Alerts</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 text-[11px] text-[#777777] hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
