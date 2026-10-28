import { useQuery } from '@tanstack/react-query'

import { fetchClimate } from './climate'
import { fetchDestinations, fetchEvents, fetchLive, type Destination } from './githubData'


const REFRESH = 30 * 60_000 // same 30 minutes as AUTO_REFRESH_MINUTES in the app

export const useDestinations = () =>
  useQuery({ queryKey: ['destinations'], queryFn: fetchDestinations, refetchInterval: REFRESH })

export const useEvents = () =>
  useQuery({
    queryKey: ['events'], queryFn: fetchEvents, refetchInterval: REFRESH,
    select: list => list.filter(e => e.daysUntil <= 120).sort((a, b) => a.start.getTime() - b.start.getTime()),
  })

export const useClimate = (d?: Destination) =>
  useQuery({
    queryKey: ['climate', d?.id], enabled: !!d && (d.latitude !== 0 || d.longitude !== 0),
    queryFn: () => fetchClimate(d!), staleTime: Infinity, retry: 1,
  })
export const useLive = () =>
  useQuery({ queryKey: ['live'], queryFn: fetchLive, refetchInterval: 45_000 })
