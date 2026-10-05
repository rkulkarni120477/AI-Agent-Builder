'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchUserSettings, updateUserSettings } from '@/lib/analytics-api'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [theme, setTheme] = useState('auto')
  const [notifications, setNotifications] = useState(true)

  // TODO: Get actual user ID from auth context
  const userId = 'default-user'

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', userId],
    queryFn: () => fetchUserSettings(userId),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUserSettings(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    updateMutation.mutate({ theme: newTheme })
  }

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotifications(enabled)
    updateMutation.mutate({ notifications_enabled: enabled })
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="border-b border-border bg-surface px-8 py-6">
        <div>
          <h1 className="text-2xl font-600 text-text">Settings</h1>
          <p className="text-text-3 mt-1">Manage your preferences and workspace settings</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          {/* User Preferences */}
          <div className="p-6 rounded-button border border-border bg-surface">
            <h2 className="text-lg font-600 text-text mb-6">Preferences</h2>

            {/* Theme */}
            <div className="mb-8">
              <label className="block text-sm font-500 text-text mb-3">Theme</label>
              <div className="flex gap-3">
                {['light', 'dark', 'auto'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`px-4 py-2 rounded-button text-sm font-500 capitalize ${
                      (settings?.theme || theme) === t
                        ? 'bg-accent text-white'
                        : 'border border-border bg-surface text-text hover:bg-panel'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-500 text-text">Notifications</p>
                  <p className="text-text-3 text-xs mt-1">Receive alerts for agent runs and events</p>
                </div>
                <button
                  onClick={() => handleNotificationsToggle(!notifications)}
                  className={`w-12 h-7 rounded-pill flex items-center transition-colors ${
                    (settings?.notifications_enabled !== false && notifications)
                      ? 'bg-success'
                      : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      (settings?.notifications_enabled !== false && notifications)
                        ? 'translate-x-5'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="p-6 rounded-button border border-border bg-surface">
            <h2 className="text-lg font-600 text-text mb-4">About Agent Studio</h2>
            <div className="space-y-2 text-sm text-text-3">
              <p>
                <span className="text-text font-500">Version:</span> 1.0.0
              </p>
              <p>
                <span className="text-text font-500">Environment:</span> Production
              </p>
              <p>
                <span className="text-text font-500">Status:</span>{' '}
                <span className="text-success">Healthy</span>
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-button border border-error bg-error-light">
            <h2 className="text-lg font-600 text-error mb-4">Danger Zone</h2>
            <button className="px-4 py-2 rounded-button border border-error text-error font-500 hover:bg-error hover:text-white transition-colors">
              Clear all data
            </button>
            <p className="text-text-3 text-xs mt-2">
              This action cannot be undone. All your workspaces, agents, and runs will be permanently deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
