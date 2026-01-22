import { redirect } from 'next/navigation'

import { DashboardContent } from './components/dashboard-content'

async function getSession() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/get-session`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user ?? null
  } catch {
    return null
  }
}

type DashboardPageProps = {
  searchParams: Promise<{
    authenticated?: string
    message?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getSession()

  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const showSuccessMessage = params.authenticated === 'true' || params.message === 'success'

  return <DashboardContent user={user} showSuccessMessage={showSuccessMessage} />
}
