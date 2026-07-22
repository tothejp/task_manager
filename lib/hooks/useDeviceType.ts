'use client'

import { useEffect, useState } from 'react'

export type DeviceType = 'mobile' | 'desktop' | 'unknown'

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown')

  useEffect(() => {
    const ua = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    setDeviceType(isMobile ? 'mobile' : 'desktop')
  }, [])

  return deviceType
}
