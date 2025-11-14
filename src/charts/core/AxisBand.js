/**
 * AxisBand
 * 밴드 축 (X축 또는 카테고리 축) 렌더링
 *
 * @param {SVGGElement} container - SVG g 요소 (축을 그릴 컨테이너)
 * @param {Object} props
 * @param {string[]} props.labels - 축에 표시할 카테고리 라벨 배열
 * @param {(lab: string) => number} props.getPos - 라벨 밴드의 시작 좌표 반환 함수
 * @param {number} props.bandWidth - 각 밴드의 픽셀 너비
 * @param {'bottom' | 'left'} props.side - 축 위치
 * @param {boolean} [props.rotate=false] - bottom일 때만 의미, true면 회전
 * @param {number} [props.fontSize=12] - 라벨 폰트 크기
 * @param {number} [props.tickPadding=20] - bottom일 때 라벨의 세로 오프셋
 */
export function renderAxisBand(
  container,
  {
    labels,
    getPos,
    bandWidth,
    side,
    rotate = false,
    fontSize = 12,
    tickPadding = 20,
  }
) {
  // 기존 내용 제거
  container.innerHTML = "";

  const isBottom = side === "bottom";

  labels.forEach((lab) => {
    const center = getPos(lab) + bandWidth / 2;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

    if (isBottom) {
      text.setAttribute("x", center);
      text.setAttribute("y", tickPadding);
      text.setAttribute("font-size", fontSize);
      text.setAttribute("fill", "#777");
      text.setAttribute("text-anchor", rotate ? "end" : "middle");
      text.setAttribute("dominant-baseline", "hanging");
      if (rotate) {
        text.setAttribute(
          "transform",
          `rotate(-40, ${center}, ${tickPadding})`
        );
      }
    } else {
      text.setAttribute("x", -20);
      text.setAttribute("y", center);
      text.setAttribute("font-size", fontSize);
      text.setAttribute("fill", "#777");
      text.setAttribute("text-anchor", "end");
      text.setAttribute("dominant-baseline", "middle");
    }

    text.textContent = lab;
    container.appendChild(text);
  });
}
