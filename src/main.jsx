import '@/index.css'

const boot = () => import('@/boot.jsx')

/*
 * A PRERENDERED PAGE PAINTS, AND CHROME RECORDS THAT PAINT, BEFORE THE APP IS EVEN FETCHED.
 *
 * Every public route ships as finished HTML, so the app is not needed to show anything; it is needed
 * to make the page interactive. It used to be one bundle the HTML asked for straight away, and two
 * things followed. Its 150KB download and its evaluation sat in front of first paint. And createRoot
 * replaced the prerendered DOM so soon after that paint that Chrome dropped the paint's text from
 * Largest Contentful Paint: the copy was on screen at 120ms and LCP was reported at 250ms, from
 * React's identical repaint. Lighthouse charged LCP with the bundle and every photograph started
 * before it: phone 84, LCP 4.2s. With this file as it is, 99 and 2.1s (2026-10-23).
 *
 * This file is the entry and holds only the stylesheet and this wait. The app is a separate chunk
 * fetched once the first LCP entry exists, which means the prerendered paint is recorded and React
 * replacing it changes nothing. Nothing visible changes: the page is already painted and its links
 * are plain links. What waits is interactivity, by the chunk's download after first paint; a
 * modulepreload for it would start that download sooner and put it back in front of LCP.
 *
 * Hidden tabs report no LCP at all, browsers without the entry type have nothing to protect, and a
 * page the crawl left client-rendered has nothing painted to wait for, so all three boot at once; the
 * timeout is a floor for anything else that never reports.
 */
const root = document.getElementById('root')
const reportsLcp = typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')
if (root.firstElementChild && document.visibilityState === 'visible' && reportsLcp) {
  let started = false
  const once = () => {
    if (started) return
    started = true
    observer.disconnect()
    boot()
  }
  const observer = new PerformanceObserver(() => setTimeout(once, 0))
  observer.observe({ type: 'largest-contentful-paint', buffered: true })
  setTimeout(once, 1500)
} else {
  boot()
}
