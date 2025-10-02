import StandardCard from '../../components/StandardCard'
import React, { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Badge, Box, Button, Container, Flex, HStack, Icon, Select, Spinner, Stack, Text } from '@chakra-ui/react'
import { Calendar, Filter, RefreshCw } from 'lucide-react'
import axiosInstance from '../../helpers/axiosInstance'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import PageHeader from '../../components/PageHeader'

const EVENT_TYPES = [
  'All',
  'Measurement Scheduled',
  'Design Scheduled',
  'Follow Up 1',
  'Follow Up 2',
  'Follow Up 3',
]

const EVENT_COLORS = {
  'Measurement Scheduled': "blue.500",
  'Design Scheduled': "green.500",
  'Follow Up 1': "orange.500",
  'Follow Up 2': "red.500",
  'Follow Up 3': "purple.500",
}

const BADGE_SCHEMES = {
  'Measurement Scheduled': 'blue',
  'Design Scheduled': 'green',
  'Follow Up 1': 'orange',
  'Follow Up 2': 'red',
  'Follow Up 3': 'purple',
}

const CalendarView = () => {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [eventType, setEventType] = useState('All')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/calendar-events')
      const rawEvents = response.data?.events || []

      const formatted = rawEvents.map((event) => ({
        id: event.id,
        title: `${event.title}${event.salesRep ? ` - ${event.salesRep}` : ''}`,
        baseTitle: event.title,
        date: event.date,
        allDay: true,
        backgroundColor: EVENT_COLORS[event.title] || "gray.500",
        borderColor: EVENT_COLORS[event.title] || "gray.500",
        textColor: "white",
        extendedProps: {
          description: event.description || '',
          salesRep: event.salesRep || '',
          eventType: event.title,
        },
      }))

      setEvents(formatted)
      setFilteredEvents(formatted)
    } catch (error) {
      console.error('Failed to load calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleFilterChange = (event) => {
    const selected = event.target.value
    setEventType(selected)

    if (selected === 'All') {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter((entry) => entry.baseTitle === selected))
    }
  }

  const handleRefresh = () => {
    fetchEvents()
  }

  const handleEventClick = (info) => {
    const proposalId = info.event.id
    const noisyPath = `/${genNoise(6)}/${genNoise(8)}` +
      buildEncodedPath('/quotes/edit/:id', { id: proposalId })
    navigate(noisyPath)
  }

  const renderEventContent = (eventInfo) => (
    <Box className="calendar-event" px={2} py={1} fontSize="xs">
      <Text fontWeight="semibold" noOfLines={1}>
        {eventInfo.event.extendedProps.eventType}
      </Text>
      {eventInfo.event.extendedProps.salesRep && (
        <Text fontSize="2xs" opacity={0.8} noOfLines={1}>
          {eventInfo.event.extendedProps.salesRep}
        </Text>
      )}
    </Box>
  )

  const metrics = useMemo(() => {
    const total = events.length
    const perType = EVENT_TYPES.filter((type) => type !== 'All').map((type) => ({
      type,
      count: events.filter((event) => event.baseTitle === type).length,
    }))

    return { total, perType }
  }, [events])

  return (
    <Container maxW="7xl" py={6}>
      <Stack spacing={6}>
        <PageHeader
          title="Calendar"
          subtitle="Track key proposal follow-ups and appointments"
          icon={Calendar}
        />

        <StandardCard>
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'center' }}>
              <HStack spacing={4} flex="1">
                <Icon as={Filter} color="gray.400" />
                <Select value={eventType} onChange={handleFilterChange} maxW="240px">
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </HStack>

              <Button
                leftIcon={<Icon as={RefreshCw} boxSize={4} />}
                onClick={handleRefresh}
                variant="outline"
                colorScheme="blue"
                alignSelf={{ base: 'flex-start', md: 'initial' }}
              >
                Refresh
              </Button>
            </Flex>
          </CardBody>
        </StandardCard>

        <StandardCard>
          <CardBody>
            {loading ? (
              <Flex align="center" justify="center" minH="360px">
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : (
              <Stack spacing={6}>
                <HStack spacing={4} flexWrap="wrap">
                  <Badge colorScheme="blue" borderRadius="md" px={3} py={1}>
                    Total events: {metrics.total}
                  </Badge>
                  {metrics.perType.map((metric) => (
                    <Badge
                      key={metric.type}
                      colorScheme={BADGE_SCHEMES[metric.type] || 'gray'}
                      borderRadius="md"
                      px={3}
                      py={1}
                    >
                      {metric.type}: {metric.count}
                    </Badge>
                  ))}
                </HStack>

                <Box>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    events={filteredEvents}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="auto"
                    dayMaxEvents={false}
                    eventDisplay="block"
                    views={{
                      timeGridWeek: {
                        allDaySlot: true,
                        slotMinTime: '00:00:00',
                        slotMaxTime: '00:00:00',
                      },
                      timeGridDay: {
                        allDaySlot: true,
                        slotMinTime: '00:00:00',
                        slotMaxTime: '00:00:00',
                      },
                    }}
                  />
                </Box>

                {filteredEvents.length === 0 && (
                  <Flex direction="column" align="center" py={10} color="gray.500" gap={4}>
                    <Icon as={Calendar} boxSize={12} opacity={0.3} />
                    <Text fontSize="lg" fontWeight="medium">
                      No events found
                    </Text>
                    <Text fontSize="sm" textAlign="center" maxW="320px">
                      {eventType === 'All'
                        ? 'There are no events scheduled for this period.'
                        : `There are no events for "${eventType}".`}
                    </Text>
                  </Flex>
                )}
              </Stack>
            )}
          </CardBody>
        </StandardCard>

        <style>{`
          .fc {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .fc-toolbar {
            background: var(--chakra-colors-gray-50);
            padding: 1rem;
            border-radius: 8px 8px 0 0;
            border-bottom: 1px solid var(--chakra-colors-gray-200);
          }

          .fc-toolbar-title {
            color: var(--chakra-colors-gray-600);
            font-weight: 600;
          }

          .fc-button {
            border-radius: 6px !important;
            border: 1px solid var(--chakra-colors-gray-200) !important;
            background: white !important;
            color: var(--chakra-colors-gray-600) !important;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .fc-button:hover {
            background: var(--chakra-colors-blue-50) !important;
            border-color: var(--chakra-colors-blue-500) !important;
            color: var(--chakra-colors-blue-500) !important;
          }

          .fc-button-active {
            background: var(--chakra-colors-blue-500) !important;
            border-color: var(--chakra-colors-blue-500) !important;
            color: white !important;
          }

          .fc-daygrid-day {
            border-color: var(--chakra-colors-gray-200);
          }

          .fc-col-header-cell {
            background: var(--chakra-colors-gray-50);
            border-color: var(--chakra-colors-gray-200);
            font-weight: 600;
            color: var(--chakra-colors-gray-600);
          }

          .fc-event {
            border-radius: 6px !important;
            border: none !important;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .fc-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .fc-day-today {
            background: rgba(13, 110, 253, 0.05) !important;
          }
        `}</style>
      </Stack>
    </Container>
  )
}

export default CalendarView
