import React, { useState, useMemo } from 'react';
import { MeetingSummary } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, ViewCalendarIcon } from '../constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AttendeeAvatar } from './AttendeeAvatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MeetingCalendarViewProps {
  meetings: MeetingSummary[];
  onSelectMeeting: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MeetingCalendarView: React.FC<MeetingCalendarViewProps> = ({
  meetings,
  onSelectMeeting,
  onEdit,
  onDelete
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const meetingsByDate = meetings.reduce((acc, meeting) => {
      const dateKey = new Date(meeting.createdAt).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(meeting);
      return acc;
    }, {} as Record<string, MeetingSummary[]>);

    return { days, meetingsByDate };
  }, [meetings, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ViewCalendarIcon className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Calendar View</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold text-foreground min-w-[140px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4 flex-1 overflow-hidden flex flex-col">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto">
          {calendarData.days.map((date, index) => {
            const dateKey = date.toDateString();
            const dayMeetings = calendarData.meetingsByDate[dateKey] || [];
            const isCurrentDay = isToday(date);
            const isInCurrentMonth = isCurrentMonth(date);

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-border rounded-lg ${
                  isCurrentDay ? 'bg-primary/10 border-primary' : 'bg-card'
                } ${!isInCurrentMonth ? 'text-muted-foreground/50' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentDay ? 'text-primary font-bold' : 'text-foreground'
                }`}>
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayMeetings.slice(0, 3).map((meeting) => (
                    <TooltipProvider key={meeting.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => onSelectMeeting(meeting.id)}
                            className="p-1 bg-primary/20 hover:bg-primary/30 rounded text-xs cursor-pointer truncate transition-colors"
                          >
                            {meeting.title}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-2">
                            <p className="font-semibold">{meeting.title}</p>
                            <p className="text-sm">{new Date(meeting.createdAt).toLocaleTimeString()}</p>
                            <div className="flex items-center space-x-1">
                              {meeting.attendees.slice(0, 3).map((attendee, idx) => (
                                <AttendeeAvatar key={idx} name={attendee} className="w-4 h-4" />
                              ))}
                              {meeting.attendees.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{meeting.attendees.length - 3}</span>
                              )}
                            </div>
                            <div className="flex space-x-1 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(meeting.id);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(meeting.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}

                  {dayMeetings.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayMeetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary/20 rounded"></div>
          <span>Meeting</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-primary bg-primary/10 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default MeetingCalendarView;