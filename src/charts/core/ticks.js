/**
 * Y축 눈금 설정 타입
 * - number[]           직접 지정 (예: [0, 25, 50, 75, 100])
 * - { step: number }   간격 지정 (예: { step: 20 } → 0, 20, 40, 60, ...)
 * - { count: number }  개수 지정 (예: { count: 5 } → 구간을 5등분하여 6개 눈금 생성)
 *
 * @typedef {import('./types').YTicks} YTicks
 */

/**
 * makeTicks
 * Y축 눈금 생성 유틸
 *
 * @param {number} yMin - Y축 최소값
 * @param {number} yMax - Y축 최대값
 * @param {YTicks} [ticks] - 눈금 설정
 * @returns {number[]} 눈금 값 배열
 */
export function makeTicks(yMin, yMax, ticks) {
  if (!ticks) {
    const mid = Math.round((yMin + yMax) / 2);
    return [yMin, mid, yMax];
  }
  if (Array.isArray(ticks)) return ticks;

  if ("step" in ticks) {
    const step = Math.max(1, ticks.step);
    const start = Math.ceil(yMin / step) * step;
    const arr = [];
    for (let v = start; v <= yMax; v += step) arr.push(v);
    if (arr[0] !== yMin) arr.unshift(yMin);
    if (arr[arr.length - 1] !== yMax) arr.push(yMax);
    return arr;
  }

  if ("count" in ticks) {
    const count = Math.max(1, Math.floor(ticks.count));
    const arr = [];
    for (let i = 0; i <= count; i++) {
      const t = yMin + ((yMax - yMin) * i) / count;
      arr.push(Math.round(t));
    }
    return arr;
  }

  return [yMin, yMax];
}
