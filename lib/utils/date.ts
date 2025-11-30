import { DateTime } from 'luxon'

/**
 * 날짜 유틸리티 함수
 * YYYY-MM-DD 형식의 날짜 문자열을 다루는 유틸리티
 */

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 검증합니다.
 */
export function isValidDateString(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}

/**
 * ISO 형식(YYYY-MM-DDTHH:mm:ss.sssZ) 또는 YYYY-MM-DD 형식의 날짜 문자열을
 * YYYY-MM-DD 형식으로 변환합니다.
 */
export function normalizeDateString(dateString: string): string {
  // ISO 형식인 경우 (예: "2024-01-01T00:00:00.000Z")
  if (dateString.includes('T')) {
    return dateString.split('T')[0]
  }
  // 이미 YYYY-MM-DD 형식인 경우
  return dateString
}

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 DateTime 객체로 변환합니다.
 * @throws {Error} 유효하지 않은 날짜 형식인 경우
 */
export function parseDateString(dateString: string): DateTime {
  if (!isValidDateString(dateString)) {
    throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.')
  }

  const dateTime = DateTime.fromISO(dateString, { zone: 'utc' })
  
  if (!dateTime.isValid) {
    throw new Error('잘못된 날짜 형식입니다.')
  }

  return dateTime.startOf('day')
}

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 Date 객체로 변환합니다.
 * 데이터베이스에 저장하기 위해 사용됩니다.
 */
export function parseDateStringToDate(dateString: string): Date {
  const dateTime = parseDateString(dateString)
  return dateTime.toJSDate()
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 */
export function formatDateToString(date: Date): string {
  return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
}

/**
 * DateTime 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 */
export function formatDateTimeToString(dateTime: DateTime): string {
  return dateTime.toFormat('yyyy-MM-dd')
}

/**
 * 특정 년/월의 시작일과 종료일을 반환합니다.
 */
export function getMonthRange(year: number, month: number): { start: DateTime; end: DateTime } {
  const start = DateTime.utc(year, month, 1).startOf('day')
  const end = start.endOf('month')
  return { start, end }
}

/**
 * 특정 년의 시작일과 종료일을 반환합니다.
 */
export function getYearRange(year: number): { start: DateTime; end: DateTime } {
  const start = DateTime.utc(year, 1, 1).startOf('day')
  const end = DateTime.utc(year, 12, 31).startOf('day')
  return { start, end }
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getTodayString(): string {
  return DateTime.utc().toFormat('yyyy-MM-dd')
}

/**
 * 현재 날짜의 DateTime 객체를 반환합니다 (시간 제거).
 */
export function getToday(): DateTime {
  return DateTime.utc().startOf('day')
}

/**
 * N개월 전의 날짜를 반환합니다.
 */
export function getMonthsAgo(months: number): DateTime {
  return DateTime.utc().minus({ months }).startOf('day')
}

/**
 * N년 전의 날짜를 반환합니다.
 */
export function getYearsAgo(years: number): DateTime {
  return DateTime.utc().minus({ years }).startOf('day')
}

