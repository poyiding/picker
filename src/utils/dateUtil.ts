import { noteOnce } from 'rc-util/lib/warning';
import { GenerateConfig } from '../generate';
import { NullableDateType, PickerMode } from '../interface';

export const WEEK_DAY_COUNT = 7;

export function isNullEqual<T>(value1: T, value2: T): boolean | undefined {
  if (!value1 && !value2) {
    return true;
  }
  if (!value1 || !value2) {
    return false;
  }
  return undefined;
}

export function isSameYear<DateType>(
  generateConfig: GenerateConfig<DateType>,
  year1: NullableDateType<DateType>,
  year2: NullableDateType<DateType>,
) {
  const equal = isNullEqual(year1, year2);
  if (typeof equal === 'boolean') {
    return equal;
  }

  return generateConfig.getYear(year1!) === generateConfig.getYear(year2!);
}

export function isSameMonth<DateType>(
  generateConfig: GenerateConfig<DateType>,
  month1: NullableDateType<DateType>,
  month2: NullableDateType<DateType>,
) {
  const equal = isNullEqual(month1, month2);
  if (typeof equal === 'boolean') {
    return equal;
  }

  return (
    isSameYear(generateConfig, month1, month2) &&
    generateConfig.getMonth(month1!) === generateConfig.getMonth(month2!)
  );
}

export function isSameDate<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date1: NullableDateType<DateType>,
  date2: NullableDateType<DateType>,
) {
  const equal = isNullEqual(date1, date2);
  if (typeof equal === 'boolean') {
    return equal;
  }

  return (
    generateConfig.getYear(date1!) === generateConfig.getYear(date2!) &&
    generateConfig.getMonth(date1!) === generateConfig.getMonth(date2!) &&
    generateConfig.getDate(date1!) === generateConfig.getDate(date2!)
  );
}

export function isSameTime<DateType>(
  generateConfig: GenerateConfig<DateType>,
  time1: NullableDateType<DateType>,
  time2: NullableDateType<DateType>,
) {
  const equal = isNullEqual(time1, time2);
  if (typeof equal === 'boolean') {
    return equal;
  }

  return (
    generateConfig.getHour(time1!) === generateConfig.getHour(time2!) &&
    generateConfig.getMinute(time1!) === generateConfig.getMinute(time2!) &&
    generateConfig.getSecond(time1!) === generateConfig.getSecond(time2!)
  );
}

export function isSameWeek<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: string,
  date1: NullableDateType<DateType>,
  date2: NullableDateType<DateType>,
) {
  const equal = isNullEqual(date1, date2);
  if (typeof equal === 'boolean') {
    return equal;
  }

  return (
    generateConfig.locale.getWeek(locale, date1!) ===
    generateConfig.locale.getWeek(locale, date2!)
  );
}

export function isEqual<DateType>(
  generateConfig: GenerateConfig<DateType>,
  value1: NullableDateType<DateType>,
  value2: NullableDateType<DateType>,
) {
  return (
    isSameDate(generateConfig, value1, value2) &&
    isSameTime(generateConfig, value1, value2)
  );
}

/** Between in date but not equal of date */
export function isInRange<DateType>(
  generateConfig: GenerateConfig<DateType>,
  startDate: NullableDateType<DateType>,
  endDate: NullableDateType<DateType>,
  current: NullableDateType<DateType>,
) {
  if (!startDate || !endDate || !current) {
    return false;
  }

  return (
    !isSameDate(generateConfig, startDate, current) &&
    !isSameDate(generateConfig, endDate, current) &&
    generateConfig.isAfter(current, startDate) &&
    generateConfig.isAfter(endDate, current)
  );
}

export function getWeekStartDate<DateType>(
  locale: string,
  generateConfig: GenerateConfig<DateType>,
  value: DateType,
) {
  const weekFirstDay = generateConfig.locale.getWeekFirstDay(locale);
  const monthStartDate = generateConfig.setDate(value, 1);

  for (let i = 0; i < 7; i += 1) {
    const current = generateConfig.addDate(monthStartDate, -i);
    if (generateConfig.getWeekDay(current) === weekFirstDay) {
      return current;
    }
  }

  /* istanbul ignore next */
  /* eslint-disable no-lone-blocks */
  {
    noteOnce(
      false,
      'Not find week start date. Please check your `generateConfig`. If using default `generateConfig`, please help to fire a issue.',
    );
    return value;
  }
}

export function getClosingViewDate<DateType>(
  viewDate: DateType,
  picker: PickerMode,
  generateConfig: GenerateConfig<DateType>,
  offset: number = 1,
): DateType {
  switch (picker) {
    case 'year':
      return generateConfig.addYear(viewDate, offset * 10);
    case 'month':
      return generateConfig.addYear(viewDate, offset);
    default:
      return generateConfig.addMonth(viewDate, offset);
  }
}
