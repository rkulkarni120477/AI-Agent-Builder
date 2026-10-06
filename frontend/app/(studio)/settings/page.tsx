'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { fetchUserSettings, updateUserSettings } from '@/lib/analytics-api'
import { useTheme } from '@/app/theme-provider'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [email, setEmail] = useState('')
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(false)
  const [notifyOnFailure, setNotifyOnFailure] = useState(false)

  // TODO: Get actual user ID from auth context
  const userId = 'default-user'

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', userId],
    queryFn: () => fetchUserSettings(userId),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUserSettings(userId, data),
    onMutate: async (newData: any) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-settings', userId] })

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(['user-settings', userId])

      // Optimistically update to the new value
      queryClient.setQueryData(['user-settings', userId], (old: any) => ({
        ...old,
        ...newData,
      }))

      return { previousSettings }
    },
    onError: (err, newData, context: any) => {
      // Revert to previous settings on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['user-settings', userId], context.previousSettings)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })

  const handleThemeChange = (newTheme: string) => {
    console.log('handleThemeChange called with:', newTheme)
    console.log('Current theme from context:', theme)
    setTheme(newTheme as 'light' | 'dark' | 'auto')
      .then(() => console.log('Theme changed successfully'))
      .catch((err) => console.error('Error changing theme:', err))
  }

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotifications(enabled)
    updateMutation.mutate({ notifications_enabled: enabled })
  }

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail)
    updateMutation.mutate({ notification_email: newEmail })
  }

  const handleNotifyOnSuccessChange = (checked: boolean) => {
    setNotifyOnSuccess(checked)
    updateMutation.mutate({ notify_on_success: checked })
  }

  const handleNotifyOnFailureChange = (checked: boolean) => {
    setNotifyOnFailure(checked)
    updateMutation.mutate({ notify_on_failure: checked })
  }

  // Sync local state with loaded settings
  useEffect(() => {
    if (settings) {
      setNotifications(settings.notifications_enabled !== false)
      setEmail(settings.notification_email || '')
      setNotifyOnSuccess(settings.notify_on_success || false)
      setNotifyOnFailure(settings.notify_on_failure || false)
    }
  }, [settings?.id])

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
                    className={`px-4 py-2 rounded-button text-sm font-500 capitalize transition-colors ${
                      theme === t
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
            <div className="border-t border-divider pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-500 text-text">Email Notifications</p>
                  <p className="text-text-3 text-xs mt-1">Receive alerts for agent runs</p>
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

              {notifications && (
                <div className="space-y-4 bg-panel p-4 rounded-button border border-border">
                  {/* Email address */}
                  <div>
                    <label className="block text-sm font-500 text-text mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-button border-2 border-border bg-surface text-text text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors"
                    />
                    <p className="text-text-3 text-xs mt-1">
                      Notifications will be sent to this email address
                    </p>
                  </div>

                  {/* Notification types */}
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-500 text-text">Notify me when:</p>
                    <label className="flex items-center gap-3 cursor-pointer select-none hover:opacity-80 transition-opacity">
                      <input
                        type="checkbox"
                        checked={notifyOnSuccess}
                        onChange={(e) => handleNotifyOnSuccessChange(e.target.checked)}
                        className="w-5 h-5 cursor-pointer rounded border-2 border-border accent-accent"
                      />
                      <span className="text-sm text-text">Agent runs complete successfully</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none hover:opacity-80 transition-opacity">
                      <input
                        type="checkbox"
                        checked={notifyOnFailure}
                        onChange={(e) => handleNotifyOnFailureChange(e.target.checked)}
                        className="w-5 h-5 cursor-pointer rounded border-2 border-border accent-accent"
                      />
                      <span className="text-sm text-text">Agent runs fail</span>
                    </label>
                  </div>
                </div>
              )}
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
