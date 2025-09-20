'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseRealTimeOptions {
  interval?: number
  enabled?: boolean
}

export function useRealTime<T>(
  fetchFn: () => Promise<T> | T,
  options: UseRealTimeOptions = {}
) {
  const { interval = 30000, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRequestInFlight, setIsRequestInFlight] = useState(false)
  const fetchData = useCallback(async () => {
    if (isRequestInFlight) return
    
    setIsLoading(true)
    setIsRequestInFlight(true)
    try {
      setError(null)
      const result = await fetchFn()
      setData(result)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
      setIsRequestInFlight(false)
    }
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return

    fetchData()
    const intervalId = setInterval(fetchData, interval)
    return () => clearInterval(intervalId)
  }, [fetchData, interval, enabled])

  return { data, isLoading, error, lastUpdate, refetch: fetchData }
}
