'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function StudioPage() {
  useEffect(() => {
    redirect('/agents')
  }, [])

  return null
}
