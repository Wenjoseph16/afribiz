'use client';

import { useEffect } from 'react';
import { Settings, ChevronRight, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationList } from '@/components/notifications/NotificationList';
import { AnalyticsKpiCards } from '@/components/notifications/AnalyticsKpiCards';
import { useNotificationStore } from '@/store/notificationStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function NotificationsPage() {
  const { fetchNotifications, fetchUnreadCount, unreadCount, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications(50);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const { data: analyticsData } = useQuery({
    queryKey: ['notification-analytics'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications/stats');
        return (res.data.data ?? {}) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Communications
              </span>
              <ChevronRight className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-brand uppercase tracking-wider">
                Notifications
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft" />
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                </motion.div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos notifications et préférences de communication
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-brand transition-all text-xs font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tout marquer lu</span>
              </button>
            )}
            <Link
              href="/dashboard/notifications/preferences"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
            >
              <Settings className="h-4 w-4 transition-transform group-hover:rotate-45 duration-300" />
              <span className="hidden sm:inline">Préférences</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Analytics KPI */}
      <AnimatePresence>
        {analyticsData && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10 }}
          >
            <AnalyticsKpiCards summary={analyticsData as any} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification List */}
      <motion.div variants={itemVariants}>
        <Card padding="lg" className="overflow-hidden">
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <NotificationList />
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
