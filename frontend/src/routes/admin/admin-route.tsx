import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { getAccessToken } from '../../api/config'

interface CurrentUser {
  id: string
  username: string
  role: 'admin' | 'user' |'teacher'
}

export default function AdminRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')
  const token = getAccessToken()
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

  useEffect(() => {
    let isMounted = true

    if (!token) {
      setStatus('denied')
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`${baseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!isMounted) return

        if (!res.ok) {
          setStatus('denied')
          return
        }

        const user: CurrentUser = await res.json()
        setStatus(user.role === 'admin' ? 'allowed' : 'denied')
      } catch {
        if (isMounted) setStatus('denied')
      }
    })()

    return () => {
      isMounted = false
    }
  }, [token, baseUrl])

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-xs text-[#718096]">
        Tarkistetaan ylläpitäjän oikeuksia...
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}