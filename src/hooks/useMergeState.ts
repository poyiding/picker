import * as React from 'react';

export default function useMergedState<T, R = T>({
  value,
  defaultValue,
  defaultStateValue,
  onChange,
  postState,
}: {
  value?: T;
  defaultValue?: T | (() => T);
  defaultStateValue: T | (() => T);
  onChange?: (value: T, prevValue: T) => void;
  postState?: (value: T) => T;
}): [R, (value: T) => void] {
  const [innerValue, setInnerValue] = React.useState<T>(() => {
    if (value !== undefined) {
      return value;
    }
    if (defaultValue !== undefined) {
      return typeof defaultValue === 'function'
        ? (defaultValue as any)()
        : defaultValue;
    }
    return typeof defaultStateValue === 'function'
      ? (defaultStateValue as any)()
      : defaultStateValue;
  });

  let mergedValue = value !== undefined ? value : innerValue;
  if (postState) {
    mergedValue = postState(mergedValue);
  }

  function triggerChange(newValue: T) {
    setInnerValue(newValue);

    if (mergedValue !== newValue && onChange) {
      onChange(newValue, mergedValue);
    }
  }

  return [(mergedValue as unknown) as R, triggerChange];
}
