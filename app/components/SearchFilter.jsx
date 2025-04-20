import React, { useState, useCallback, useMemo } from 'react';
import { Autocomplete, Icon, Tag, LegacyStack } from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';

function AutocompleteSelect({
  optionsData,
  label,
  placeholder,
  onSelectChange,
  allowMultiple = true,
  preselectedOptions = [],
  disable,
  error
}) {
  const [selectedOptions, setSelectedOptions] = useState(preselectedOptions);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState(optionsData);

  const updateText = useCallback(
    (value) => {
      setInputValue(value);

      if (value === '') {
        setOptions(optionsData);
        return;
      }

      const filterRegex = new RegExp(value, 'i');
      const resultOptions = optionsData.filter((option) =>
        option.label.match(filterRegex)
      );
      setOptions(resultOptions);
    },
    [optionsData]
  );

  const updateSelection = useCallback(
    (selected) => {
      let newSelection = selected;

      if (!allowMultiple) {
        // Only keep the latest selected value in single-select mode
        newSelection = selected.slice(-1);
        const matchedOption = options.find((opt) => opt.value === newSelection[0]);
        setInputValue(matchedOption?.label || '');
      } else {
        setInputValue('');
      }

      setSelectedOptions(newSelection);
      onSelectChange(newSelection);
    },
    [allowMultiple, options, onSelectChange]
  );

  const removeTag = useCallback(
    (tag) => () => {
      const updated = selectedOptions.filter((item) => item !== tag);
      setSelectedOptions(updated);
      onSelectChange(updated);
    },
    [selectedOptions, onSelectChange]
  );

  const verticalContentMarkup =
    allowMultiple && selectedOptions.length > 0 ? (
      <LegacyStack spacing="extraTight" alignment="center">
        {selectedOptions.map((value) => {
          const matchedLabel = optionsData.find((o) => o.value === value)?.label || value;
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
    />
  );
}

export default AutocompleteSelect;
