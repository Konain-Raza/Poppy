import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Icon,
  Popover,
  Card,
  DatePicker,
} from '@shopify/polaris';
import { CalendarIcon } from '@shopify/polaris-icons';

const DatePickerSingle = ({ label, onDateChange, disableBefore }) => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [{ month, year }, setDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const datePickerRef = useRef(null);
  const formattedValue = selectedDate.toISOString().slice(0, 10);

  const handleDateSelection = ({ end: newSelectedDate }) => {
    setSelectedDate(newSelectedDate);
    onDateChange?.(newSelectedDate);
    setVisible(false);
  };

  useEffect(() => {
    setDate({
      month: selectedDate.getMonth(),
      year: selectedDate.getFullYear(),
    });
  }, [selectedDate]);

  return (
    <Box minWidth="100%">
      <Popover
        active={visible}
        autofocusTarget="none"
        preferredAlignment="left"
        fullWidth
        preferInputActivator={false}
        preferredPosition="below"
        preventCloseOnChildOverlayClick
        onClose={() => setVisible(false)}
        activator={
          <TextField
            role="combobox"
            label={label}
            prefix={<Icon source={CalendarIcon} />}
            value={formattedValue}
            onFocus={() => setVisible(true)}
            autoComplete="off"
            readOnly
          />
        }
      >
        <Card ref={datePickerRef}>
          <DatePicker
            month={month}
            year={year}
            selected={selectedDate}
            onMonthChange={(month, year) => setDate({ month, year })}
            onChange={handleDateSelection}
            disableDatesBefore={disableBefore} // 🚫 Block earlier dates
          />
        </Card>
      </Popover>
    </Box>
  );
};

export default DatePickerSingle;
