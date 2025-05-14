import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(optionsData);
  const [open, setOpen] = useState(false);

  // Sync preselectedOptions to selectedOptions
  useEffect(() => {
    if (Array.isArray(preselectedOptions)) {
      setSelectedOptions(preselectedOptions);
    }
  }, [preselectedOptions]);

  // Update text input and filter options
  const updateText = useCallback(
    (value) => {
      setInputValue(value);

      const filterRegex = new RegExp(value, "i");
      const resultOptions =
        value === ""
          ? optionsData
          : optionsData.filter((option) => option.label.match(filterRegex));

      setOptions(resultOptions);
      setOpen(true);
    },
    [optionsData],
  );

  // Handle selection changes
  const updateSelection = useCallback(
    (selected) => {
      if (!Array.isArray(selected)) return;

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

  // Remove tag (for multiple selection mode)
  const removeTag = useCallback(
    (tag) => () => {
      const updated = selectedOptions.filter((item) => item !== tag);
      setSelectedOptions(updated);
      onSelectChange(updated);
    },
    [selectedOptions, onSelectChange],
  );

  // Render tags for multiple selection
  const verticalContentMarkup =
    allowMultiple &&
    Array.isArray(selectedOptions) &&
    selectedOptions.length > 0 ? (
      <LegacyStack spacing="extraTight" alignment="center">
        {selectedOptions.map((value) => {
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

  // Text field configuration
  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      label={label}
      value={inputValue}
      placeholder={placeholder}
      prefix={<Icon source={SearchIcon} />}
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
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    />
  );
}

export default AutocompleteSelect;
