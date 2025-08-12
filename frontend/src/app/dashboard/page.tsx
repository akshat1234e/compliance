'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store'
import { getCurrentUser } from '@/store/slices/authSlice'
import { MainDashboard } from '@/components/dashboard/MainDashboard'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function DashboardPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token')
    if (token && !user) {
      dispatch(getCurrentUser())
    } else if (!token) {
      router.push('/login')
    }
  }, [dispatch, user, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  // Show main dashboard if authenticated
  return <MainDashboard />
}
