import { useState, useEffect } from 'react'

export interface NotificationMessage {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  favorite: boolean
  selected: boolean
}

const mockNotifications: NotificationMessage[] = [
  {
    id: '1',
    title: 'Ilmoitus 1',
    description: 'Kuvaus',
    time: '2 tuntia sitten',
    read: false,
    favorite: false,
    selected: false,
  },
  {
    id: '2',
    title: 'Ilmoitus 2',
    description: 'Kuvaus',
    time: 'Eilen',
    read: false,
    favorite: false,
    selected: false,
  },
  {
    id: '3',
    title: 'Ilmoitus 3',
    description: 'Kuvaus',
    time: '3 päivää sitten',
    read: true,
    favorite: false,
    selected: false,
  },
]

let listeners: Array<() => void> = []
let globalNotifications = mockNotifications

export function useNotificationStore() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>(globalNotifications)

  useEffect(() => {
    const listener = () => setNotifications([...globalNotifications])
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const updateNotifications = (newNotifications: NotificationMessage[] | ((prev: NotificationMessage[]) => NotificationMessage[])) => {
    if (typeof newNotifications === 'function') {
      globalNotifications = newNotifications(globalNotifications)
    } else {
      globalNotifications = newNotifications
    }
    listeners.forEach((listener) => listener())
  }

  return {
    notifications,
    setNotifications: updateNotifications,
  }
}