import React from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

export default function CallsCalendar({ scheduledCalls, user, onEventClick, onDateClick, onEventDrop }) {
  const getCallTitle = (call) => {
    if (!user) return 'Call';
    // For scheduled calls, determine the other user
    let name = '';
    if (call.booker_id === user.id && call.host) {
      name = call.host.full_name || `User ${call.host_id}`;
    } else if (call.host_id === user.id && call.booker) {
      name = call.booker.full_name || `User ${call.booker_id}`;
    } else {
      // Fallback to ID-based naming
      const otherUserId = call.booker_id === user.id ? call.host_id : call.booker_id;
      name = `User ${otherUserId}`;
    }

    // Format name to camel case
    if (name === 'Unknown User') return name;

    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const eventContent = (arg) => {
    const { event, view } = arg;
    const title = event.title;
    const isListView = view.type === 'listWeek';
    const isDayGrid = view.type.startsWith('dayGrid');
    const isTimeGrid = view.type.startsWith('timeGrid');

    if (isListView) {
      const shortTitle = title.replace('Call: ', '');
      const timeStr = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        html: `
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0"></div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm text-gray-900 truncate">${shortTitle}</div>
              <div class="text-xs text-gray-500">${timeStr}</div>
            </div>
          </div>
        `
      };
    }

    if (isDayGrid) {
      // For month view, show shorter title without "Call: "
      const shortTitle = title.replace('Call: ', '');
      return {
        html: `<div class="font-semibold text-xs leading-tight">${shortTitle}</div>`
      };
    }

    if (isTimeGrid) {
      // For week/day views, show full title but ensure it fits
      return {
        html: `<div class="font-semibold text-xs leading-tight truncate">${title}</div>`
      };
    }

    return { html: title };
  };

  const events = scheduledCalls.map(call => ({
    id: call.id,
    title: `Call: ${getCallTitle(call)}`,
    start: new Date(call.scheduled_at * 1000).toISOString(),
    end: new Date((call.scheduled_at + 30 * 60) * 1000).toISOString(), // Assuming 30 min calls
    extendedProps: {
      meetingUrl: call.agora_channel_name,
      hostId: call.host_id,
      status: call.status,
      call: call
    }
  }));

  return (
    <>
      <style>
        {`
          .fc {
            font-family: inherit;
            font-size: 14px;
          }
          .fc-header-toolbar {
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px !important;
          }
          .fc-toolbar-chunk {
            display: flex;
            align-items: center;
          }
          .fc-button {
            background: #f1f5f9 !important;
            border: 1px solid #e2e8f0 !important;
            color: #475569 !important;
            border-radius: 8px !important;
            font-weight: 500 !important;
            font-size: 12px !important;
            padding: 6px 12px !important;
            transition: all 0.2s ease !important;
          }
          .fc-button:hover {
            background: #e2e8f0 !important;
            border-color: #cbd5e1 !important;
          }
          .fc-button-active {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: white !important;
          }
          .fc-today-button {
            background: #10b981 !important;
            color: white !important;
          }
          .fc-today-button:hover {
            background: #059669 !important;
          }
          .fc-event {
            border-radius: 8px !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            padding: 4px 8px !important;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25) !important;
            margin: 2px 0 !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .fc-event:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af) !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35) !important;
            transform: translateY(-1px) !important;
          }
          .fc-daygrid-event {
            margin: 2px 4px !important;
            height: auto !important;
            min-height: 28px !important;
          }
          .fc-timegrid-event {
            margin: 1px 2px !important;
            height: auto !important;
            min-height: 20px !important;
          }
          .fc-timegrid-event .fc-event-main {
            padding: 2px 4px !important;
          }
          .fc-list-event {
            border-radius: 12px !important;
            margin: 6px 0 !important;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }
          .fc-list-event:hover {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            transform: translateY(-1px) !important;
          }
          .fc-list-event-dot {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
            border-radius: 50% !important;
            width: 10px !important;
            height: 10px !important;
            margin-right: 8px !important;
          }
          .fc-list-event-time {
            font-weight: 500 !important;
            color: #374151 !important;
          }
          .fc-list-event-title {
            font-weight: 600 !important;
            color: #1f2937 !important;
          }
          @media (max-width: 640px) {
            .fc-header-toolbar {
              flex-direction: column;
              align-items: stretch;
            }
            .fc-toolbar-chunk {
              justify-content: center;
            }
            .fc-button {
              font-size: 11px !important;
              padding: 4px 8px !important;
            }
            .fc-event {
              font-size: 11px !important;
              padding: 3px 6px !important;
              margin: 1px 0 !important;
            }
            .fc-daygrid-event {
              margin: 1px 2px !important;
              min-height: 24px !important;
            }
            .fc-timegrid-event {
              margin: 1px 1px !important;
              min-height: 18px !important;
            }
            .fc-list-event {
              margin: 4px 0 !important;
            }
          }
        `}
      </style>
      <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={window.innerWidth < 375 ? "timeGridWeek" : window.innerWidth < 640 ? "listWeek" : "timeGridWeek"}
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: window.innerWidth < 375 ? "dayGridMonth,timeGridWeek,timeGridDay,listWeek" : window.innerWidth < 640 ? "dayGridMonth,timeGridWeek,listWeek,timeGridDay" : "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          events={events}
          selectable={true}
          editable={true}
          eventContent={eventContent}
          eventClick={(info) => {
            onEventClick && onEventClick(info.event.extendedProps.call);
          }}
          dateClick={(info) => {
            onDateClick && onDateClick(info.dateStr);
          }}
          eventDrop={(info) => {
            onEventDrop && onEventDrop(info.event.id, info.event.start);
          }}
          height="auto"
          aspectRatio={window.innerWidth < 640 ? 0.8 : 1.2}
          dayMaxEvents={window.innerWidth < 640 ? 2 : 4}
          moreLinkClick="popover"
        />
      </div>
    </>
  );
}