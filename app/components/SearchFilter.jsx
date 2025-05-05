import React, { useState, useCallback, useMemo } from "react";
import { Autocomplete, Icon, Tag, LegacyStack } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

function AutocompleteSelect({
  optionsData,
  label,
  placeholder,
  onSelectChange,
  allowMultiple = true,
  preselectedOptions = [],
  disable,
  error,
}) {
  const [selectedOptions, setSelectedOptions] = useState(preselectedOptions);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(optionsData);
  const [open, setOpen] = useState(false); // NEW: control open/close manually

  const updateText = useCallback(
    (value) => {
      setInputValue(value);

      if (value === "") {
        setOptions(optionsData);
      } else {
        const filterRegex = new RegExp(value, "i");
        const resultOptions = optionsData.filter((option) =>
          option.label.match(filterRegex),
        );
        setOptions(resultOptions);
      }

      setOpen(true); // Always open options when typing
    },
    [optionsData],
  );

  const updateSelection = useCallback(
    (selected) => {
      let newSelection = selected;

      if (!allowMultiple) {
        newSelection = selected.slice(-1);
        const matchedOption = options.find(
          (opt) => opt.value === newSelection[0],
        );
        setInputValue(matchedOption?.label || "");
      } else {
        setInputValue("");
      }

      setSelectedOptions(newSelection);
      onSelectChange(newSelection);
    },
    [allowMultiple, options, onSelectChange],
  );

  const removeTag = useCallback(
    (tag) => () => {
      const updated = selectedOptions.filter((item) => item !== tag);
      setSelectedOptions(updated);
      onSelectChange(updated);
    },
    [selectedOptions, onSelectChange],
  );

  const verticalContentMarkup =
    allowMultiple && selectedOptions.length > 0 ? (
      <LegacyStack spacing="extraTight" alignment="center">
        {Array.isArray(selectedOptions) &&
          selectedOptions.length > 0 &&
          selectedOptions.map((value) => {
            const matchedLabel =
              optionsData.find((o) => o.value === value)?.label || value;
            return (
              <Tag key={value} onRemove={removeTag(value)}>
                {matchedLabel}
              </Tag>
            );
          })}
      </LegacyStack>
    ) : null;

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      onFocus={() => {
        setOptions(optionsData); // Load all options again
        setOpen(true); // NEW: open options when field is focused
      }}
      label={label}
      value={inputValue}
      placeholder={placeholder}
      prefix={<Icon source={SearchIcon} tone="base" />}
      verticalContent={verticalContentMarkup}
      autoComplete="off"
      error={error}
      disabled={disable}
    />
  );

  return (
    <Autocomplete
      options={options}
      selected={selectedOptions}
      onSelect={updateSelection}
      textField={textField}
      allowMultiple={allowMultiple}
      open={open} // NEW: control open
      onOpen={() => setOpen(true)} // NEW: set open true
      onClose={() => setOpen(false)} // NEW: set open false
    />
  );
}

export default AutocompleteSelect;
