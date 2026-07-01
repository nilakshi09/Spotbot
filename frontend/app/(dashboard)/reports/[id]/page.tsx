'use client'
import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const router = useRouter()
  
  useEffect(() => {
    router.replace(`/scan/${id}`)
  }, [id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Loading report...</p>
    </div>
  )
}
