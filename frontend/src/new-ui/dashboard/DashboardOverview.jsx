import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  Skeleton,
  SkeletonText,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Textarea,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarCheck,
  CheckSquare,
  ChevronRight,
  FileText,
  Sparkles,
  Stamp,
  TimerReset,
  TrendingUp,
  Users,
  Wand2,
} from 'lucide-react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import useDashboardSummary from '../hooks/useDashboardSummary'

const MotionDiv = motion.div

const metricIconMap = {
  FileText,
  Stamp,
  CheckSquare,
  TimerReset,
}

const priorityColor = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
}

const formatNumber = (value, locale) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)

const formatHours = (value, locale) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)

const formatCurrency = (value, locale) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (value, locale) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  })
  return formatter.format(new Date(value))
}

const formatRelativeTime = (value, locale) => {
  const now = Date.now()
  const then = new Date(value).getTime()
  const diffMs = then - now
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))

  if (Math.abs(diffHours) < 24) {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  return formatter.format(diffDays, 'day')
}

const DashboardOverview = () => {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { data, isLoading } = useDashboardSummary()
  const shouldReduceMotion = useReducedMotion()

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      return null
    }
  }, [])

  const displayName = user?.name || user?.first_name || t('newUi.dashboard.defaultUser')
  const locale = i18n.language || 'en'

  const metrics = data?.metrics || []
  const pipeline = data?.pipeline || []
  const tasks = data?.tasks || []
  const hero = data?.highlights?.hero
  const usingFallback = data?.fallback

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      followUp: '',
      priority: 'medium',
      notifyTeam: true,
      notes: '',
    },
  })

  const onSubmit = async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast({
      title: t('newUi.dashboard.quickActions.confirmTitle'),
      description: t('newUi.dashboard.quickActions.confirmCopy', { name: values.followUp }),
      status: 'success',
      duration: 3500,
      isClosable: true,
      position: 'top',
    })
    reset()
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-brand-600">
              {t('newUi.dashboard.breadcrumb.current')}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {t('newUi.dashboard.title', { name: displayName })}
            </h1>
            <p className="text-base text-slate-600">{t('newUi.dashboard.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" leftIcon={<TrendingUp className="h-4 w-4" />}>
              {t('newUi.dashboard.actions.viewPipeline')}
            </Button>
            <Button colorScheme="brand" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
              {t('newUi.dashboard.actions.newProposal')}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="font-medium text-slate-600">
            {t('newUi.dashboard.metrics.refreshHint')}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t('newUi.dashboard.metrics.realTime')}
          </span>
        </div>
        {usingFallback && (
          <Alert status="info" variant="subtle" borderRadius="lg">
            <AlertIcon />
            <AlertDescription>{t('newUi.dashboard.fallbackCopy')}</AlertDescription>
          </Alert>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(isLoading ? Array.from({ length: 4 }) : metrics).map((metric, index) => {
          if (isLoading) {
            return (
              <Skeleton
                key={`metric-skeleton-${index}`}
                className="h-32 rounded-2xl"
                fadeDuration={0.2}
              />
            )
          }

          const Icon = metricIconMap[metric.icon] || FileText
          const value =
            metric.id === 'avgResponseTime'
              ? `${formatHours(metric.value, locale)}${t('newUi.dashboard.metrics.hoursSuffix')}`
              : formatNumber(metric.value, locale)

          const isPositive = metric.delta >= 0
          const deltaClass = isPositive ? 'text-success' : 'text-danger'
          const deltaIcon = isPositive ? (
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <TrendingUp className="h-4 w-4 rotate-180" aria-hidden="true" />
          )

          return (
            <MotionDiv
              key={metric.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4, boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }
              }
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">
                    {t(`newUi.dashboard.metrics.${metric.id}.label`)}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-slate-900">{value}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {t(`newUi.dashboard.metrics.${metric.id}.description`)}
                    </span>
                  </div>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
                <span className={`flex items-center gap-1 ${deltaClass}`}>
                  {deltaIcon}
                  {Math.abs(metric.delta)}%
                </span>
                <span className="text-slate-500">
                  {t(`newUi.dashboard.metrics.${metric.id}.trendCopy`, {
                    context: metric.delta >= 0 ? 'up' : 'down',
                  })}
                </span>
                <span className="text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-500">{t('newUi.dashboard.metrics.vsLastWeek')}</span>
                <Tooltip label={t('newUi.dashboard.metrics.viewDetail')}>
                  <ArrowUpRight
                    className="h-4 w-4 text-slate-400 transition group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                </Tooltip>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0" />
            </MotionDiv>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {t('newUi.dashboard.pipeline.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('newUi.dashboard.pipeline.subtitle')}</p>
            </div>
            <Button variant="ghost" rightIcon={<ChevronRight className="h-4 w-4" />}>
              {t('newUi.dashboard.pipeline.viewAll')}
            </Button>
          </div>
          <Tabs variant="unstyled" className="mt-2">
            <TabList className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
              <Tab className="rounded-full px-4 py-2 text-slate-500 aria-selected:bg-white aria-selected:text-slate-900">
                {t('newUi.dashboard.pipeline.tabs.active')}
              </Tab>
              <Tab className="rounded-full px-4 py-2 text-slate-500 aria-selected:bg-white aria-selected:text-slate-900">
                {t('newUi.dashboard.pipeline.tabs.completed')}
              </Tab>
            </TabList>
            <TabPanels className="mt-4">
              <TabPanel className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                ) : (
                  pipeline.map((deal, index) => (
                    <MotionDiv
                      key={deal.id}
                      className="rounded-xl border border-slate-200 p-4 shadow-sm transition duration-ui ease-emphasized hover:border-brand-400 hover:shadow-md"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{deal.name}</p>
                          <p className="text-xs text-slate-500">
                            {t(`newUi.dashboard.pipeline.stages.${deal.stage}`)}
                          </p>
                        </div>
                        <Badge
                          colorScheme="brand"
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {formatCurrency(deal.value, locale)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        {t('newUi.dashboard.pipeline.updated', {
                          time: formatRelativeTime(deal.updatedAt, locale),
                        })}
                      </p>
                    </MotionDiv>
                  ))
                )}
              </TabPanel>
              <TabPanel>
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  {t('newUi.dashboard.pipeline.emptyState')}
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {t('newUi.dashboard.quickActions.title')}
            </h2>
            <Badge colorScheme="brand" className="rounded-full px-3 py-1 text-xs font-semibold">
              {t('newUi.dashboard.quickActions.badge')}
            </Badge>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormControl isRequired isInvalid={Boolean(errors.followUp)}>
              <FormLabel>{t('newUi.dashboard.quickActions.fields.followUp')}</FormLabel>
              <Input
                type="text"
                placeholder={t('newUi.dashboard.quickActions.placeholders.followUp')}
                {...register('followUp', {
                  required: t('newUi.dashboard.quickActions.errors.followUp'),
                })}
              />
              <FormErrorMessage>{errors.followUp?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.priority)}>
              <FormLabel>{t('newUi.dashboard.quickActions.fields.priority')}</FormLabel>
              <Select
                placeholder={t('newUi.dashboard.quickActions.placeholders.priority')}
                {...register('priority', {
                  required: t('newUi.dashboard.quickActions.errors.priority'),
                })}
              >
                <option value="high">{t('newUi.dashboard.quickActions.priority.high')}</option>
                <option value="medium">{t('newUi.dashboard.quickActions.priority.medium')}</option>
                <option value="low">{t('newUi.dashboard.quickActions.priority.low')}</option>
              </Select>
              <FormErrorMessage>{errors.priority?.message}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>{t('newUi.dashboard.quickActions.fields.notes')}</FormLabel>
              <Textarea
                rows={3}
                placeholder={t('newUi.dashboard.quickActions.placeholders.notes')}
                {...register('notes', {
                  maxLength: {
                    value: 280,
                    message: t('newUi.dashboard.quickActions.errors.notes'),
                  },
                })}
              />
              <FormErrorMessage>{errors.notes?.message}</FormErrorMessage>
            </FormControl>
            <FormControl className="flex items-center gap-3">
              <Switch id="notifyTeam" colorScheme="brand" {...register('notifyTeam')} />
              <FormLabel htmlFor="notifyTeam" mb="0" className="!m-0">
                {t('newUi.dashboard.quickActions.fields.notifyTeam')}
              </FormLabel>
            </FormControl>
            <div className="flex gap-3">
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={isSubmitting}
                loadingText={t('newUi.dashboard.quickActions.loading')}
              >
                {t('newUi.dashboard.quickActions.submit')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset()}
                isDisabled={isSubmitting}
              >
                {t('newUi.dashboard.quickActions.reset')}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {t('newUi.dashboard.tasks.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('newUi.dashboard.tasks.subtitle')}</p>
            </div>
            <Button variant="ghost" rightIcon={<CalendarCheck className="h-4 w-4" />}>
              {t('newUi.dashboard.tasks.schedule')}
            </Button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <SkeletonText mt="2" noOfLines={3} spacing="4" skeletonHeight="5" />
            ) : (
              tasks.map((task, index) => (
                <MotionDiv
                  key={task.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 shadow-sm transition duration-ui ease-emphasized hover:border-brand-400"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {t('newUi.dashboard.tasks.owner', { name: task.owner })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('newUi.dashboard.tasks.dueOn', { date: formatDate(task.dueOn, locale) })}
                    </p>
                  </div>
                  <Badge
                    colorScheme={priorityColor[task.priority] || 'brand'}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {t(`newUi.dashboard.quickActions.priority.${task.priority}`)}
                  </Badge>
                </MotionDiv>
              ))
            )}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {t('newUi.dashboard.highlight.title')}
            </h2>
            <Tooltip label={t('newUi.dashboard.highlight.tooltip')}>
              <Button variant="ghost" size="sm" leftIcon={<Wand2 className="h-4 w-4" />}>
                {t('newUi.dashboard.highlight.cta')}
              </Button>
            </Tooltip>
          </div>
          {hero ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <LazyLoadImage
                src={hero.src}
                width={hero.width}
                height={hero.height}
                className="h-full w-full object-cover"
                effect="blur"
                alt={t('newUi.dashboard.highlight.alt')}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              {t('newUi.dashboard.highlight.emptyState')}
            </div>
          )}
          <p className="text-sm text-slate-600">{t('newUi.dashboard.highlight.copy')}</p>
          <Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>
            {t('newUi.dashboard.highlight.secondaryCta')}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default DashboardOverview
