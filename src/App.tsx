import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthProvider'
import RequireAuth from './features/auth/RequireAuth'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import IntelligencePage from './features/intelligence/IntelligencePage'
import ErrorBoundary from './components/ErrorBoundary'

const DestinationPage = lazy(() => import('./features/intelligence/DestinationPage'))
const LivePage = lazy(() => import('./features/live/LivePage'))
const LiveDetailPage = lazy(() => import('./features/live/LiveDetailPage'))
const JourneysPage = lazy(() => import('./features/journeys/JourneysPage'))
const JourneyDetailPage = lazy(() => import('./features/journeys/JourneyDetailPage'))
const ExperienceDetailPage = lazy(() => import('./features/experiences/ExperienceDetailPage'))
const SignInPage = lazy(() => import('./features/auth/SignInPage'))
const ProfilePage = lazy(() => import('./features/auth/ProfilePage'))
const VisaHomePage = lazy(() => import('./features/visa/VisaHomePage'))
const VisaEligibilityPage = lazy(() => import('./features/visa/VisaEligibilityPage'))
const ApplyPage = lazy(() => import('./features/visa/ApplyPage').then(m => ({ default: m.ApplyPage })))
const EditDetailsPage = lazy(() => import('./features/visa/ApplyPage').then(m => ({ default: m.EditDetailsPage })))
const DocumentsPage = lazy(() => import('./features/visa/DocumentsPage'))
const ReviewPage = lazy(() => import('./features/visa/ReviewPage'))
const ApplicationPage = lazy(() => import('./features/visa/ApplicationPage'))
const MyApplicationsPage = lazy(() => import('./features/visa/MyApplicationsPage'))
const Privacy = lazy(() => import('./features/legal/pages').then(m => ({ default: m.Privacy })))
const Terms = lazy(() => import('./features/legal/pages').then(m => ({ default: m.Terms })))
const Refunds = lazy(() => import('./features/legal/pages').then(m => ({ default: m.Refunds })))
const DeleteInfo = lazy(() => import('./features/legal/pages').then(m => ({ default: m.DeleteInfo })))

const guard = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>

const Fallback = () => (
  <div className="mx-auto max-w-6xl px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-line" /></div>
)

const NotFound = () => (
  <main className="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 className="text-3xl font-extrabold">Page not found</h1>
    <p className="mt-2 text-muted">That page doesn't exist or has moved.</p>
    <a href="/" className="mt-6 inline-block rounded-full bg-teal px-6 py-3 font-semibold text-white">Back to home</a>
  </main>
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()

  return (
    <AuthProvider>
      <ScrollToTop />
      <SiteHeader />
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<IntelligencePage />} />
            <Route path="/destinations/:id" element={<DestinationPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/live/:id" element={<LiveDetailPage />} />
            <Route path="/journeys" element={<JourneysPage />} />
            <Route path="/journeys/:id" element={<JourneyDetailPage />} />
            <Route path="/experiences/:id" element={<ExperienceDetailPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/profile" element={guard(<ProfilePage />)} />
            <Route path="/visa" element={<VisaHomePage />} />
            <Route path="/visa/:countryId" element={<VisaEligibilityPage />} />
            <Route path="/visa/apply/:countryId" element={guard(<ApplyPage />)} />
            <Route path="/visa/apply/group/:groupId" element={guard(<ApplyPage />)} />
            <Route path="/visa/applications" element={guard(<MyApplicationsPage />)} />
            <Route path="/visa/applications/:id" element={guard(<ApplicationPage />)} />
            <Route path="/visa/applications/:id/details" element={guard(<EditDetailsPage />)} />
            <Route path="/visa/applications/:id/documents" element={guard(<DocumentsPage />)} />
            <Route path="/visa/applications/:id/review" element={guard(<ReviewPage />)} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/delete-account" element={<DeleteInfo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <SiteFooter />
    </AuthProvider>
  )
}

