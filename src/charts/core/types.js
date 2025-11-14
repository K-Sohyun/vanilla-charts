/**
 * @typedef {Object} Padding
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 * @property {number} left
 */

/**
 * Y축 눈금 설정 타입
 * - number[]           직접 지정 (예: [0, 25, 50, 75, 100])
 * - { step: number }   간격 지정 (예: { step: 20 } → 0, 20, 40, 60, ...)
 * - { count: number }  개수 지정 (예: { count: 5 } → 구간을 5등분하여 6개 눈금 생성)
 *
 * @typedef {number[] | { step: number } | { count: number }} YTicks
 */

export {};
