import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../helpers/axiosInstance'
import heroIllustration from '../../assets/images/components.webp'

const fallbackSummary = {
  metrics: [
    {
      id: 'activeQuotes',
      value: 18,
      delta: 12,
      trend: 'up',
      icon: 'FileText',
    },
    {
      id: 'awaitingApprovals',
      value: 7,
      delta: -3,
      trend: 'down',
      icon: 'Stamp',
    },
    {
      id: 'openTasks',
      value: 12,
      delta: 5,
      trend: 'up',
      icon: 'CheckSquare',
    },
    {
      id: 'avgResponseTime',
      value: 3.4,
      delta: -8,
      trend: 'down',
      icon: 'TimerReset',
    },
  ],
  pipeline: [
    {
      id: 'north-hudson',
      name: 'North Hudson Cabinets',
      stage: 'review',
      value: 42000,
      updatedAt: '2025-01-12T14:30:00Z',
    },
    {
      id: 'coastal-homes',
      name: 'Coastal Homes',
      stage: 'negotiation',
      value: 28500,
      updatedAt: '2025-01-11T18:00:00Z',
    },
    {
      id: 'urban-lofts',
      name: 'Urban Lofts Group',
      stage: 'awaitingSign',
      value: 35500,
      updatedAt: '2025-01-10T16:15:00Z',
    },
  ],
  tasks: [
    {
      id: 'follow-up-north-hudson',
      title: 'Follow up on blueprint revisions',
      owner: 'D. Chen',
      dueOn: '2025-01-13',
      priority: 'high',
    },
    {
      id: 'send-pricing-coastal',
      title: 'Send revised pricing for Coastal Homes',
      owner: 'M. Patel',
      dueOn: '2025-01-14',
      priority: 'medium',
    },
    {
      id: 'schedule-walkthrough',
      title: 'Schedule on-site walkthrough',
      owner: 'A. Romero',
      dueOn: '2025-01-16',
      priority: 'low',
    },
  ],
  highlights: {
    hero: {
      src: heroIllustration,
      width: 640,
      height: 360,
    },
  },
}

const fetchDashboardSummary = async () => {
  try {
    const response = await axiosInstance.get('/api/dashboard/summary', {
      timeout: 4500,
    })

    const payload = response?.data?.data || response?.data?.payload

    if (payload) {
      return { ...payload, fallback: false }
    }

    return { ...fallbackSummary, fallback: true }
  } catch (error) {
    return {
      ...fallbackSummary,
      fallback: true,
      error,
    }
  }
}

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ['new-ui', 'dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    meta: {
      feature: 'new-ui-dashboard',
    },
  })

export default useDashboardSummary
