'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  
  useEffect(() => {
    router.replace(`/scan/${params.id}`)
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Loading report...</p>
    </div>
  )
}
