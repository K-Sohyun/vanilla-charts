export const DEFAULT_PALETTE = [
  "#73A7D9",
  "#FFC84C",
  "#95D1A9",
  "#C49BCF",
  "#FF9B66",
  "#AEC1E5",
];

/**
 * createColorScale
 * 시리즈 키별 색상 매핑 함수 생성
 *
 * @param {string[]} order - 시리즈 키 순서 배열
 * @param {Record<string, string>} [customColors] - 커스텀 색상 맵
 * @param {string[]} [palette=DEFAULT_PALETTE] - 기본 색상 팔레트
 * @returns {(key: string) => string} 키를 받아 색상을 반환하는 함수
 */
export function createColorScale(
  order,
  customColors,
  palette = DEFAULT_PALETTE
) {
  const map = new Map();
  if (customColors)
    for (const k of Object.keys(customColors)) map.set(k, customColors[k]);
  order.forEach((k, i) => {
    if (!map.has(k)) map.set(k, palette[i % palette.length]);
  });
  return (key) => map.get(key) ?? palette[0];
}
