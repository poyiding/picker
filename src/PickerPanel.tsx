/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

/**
 * Logic:
 *  When `mode` === `picker`,
 *  click will trigger `onSelect` (if value changed trigger `onChange` also).
 *  Panel change will not trigger `onSelect` but trigger `onPanelChange`
 */

import * as React from 'react';
import classNames from 'classnames';
import KeyCode from 'rc-util/lib/KeyCode';
import warning from 'rc-util/lib/warning';
import TimePanel, { SharedTimeProps } from './panels/TimePanel';
import DatetimePanel from './panels/DatetimePanel';
import DatePanel from './panels/DatePanel';
import WeekPanel from './panels/WeekPanel';
import MonthPanel from './panels/MonthPanel';
import YearPanel from './panels/YearPanel';
import DecadePanel from './panels/DecadePanel';
import { GenerateConfig } from './generate';
import {
  Locale,
  PanelMode,
  PanelRefProps,
  PickerMode,
  DisabledTime,
  OnPanelChange,
} from './interface';
import { isEqual } from './utils/dateUtil';
import PanelContext from './PanelContext';
import { DateRender } from './panels/DatePanel/DateBody';
import { PickerModeMap } from './utils/uiUtil';
import { MonthCellRender } from './panels/MonthPanel/MonthBody';
import RangeContext, { FooterSelection } from './RangeContext';
import useMergedState from './hooks/useMergeState';

export interface PickerPanelSharedProps<DateType> {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  /** @deprecated Will be removed in next big version. Please use `mode` instead */
  mode?: PanelMode;
  tabIndex?: number;

  // Locale
  locale: Locale;
  generateConfig: GenerateConfig<DateType>;

  // Value
  value?: DateType | null;
  defaultValue?: DateType;
  /** [Legacy] Set default display picker view date */
  pickerValue?: DateType;
  /** [Legacy] Set default display picker view date */
  defaultPickerValue?: DateType;

  // Date
  disabledDate?: (date: DateType) => boolean;

  // Render
  dateRender?: DateRender<DateType>;
  monthCellRender?: MonthCellRender<DateType>;
  renderExtraFooter?: (mode: PanelMode) => React.ReactNode;

  // Event
  onSelect?: (value: DateType) => void;
  onChange?: (value: DateType) => void;
  onPanelChange?: OnPanelChange<DateType>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;

  /** @private This is internal usage. Do not use in your production env */
  hideHeader?: boolean;
  /** @private This is internal usage. Do not use in your production env */
  onPickerValueChange?: (date: DateType) => void;
}

export interface PickerPanelBaseProps<DateType>
  extends PickerPanelSharedProps<DateType> {
  picker: Exclude<PickerMode, 'date' | 'time'>;
}

export interface PickerPanelDateProps<DateType>
  extends PickerPanelSharedProps<DateType> {
  picker?: 'date';
  showToday?: boolean;

  // Time
  showTime?: boolean | SharedTimeProps<DateType>;
  disabledTime?: DisabledTime<DateType>;
}

export interface PickerPanelTimeProps<DateType>
  extends PickerPanelSharedProps<DateType>,
    SharedTimeProps<DateType> {
  picker: 'time';
}

export type PickerPanelProps<DateType> =
  | PickerPanelBaseProps<DateType>
  | PickerPanelDateProps<DateType>
  | PickerPanelTimeProps<DateType>;

interface MergedPickerPanelProps<DateType>
  extends Omit<
    PickerPanelBaseProps<DateType> &
      PickerPanelDateProps<DateType> &
      PickerPanelTimeProps<DateType>,
    'picker'
  > {
  picker?: PickerMode;
}

