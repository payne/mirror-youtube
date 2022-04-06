import { useState, useEffect } from "react"

const Timer = ({ start, paused }) => {
  const [time, setTime] = useState(start);
  useEffect(() => {
    if (!paused) {
      const interval = setInterval(() => {
        setTime(t => t + 1)
      }, 1000);
      return () => clearInterval(interval)
    }
  }, [paused])
  return (
    <p>{time}</p>
  )
}

export default Timer;