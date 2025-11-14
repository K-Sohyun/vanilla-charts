/**
 * linearScale
 * 데이터 값(dMin~dMax)을 화면 좌표(rMin~rMax)로 선형 변환
 *
 * @param {number} dMin - 데이터 도메인 최소값
 * @param {number} dMax - 데이터 도메인 최대값
 * @param {number} rMin - 픽셀 좌표 최소값
 * @param {number} rMax - 픽셀 좌표 최대값
 * @returns {(v: number) => number} 데이터 값을 좌표로 변환하는 함수
 */
export const linearScale = (dMin, dMax, rMin, rMax) => {
  const d = dMax - dMin || 1; // 데이터 범위 (0 방지)
  const r = rMax - rMin; // 출력 범위
  return (v) => rMin + ((v - dMin) / d) * r;
};

/**
 * bandScale
 * 카테고리 라벨 배열을 일정 간격의 밴드 좌표로 변환
 *
 * @param {string[]} labels - 카테고리 라벨 배열 (예: ["1월", "2월", "3월"])
 * @param {number} rMin - 픽셀 좌표 최소값 (예: 0)
 * @param {number} rMax - 픽셀 좌표 최대값 (예: innerWidth)
 * @param {number} [gapRatio=0.2] - 간격 비율 (0~1, 막대차트는 가변, 라인차트는 고정 0.1)
 * @returns {{ getX: (lab: string) => number, bandWidth: number, gapWidth: number }}
 */
export const bandScale = (labels, rMin, rMax, gapRatio = 0.2) => {
  const n = Math.max(labels.length, 1);
  const total = rMax - rMin;

  const totalGap = total * gapRatio;
  const gapWidth = totalGap / (n + 1);
  const barWidth = (total - totalGap) / n;

  const offset = rMin + gapWidth;
  const map = new Map(
    labels.map((lab, i) => [lab, offset + i * (barWidth + gapWidth)])
  );

  return {
    getX: (lab) => map.get(lab) ?? 0,
    bandWidth: barWidth,
    gapWidth,
  };
};