function PickerPanel<DateType>(props: PickerPanelProps<DateType>) {
  const {
    prefixCls = 'rc-picker',
    className,
    style,
    locale,
    generateConfig,
    value,
    defaultValue,
    pickerValue,
    defaultPickerValue,
    mode,
    picker = 'date',
    tabIndex = 0,
    showTime,
    showToday,
    renderExtraFooter,
    hideHeader,
    onSelect,
    onChange,
    onPanelChange,
    onMouseDown,
    onPickerValueChange,
  } = props as MergedPickerPanelProps<DateType>;

  if (process.env.NODE_ENV !== 'production') {
    warning(
      !value || generateConfig.isValidate(value),
      'Invalidate date pass to `value`.',
    );
    warning(
      !value || generateConfig.isValidate(value),
      'Invalidate date pass to `defaultValue`.',
    );
  }

  // ============================ State =============================

  const panelContext = React.useContext(PanelContext);
  const { operationRef, panelRef: panelDivRef } = panelContext;

  const {
    extraFooterSelections,
    inRange,
    panelPosition,
    rangedValue,
    hoverRangedValue,
  } = React.useContext(RangeContext);
  const panelRef = React.useRef<PanelRefProps>({});

  // Handle init logic
  const initRef = React.useRef(true);

  // Inner value
  const [innerValue, setInnerValue] = React.useState(() => {
    if (value !== undefined) {
      return value;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return null;
  });

  const mergedValue = value !== undefined ? value : innerValue;

  // View date control
  const [viewDate, setInnerViewDate] = useMergedState<
    DateType | null,
    DateType
  >({
    value: pickerValue,
    defaultValue: defaultPickerValue || mergedValue,
    defaultStateValue: null,
    postState: date => date || generateConfig.getNow(),
  });

  const setViewDate = (date: DateType) => {
    setInnerViewDate(date);
    if (onPickerValueChange) {
      onPickerValueChange(date);
    }
  };

  // Panel control
  const getInternalNextMode = (nextMode: PanelMode): PanelMode => {
    const getNextMode = PickerModeMap[picker!];
    if (getNextMode) {
      return getNextMode(nextMode);
    }

    return nextMode;
  };

  const [innerMode, setInnerMode] = React.useState<PanelMode>(() => {
    if (picker === 'time') {
      return 'time';
    }
    return getInternalNextMode('date');
  });

  const mergedMode: PanelMode = mode || innerMode;

  // const mergedMode: PanelMode = React.useMemo(() => {
  //   const newMode = mode || innerMode;
  //   if (newMode === 'date' && showTime) {
  //     return 'datetime';
  //   }
  //   return newMode;
  // }, [mode || innerMode]);

  const onInternalPanelChange = (newMode: PanelMode, viewValue: DateType) => {
    const nextMode = getInternalNextMode(newMode);
    setInnerMode(nextMode);

    if (onPanelChange && mergedMode !== nextMode) {
      onPanelChange(viewValue, nextMode);
    }
  };

  const triggerSelect = (
    date: DateType,
    forceTriggerSelect: boolean = false,
  ) => {
    if (mergedMode === picker || forceTriggerSelect) {
      setInnerValue(date);

      if (onSelect) {
        onSelect(date);
      }

      if (onChange && !isEqual(generateConfig, date, mergedValue)) {
        onChange(date);
      }
    }
  };

  // ========================= Interactive ==========================
  const onInternalKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (panelRef.current && panelRef.current.onKeyDown) {
      if (
        [
          KeyCode.LEFT,
          KeyCode.RIGHT,
          KeyCode.UP,
          KeyCode.DOWN,
          KeyCode.PAGE_UP,
          KeyCode.PAGE_DOWN,
          KeyCode.ENTER,
        ].includes(e.which)
      ) {
        e.preventDefault();
      }
      return panelRef.current.onKeyDown(e);
    }

    /* istanbul ignore next */
    /* eslint-disable no-lone-blocks */
    {
      warning(
        false,
        'Panel not correct handle keyDown event. Please help to fire issue about this.',
      );
      return false;
    }
    /* eslint-enable no-lone-blocks */
  };

  const onInternalBlur: React.FocusEventHandler<HTMLElement> = e => {
    if (panelRef.current && panelRef.current.onBlur) {
      panelRef.current.onBlur(e);
    }
  };

  if (operationRef) {
    operationRef.current = {
      onKeyDown: onInternalKeyDown,
      onClose: () => {
        if (panelRef.current && panelRef.current.onClose) {
          panelRef.current.onClose();
        }
      },
    };
  }

  // ============================ Effect ============================
  React.useEffect(() => {
    if (value && !initRef.current) {
      setInnerViewDate(value);
    }
  }, [value]);

  React.useEffect(() => {
    initRef.current = false;
  }, []);

  // ============================ Panels ============================
  let panelNode: React.ReactNode;

  const pickerProps = {
    ...(props as MergedPickerPanelProps<DateType>),
    operationRef: panelRef,
    prefixCls,
    viewDate,
    value: mergedValue,
    onViewDateChange: setViewDate,
    onPanelChange: onInternalPanelChange,
  };
  delete pickerProps.onChange;
  delete pickerProps.onSelect;

  switch (mergedMode) {
    case 'decade':
      panelNode = (
        <DecadePanel<DateType>
          {...pickerProps}
          onSelect={date => {
            setViewDate(date);
            triggerSelect(date);
          }}
        />
      );
      break;

    case 'year':
      panelNode = (
        <YearPanel<DateType>
          {...pickerProps}
          onSelect={date => {
            setViewDate(date);
            triggerSelect(date);
          }}
        />
      );
      break;

    case 'month':
      panelNode = (
        <MonthPanel<DateType>
          {...pickerProps}
          onSelect={date => {
            setViewDate(date);
            triggerSelect(date);
          }}
        />
      );
      break;

    case 'week':
      panelNode = (
        <WeekPanel
          {...pickerProps}
          onSelect={date => {
            setViewDate(date);
            triggerSelect(date);
          }}
        />
      );
      break;

    case 'time':
      delete pickerProps.showTime;
      panelNode = (
        <TimePanel<DateType>
          {...pickerProps}
          {...(typeof showTime === 'object' ? showTime : null)}
          onSelect={date => {
            setViewDate(date);
            triggerSelect(date);
          }}
        />
      );
      break;

    default:
      if (showTime) {
        panelNode = (
          <DatetimePanel
            {...pickerProps}
            onSelect={date => {
              setViewDate(date);
              triggerSelect(date);
            }}
          />
        );
      } else {
        panelNode = (
          <DatePanel<DateType>
            {...pickerProps}
            onSelect={date => {
              setViewDate(date);
              triggerSelect(date);
            }}
          />
        );
      }
  }

  // ============================ Footer ============================
  let extraFooter: React.ReactNode;
  if (renderExtraFooter) {
    extraFooter = (
      <div className={`${prefixCls}-footer-extra`}>
        {renderExtraFooter(mergedMode)}
      </div>
    );
  }

  let todayNode: React.ReactNode;
  if (showToday && mergedMode === 'date' && picker === 'date' && !showTime) {
    todayNode = (
      <a
        className={`${prefixCls}-today-btn`}
        onClick={() => {
          triggerSelect(generateConfig.getNow(), true);
        }}
      >
        {locale.today}
      </a>
    );
  }

  let extraSelectionNode: React.ReactNode;
  let mergedSelections: FooterSelection[] = [];

  if (extraFooterSelections && extraFooterSelections.length) {
    mergedSelections = extraFooterSelections;
  } else if (showTime && !inRange) {
    mergedSelections.push({
      label: locale.now,
      onClick: () => {
        triggerSelect(generateConfig.getNow(), true);
      },
    });
  }

  if (mergedSelections.length) {
    extraSelectionNode = (
      <ul className={`${prefixCls}-ranges`}>
        {mergedSelections.map(({ label, onClick }) => (
          <li key={label} onClick={onClick}>
            {label}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <PanelContext.Provider
      value={{
        ...panelContext,
        hideHeader:
          'hideHeader' in props ? hideHeader : panelContext.hideHeader,
        hidePrevBtn: inRange && panelPosition === 'right',
        hideNextBtn: inRange && panelPosition === 'left',
      }}
    >
      <div
        tabIndex={tabIndex}
        className={classNames(`${prefixCls}-panel`, className, {
          [`${prefixCls}-panel-has-range`]:
            rangedValue && rangedValue[0] && rangedValue[1],
          [`${prefixCls}-panel-has-range-hover`]:
            hoverRangedValue && hoverRangedValue[0] && hoverRangedValue[1],
        })}
        style={style}
        onKeyDown={onInternalKeyDown}
        onBlur={onInternalBlur}
        onMouseDown={onMouseDown}
        ref={panelDivRef}
      >
        {panelNode}
        {extraFooter || todayNode || extraSelectionNode ? (
          <div className={`${prefixCls}-footer`}>
            {extraFooter}
            {extraSelectionNode}
            {todayNode}
          </div>
        ) : null}
      </div>
    </PanelContext.Provider>
  );
}

export default PickerPanel;
/* eslint-enable */
