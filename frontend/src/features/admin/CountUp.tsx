import { useEffect, useState } from 'react'

function CountUp(endValue: number, duration: number = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrameId: number

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing-efekti (hidastuu loppua kohti)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      setCount(easeOutQuart * endValue)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount)
      }
    }

    animationFrameId = requestAnimationFrame(updateCount)

    return () => cancelAnimationFrame(animationFrameId)
  }, [endValue, duration])

  return count
}