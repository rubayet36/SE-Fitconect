'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Bell, X } from 'lucide-react'

// Convert the URL safe base64 public key to a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushOptIn({ userId }: { userId: string }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(true) // assume true until checked

  useEffect(() => {
    async function checkSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription && Notification.permission !== 'denied') {
        // Not subscribed and hasn't blocked us yet = show prompt
        setIsSubscribed(false)
        setShowPrompt(true)
      }
    }
    checkSubscription()
  }, [])

  async function handleSubscribe() {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        toast.error('Push configuration missing. (NEXT_PUBLIC_VAPID_PUBLIC_KEY)')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.trim())
      })

      // Send to our backend
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', userId, subscription })
      })

      if (res.ok) {
        setIsSubscribed(true)
        setShowPrompt(false)
        toast.success('Awesome! You will now receive gym announcements.')
      } else {
        toast.error('Failed to save subscription')
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Notifications were blocked. Please enable them in your browser settings.')
      } else {
        toast.error('Failed to subscribe: ' + err.message)
      }
      setShowPrompt(false)
    }
  }

  if (!showPrompt || isSubscribed) return null

  return (
    <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 flex items-start gap-4 mb-6 shadow-lg relative">
      <button onClick={() => setShowPrompt(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors">
        <X size={16} />
      </button>
      <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
        <Bell size={20} />
      </div>
      <div>
        <h3 className="text-white font-bold text-sm">Don't miss out!</h3>
        <p className="text-zinc-400 text-sm mt-0.5 mb-3 leading-relaxed">Enable push notifications to get instant alerts for important gym announcements and notices.</p>
        <button onClick={handleSubscribe} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          Enable Notifications
        </button>
      </div>
    </div>
  )
}
