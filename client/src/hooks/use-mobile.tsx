import * as React from "react"

const MOBILE_BREAKPOINT = 768
const SMALL_MOBILE_BREAKPOINT = 480
const ULTRA_SMALL_BREAKPOINT = 360

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsSmallMobile() {
  const [isSmallMobile, setIsSmallMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsSmallMobile(window.innerWidth < SMALL_MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsSmallMobile(window.innerWidth < SMALL_MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isSmallMobile
}

export function useIsUltraSmall() {
  const [isUltraSmall, setIsUltraSmall] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${ULTRA_SMALL_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsUltraSmall(window.innerWidth < ULTRA_SMALL_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsUltraSmall(window.innerWidth < ULTRA_SMALL_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isUltraSmall
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<{
    width: number | undefined;
    height: number | undefined;
    isMobile: boolean;
    isSmallMobile: boolean;
    isUltraSmall: boolean;
  }>({
    width: undefined,
    height: undefined,
    isMobile: false,
    isSmallMobile: false,
    isUltraSmall: false,
  })

  React.useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setScreenSize({
        width,
        height,
        isMobile: width < MOBILE_BREAKPOINT,
        isSmallMobile: width < SMALL_MOBILE_BREAKPOINT,
        isUltraSmall: width < ULTRA_SMALL_BREAKPOINT,
      })
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return screenSize
}
