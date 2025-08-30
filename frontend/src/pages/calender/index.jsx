import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    CContainer, CRow, CCol, CCard, CCardBody,
    CFormSelect, CModal, CModalBody, CModalHeader, CModalTitle,
    CSpinner, CBadge, CInputGroup, CInputGroupText, CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilFilter, cilReload, cilClock } from '@coreui/icons';
import moment from 'moment';
import axiosInstance from '../../helpers/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { buildEncodedPath, genNoise } from '../../utils/obfuscate';
import { FaCalendarAlt, FaUsers, FaChartLine } from "react-icons/fa";
import './CalendarView.css';
import PageHeader from '../../components/PageHeader';

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [eventType, setEventType] = useState('All');
    const [visibleModal, setVisibleModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const eventTypeOptions = [
        'All',
        'Measurement Scheduled',
        'Design Scheduled',
        'Follow Up 1',
        'Follow Up 2',
        'Follow Up 3'
    ];

    // Event type colors - more professional and muted
    const eventColors = {
        'Measurement Scheduled': '#0d6efd', // Primary blue
        'Design Scheduled': '#198754', // Success green
        'Follow Up 1': '#fd7e14', // Warning orange
        'Follow Up 2': '#dc3545', // Danger red
        'Follow Up 3': '#6f42c1', // Purple
    };

    // Badge colors for event types
    const badgeColors = {
        'Measurement Scheduled': 'primary',
        'Design Scheduled': 'success',
        'Follow Up 1': 'warning',
        'Follow Up 2': 'danger',
        'Follow Up 3': 'info',
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/api/calendar-events');
            const rawEvents = res.data.events;

            const formatted = rawEvents.map(e => ({
                id: e.id,
                title: `${e.title}${e.salesRep ? ' - ' + e.salesRep : ''}`,
                baseTitle: e.title, // For filtering
                date: moment(e.date).format('YYYY-MM-DD'),
                allDay: true,
                backgroundColor: eventColors[e.title] || '#6c757d',
                borderColor: eventColors[e.title] || '#6c757d',
                textColor: '#ffffff',
                extendedProps: {
                    description: e.description || '',
                    salesRep: e.salesRep || '',
                    eventType: e.title
                },
            }));

            setEvents(formatted);
            setFilteredEvents(formatted);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info) => {
        const proposalId = info.event.id;
    const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/proposals/edit/:id', { id: proposalId });
    navigate(noisy);
    };

    const handleFilterChange = (e) => {
        const value = e.target.value;
        setEventType(value);

        if (value === 'All') {
            setFilteredEvents(events);
        } else {
            const filtered = events.filter(ev => ev.baseTitle === value);
            setFilteredEvents(filtered);
        }
    };

    const handleRefresh = () => {
        fetchEvents();
    };

    // Custom event content renderer
    const renderEventContent = (eventInfo) => {
        return (
            <div className="custom-event-content">
                <div className="event-title">{eventInfo.event.extendedProps.eventType}</div>
                {eventInfo.event.extendedProps.salesRep && (
                    <div className="event-sales-rep">
                        {eventInfo.event.extendedProps.salesRep}
                    </div>
                )}
            </div>
        );
    };

    // Get event counts for filter
    const getEventCounts = () => {
        const counts = {};
        eventTypeOptions.forEach(type => {
            if (type === 'All') {
                counts[type] = events.length;
            } else {
                counts[type] = events.filter(e => e.baseTitle === type).length;
            }
        });
        return counts;
    };

    const eventCounts = getEventCounts();

    // Get today's events
    const getTodaysEvents = () => {
        const today = moment().format('YYYY-MM-DD');
        return filteredEvents.filter(event => event.date === today);
    };

    // Get this week's events
    const getThisWeeksEvents = () => {
        const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
        const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
        return filteredEvents.filter(event => 
            moment(event.date).isBetween(startOfWeek, endOfWeek, null, '[]')
        );
    };

    const todaysEvents = getTodaysEvents();
    const thisWeeksEvents = getThisWeeksEvents();

    return (
        <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <PageHeader
                title="Event Calendar"
                subtitle="Manage your scheduled events and appointments"
                icon={FaCalendarAlt}
            >
                <CButton 
                    color="light" 
                    className="shadow-sm px-4 fw-semibold"
                    onClick={handleRefresh}
                    disabled={loading}
                    style={{ 
                        borderRadius: '5px',
                        border: 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <CIcon icon={cilReload} className="me-2" />
                    Refresh
                </CButton>
            </PageHeader>

            {/* Stats Row */}
            <CRow className="mb-2">
                <CCol md={4}>
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardBody className="text-center">
                            <div className="d-flex align-items-center justify-content-center mb-2">
                                <div 
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#e7f3ff',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <CIcon icon={cilCalendar} style={{ color: '#0d6efd', fontSize: '20px' }} />
                                </div>
                                <div className="text-start">
                                    <h4 className="mb-0 fw-bold text-primary">{todaysEvents.length}</h4>
                                    <small className="text-muted">Today's Events</small>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol md={4}>
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardBody className="text-center">
                            <div className="d-flex align-items-center justify-content-center mb-2">
                                <div 
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#e6ffed',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <FaChartLine style={{ color: '#198754', fontSize: '20px' }} />
                                </div>
                                <div className="text-start">
                                    <h4 className="mb-0 fw-bold text-success">{thisWeeksEvents.length}</h4>
                                    <small className="text-muted">This Week</small>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol md={4}>
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardBody className="text-center">
                            <div className="d-flex align-items-center justify-content-center mb-2">
                                <div 
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#fff7e6',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <FaUsers style={{ color: '#fd7e14', fontSize: '20px' }} />
                                </div>
                                <div className="text-start">
                                    <h4 className="mb-0 fw-bold text-warning">{filteredEvents.length}</h4>
                                    <small className="text-muted">Total Events</small>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Filter Section */}
            <CCard className="border-0 shadow-sm mb-1">
                <CCardBody>
                    <CRow className="align-items-center">
                        <CCol md={6} lg={4}>
                            <CInputGroup>
                                <CInputGroupText style={{ background: 'none', border: 'none' }}>
                                    <CIcon icon={cilFilter} />
                                </CInputGroupText>
                                <CFormSelect 
                                    value={eventType} 
                                    onChange={handleFilterChange}
                                    style={{ 
                                        border: '1px solid #e3e6f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        padding: '12px 16px'
                                    }}
                                >
                                    {eventTypeOptions.map((type, idx) => (
                                        <option key={idx} value={type}>
                                            {type} ({eventCounts[type] || 0})
                                        </option>
                                    ))}
                                </CFormSelect>
                            </CInputGroup>
                        </CCol>
                        <CCol md={6} lg={8} className="text-md-end mt-3 mt-md-0">
                            <div className="d-flex justify-content-md-end align-items-center gap-2 flex-wrap">
                                {eventTypeOptions.slice(1).map((type) => (
                                    <CBadge 
                                        key={type}
                                        color={badgeColors[type] || 'secondary'}
                                        className="px-2 py-1"
                                        style={{ 
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {type}: {eventCounts[type] || 0}
                                    </CBadge>
                                ))}
                            </div>
                        </CCol>
                    </CRow>
                </CCardBody>
            </CCard>

            {/* Loading State */}
            {loading && (
                <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                        <CSpinner color="primary" size="lg" />
                        <p className="text-muted mt-3 mb-0">Loading calendar events...</p>
                    </CCardBody>
                </CCard>
            )}

            {/* Calendar */}
            {!loading && (
                <CCard className="border-0 shadow-sm">
                    <CCardBody className="p-0">
                        <div className="p-3">
                            <div className="calendar-wrapper" style={{ borderRadius: '8px', overflow: 'hidden' }}>
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
                                    allDaySlot={true}
                                    // Week and day view customization to hide time slots
                                    views={{
                                        timeGridWeek: {
                                            allDaySlot: true,
                                            slotMinTime: "00:00:00",
                                            slotMaxTime: "00:00:00"
                                        },
                                        timeGridDay: {
                                            allDaySlot: true,
                                            slotMinTime: "00:00:00",
                                            slotMaxTime: "00:00:00"
                                        }
                                    }}
                                    dayMaxEvents={false}
                                    moreLinkClick="popover"
                                    eventDisplay="block"
                                />
                            </div>
                        </div>
                        
                        {/* Empty State */}
                        {filteredEvents.length === 0 && (
                            <div className="text-center py-5">
                                <FaCalendarAlt className="text-muted mb-3" style={{ fontSize: '48px', opacity: 0.3 }} />
                                <p className="text-muted mb-1 fs-5">No events found</p>
                                <small className="text-muted">
                                    {eventType === 'All' 
                                        ? "No events are scheduled at this time" 
                                        : `No events found for "${eventType}"`
                                    }
                                </small>
                            </div>
                        )}
                    </CCardBody>
                </CCard>
            )}

            {/* Custom CSS for FullCalendar styling */}
            <style>{`
                .fc {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .fc-toolbar {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px 8px 0 0;
                    border-bottom: 1px solid #e3e6f0;
                }
                
                .fc-toolbar-title {
                    color: #495057;
                    font-weight: 600;
                }
                
                .fc-button {
                    border-radius: 6px !important;
                    border: 1px solid #e3e6f0 !important;
                    background: white !important;
                    color: #495057 !important;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .fc-button:hover {
                    background: #e7f3ff !important;
                    border-color: #0d6efd !important;
                    color: #0d6efd !important;
                }
                
                .fc-button-active {
                    background: #0d6efd !important;
                    border-color: #0d6efd !important;
                    color: white !important;
                }
                
                .fc-daygrid-day {
                    border-color: #e3e6f0;
                }
                
                .fc-col-header-cell {
                    background: #f8f9fa;
                    border-color: #e3e6f0;
                    font-weight: 600;
                    color: #495057;
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
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .fc-day-today {
                    background: rgba(13, 110, 253, 0.05) !important;
                }
            `}</style>
        </CContainer>
    );
};

export default CalendarView;