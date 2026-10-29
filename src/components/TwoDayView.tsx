import React from 'react';
// react-big-calendar does not ship types for this deep import; see
// src/types/react-big-calendar-internal.d.ts.
import TimeGrid from 'react-big-calendar/lib/TimeGrid';

interface RangeOptions {
  localizer: any;
}

interface TwoDayProps {
  date: Date;
  localizer: any;
  min?: Date;
  max?: Date;
  scrollToTime?: Date;
  enableAutoScroll?: boolean;
  [key: string]: any;
}

/**
 * Custom react-big-calendar view showing two consecutive days: the
 * navigated date and the day after it (e.g. "today" and "tomorrow" when the
 * calendar is on today). Modeled on the built-in Day/Week views, which
 * follow this same static-methods contract (range/navigate/title).
 */
function TwoDayView({
  date,
  localizer,
  min = localizer.startOf(new Date(), 'day'),
  max = localizer.endOf(new Date(), 'day'),
  scrollToTime = localizer.startOf(new Date(), 'day'),
  enableAutoScroll = true,
  ...props
}: TwoDayProps) {
  const range = TwoDayView.range(date, { localizer });
  return (
    <TimeGrid
      {...props}
      range={range}
      eventOffset={15}
      localizer={localizer}
      min={min}
      max={max}
      scrollToTime={scrollToTime}
      enableAutoScroll={enableAutoScroll}
    />
  );
}

TwoDayView.range = (date: Date, { localizer }: RangeOptions): Date[] => {
  const start = localizer.startOf(date, 'day');
  const end = localizer.add(start, 1, 'day');
  return [start, end];
};

TwoDayView.navigate = (date: Date, action: string, { localizer }: RangeOptions): Date => {
  switch (action) {
    case 'PREV':
      return localizer.add(date, -1, 'day');
    case 'NEXT':
      return localizer.add(date, 1, 'day');
    default:
      return date;
  }
};

TwoDayView.title = (date: Date, { localizer }: RangeOptions): string => {
  const range = TwoDayView.range(date, { localizer });
  return localizer.format({ start: range[0], end: range[range.length - 1] }, 'dayRangeHeaderFormat');
};

TwoDayView.defaultProps = (TimeGrid as any).defaultProps;

export default TwoDayView;
