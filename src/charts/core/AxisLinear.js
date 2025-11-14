/**
 * AxisLinear
 * 선형 축 (Y축 또는 값 축) 렌더링
 *
 * @param {SVGGElement} container - SVG g 요소 (축을 그릴 컨테이너)
 * @param {Object} props
 * @param {number[]} props.ticks - 축에 표시할 눈금 값 배열
 * @param {(v: number) => number} props.scale - 값을 SVG 좌표로 변환하는 함수
 * @param {number} props.length - 눈금선 길이 (left면 innerWidth, bottom이면 innerHeight)
 * @param {'left' | 'bottom'} props.side - 축의 방향 결정
 * @param {boolean} [props.grid=true] - 눈금선(그리드 라인) 표시 여부
 * @param {(v: number) => string | number} [props.formatTick] - 눈금 라벨 포맷 함수
 * @param {string} [props.gridDash='4 4'] - 눈금선 점선 패턴
 * @param {number} [props.fontSize=12] - 눈금 라벨 폰트 크기
 * @param {number} [props.tickPadding=8] - 눈금 라벨과 축 사이의 여백
 */
export function renderAxisLinear(
  container,
  {
    ticks,
    scale,
    length,
    side,
    formatTick,
    grid = true,
    gridDash = "4 4",
    fontSize = 12,
    tickPadding = 8,
  }
) {
  // 기존 내용 제거
  container.innerHTML = "";

  const isLeft = side === "left";

  ticks.forEach((t, i) => {
    const pos = scale(t);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    if (isLeft) {
      // Y축 (왼쪽)
      if (grid) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", 0);
        line.setAttribute("y1", pos);
        line.setAttribute("x2", length);
        line.setAttribute("y2", pos);
        line.setAttribute("stroke", "#d7d7d7");
        line.setAttribute("stroke-dasharray", gridDash);
        line.setAttribute("shape-rendering", "crispEdges");
        g.appendChild(line);
      }

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", -tickPadding);
      text.setAttribute("y", pos);
      text.setAttribute("font-size", fontSize);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", "#777");
      text.textContent = formatTick ? formatTick(t) : t;
      g.appendChild(text);
    } else {
      // X축 (아래)
      if (grid) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", pos);
        line.setAttribute("y1", 0);
        line.setAttribute("x2", pos);
        line.setAttribute("y2", length);
        line.setAttribute("stroke", "#d7d7d7");
        line.setAttribute("stroke-dasharray", gridDash);
        line.setAttribute("shape-rendering", "crispEdges");
        g.appendChild(line);
      }

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", pos);
      text.setAttribute("y", length + 14);
      text.setAttribute("font-size", fontSize);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "hanging");
      text.setAttribute("fill", "#777");
      text.textContent = formatTick ? formatTick(t) : t;
      g.appendChild(text);
    }

    container.appendChild(g);
  });
}
