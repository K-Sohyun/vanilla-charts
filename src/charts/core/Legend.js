/**
 * renderLegend
 * 범례 렌더링 (HTML DOM)
 *
 * @param {HTMLElement|null} container - 범례를 그릴 컨테이너 (null이면 요소만 반환)
 * @param {Object} props
 * @param {string[]} props.seriesOrder - 시리즈 키 순서 배열
 * @param {Record<string, string>} props.seriesLabels - 시리즈 키별 라벨 맵
 * @param {(key: string) => string} [props.getColor] - 색상 반환 함수
 * @param {Record<string, string>} [props.colors] - 색상 맵 (getColor 없을 때 사용)
 * @param {'top' | 'right'} [props.position='top'] - 범례 위치
 * @returns {HTMLElement} 생성된 범례 요소
 */
export function renderLegend(
  container,
  { seriesOrder, seriesLabels, getColor, colors, position = "top" }
) {
  // 기존 내용 제거 (container가 있을 때만)
  if (container) {
    container.innerHTML = "";
  }

  const colorOf = getColor ?? ((k) => colors?.[k] ?? "#9ca3af");

  // 범례 컨테이너
  const legend = document.createElement("div");
  legend.className =
    position === "right" ? "chart-legend chart-legend--right" : "chart-legend";

  seriesOrder.forEach((key) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const colorBox = document.createElement("div");
    colorBox.className = "legend-color";
    colorBox.style.backgroundColor = colorOf(key);

    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = seriesLabels[key] ?? key;

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  });

  if (container) {
    container.appendChild(legend);
  }

  return legend;
}
