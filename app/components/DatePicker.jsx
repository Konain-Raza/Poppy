import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Icon,
  Popover,
  Card,
  DatePicker,
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";

const DatePickerSingle = ({
  label,
  selectedDate: propSelectedDate,
  onDateChange,
  disableBefore,
}) => {
  console.log("Disable ", disableBefore);
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    propSelectedDate || new Date(),
  );
  const [{ month, year }, setDate] = useState({
    month: (propSelectedDate || new Date()).getMonth(),
    year: (propSelectedDate || new Date()).getFullYear(),
  });

  const datePickerRef = useRef(null);
  
  const formatDateValue = (date) => {
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return localDate.toLocaleDateString("en-CA");
  };
  
  const formattedValue = formatDateValue(selectedDate);

  const handleDateSelection = ({ end: newSelectedDate }) => {
    const normalizedDate = new Date(
      newSelectedDate.getFullYear(),
      newSelectedDate.getMonth(),
      newSelectedDate.getDate()
    );
    normalizedDate.setDate(normalizedDate.getDate() + 1);
    
    setSelectedDate(normalizedDate);
    onDateChange?.(normalizedDate);
    setVisible(false);
  };

 useEffect(() => {
  if (
    propSelectedDate &&
    propSelectedDate instanceof Date &&
    !isNaN(propSelectedDate.getTime())
  ) {
    const normalizedDate = new Date(
      propSelectedDate.getFullYear(),
      propSelectedDate.getMonth(),
      propSelectedDate.getDate()
    );

    // Subtract one day
    normalizedDate.setDate(normalizedDate.getDate() - 1);

    setSelectedDate(normalizedDate);
    setDate({
      month: normalizedDate.getMonth(),
      year: normalizedDate.getFullYear(),
    });
  }
}, [propSelectedDate]);


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
            disableDatesBefore={disableBefore}
          />
        </Card>
      </Popover>
    </Box>
  );
};

export default DatePickerSingle;