import { createChartWrapper } from "../core/ChartWrapper.js";
import { linearScale, bandScale } from "../core/scales.js";
import { makeTicks } from "../core/ticks.js";
import { renderAxisLinear } from "../core/AxisLinear.js";
import { renderAxisBand } from "../core/AxisBand.js";

/**
 * @typedef {Object} LineDatum
 * @property {string} label
 * @property {number} value
 */

/**
 * @typedef {Object} ValueAxisOpts
 * @property {number} [min]
 * @property {number} [max]
 * @property {import('../core/types').YTicks} [ticks]
 * @property {(v: number) => string | number} [formatTick]
 */

/**
 * createLineChart
 * 단일 라인 차트 생성
 *
 * @param {HTMLElement} container - 차트를 그릴 컨테이너
 * @param {Object} props
 * @param {LineDatum[]} props.data - 차트 데이터
 * @param {number} [props.width] - 차트 너비 (고정 너비, 없으면 반응형)
 * @param {number} [props.height=360] - 차트 높이
 * @param {string} [props.color='#4f83cc'] - 선 & 포인트 색상
 * @param {number} [props.strokeWidth=2] - 선 두께
 * @param {boolean} [props.showDots=true] - 포인트 표시 여부
 * @param {number} [props.dotRadius=3] - 포인트 반지름
 * @param {boolean} [props.rotateLabels=false] - X축 라벨 회전 여부
 * @param {number} [props.categoryGap=0.2] - 카테고리 간격 비율
 * @param {ValueAxisOpts} [props.valueAxis] - 값 축 설정
 * @param {Partial<import('../core/types').Padding>} [props.framePadding] - 프레임 패딩
 * @param {boolean} [props.area=false] - 영역(면) 채우기 여부
 * @returns {{ update: (newData: LineDatum[]) => void, destroy: () => void }}
 */
export function createLineChart(
  container,
  {
    data,
    width,
    height = 360,
    color = "#4f83cc",
    strokeWidth = 2,
    showDots = true,
    dotRadius = 3,
    rotateLabels = false,
    categoryGap = 0.2,
    valueAxis,
    framePadding,
    area = false,
  }
) {
  // 컨테이너 초기화
  container.innerHTML = "";
  container.style.position = "relative";
  container.classList.add("chart-wrapper");

  // 툴팁 생성
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.style.cssText =
    "display: none; position: absolute; pointer-events: none;";
  container.appendChild(tooltip);

  let currentData = data;

  // 차트 래퍼 생성
  const chartWrapper = createChartWrapper(container, {
    width,
    height,
    framePadding,
    render: ({ innerWidth, innerHeight, svg, g }) => {
      // 기존 내용 제거
      g.innerHTML = "";

      const labels = currentData.map((d) => d.label);
      const values = currentData.map((d) => Math.max(0, d.value));
      const dataMax = values.length ? Math.max(...values, 0) : 0;

      const vMin = valueAxis?.min ?? 0;
      const vMaxRaw = valueAxis?.max ?? dataMax;
      const vMax = vMaxRaw === vMin ? vMin + 1 : vMaxRaw;
      const ticks = makeTicks(vMin, vMax, valueAxis?.ticks);

      // 스케일 생성
      const xBand = bandScale(labels, 0, innerWidth, categoryGap);
      const yScale = linearScale(vMin, vMax, innerHeight, 0);

      // 포인트 계산
      const points = currentData.map((d) => {
        const cx = xBand.getX(d.label) + xBand.bandWidth / 2;
        const cy = yScale(Math.max(0, d.value));
        return { ...d, cx, cy };
      });

      // 선 경로 (path d 속성)
      let lineD = "";
      if (points.length) {
        const [first, ...rest] = points;
        lineD =
          `M ${first.cx} ${first.cy} ` +
          rest.map((p) => `L ${p.cx} ${p.cy}`).join(" ");
      }

      // 영역 경로 (area)
      let areaD = "";
      if (area && points.length) {
        const baselineY = yScale(vMin);
        const [first, ...rest] = points;
        const main =
          `M ${first.cx} ${first.cy} ` +
          rest.map((p) => `L ${p.cx} ${p.cy}`).join(" ");
        const closing = `L ${points[points.length - 1].cx} ${baselineY} L ${
          first.cx
        } ${baselineY} Z`;
        areaD = `${main} ${closing}`;
      }

      // 1) Y축
      const axisLinearG = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      renderAxisLinear(axisLinearG, {
        ticks,
        scale: yScale,
        length: innerWidth,
        side: "left",
        grid: true,
        formatTick: valueAxis?.formatTick,
      });
      g.appendChild(axisLinearG);

      // 2) X축
      const axisBandG = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      axisBandG.setAttribute("transform", `translate(0, ${innerHeight})`);
      renderAxisBand(axisBandG, {
        labels,
        getPos: xBand.getX,
        bandWidth: xBand.bandWidth,
        side: "bottom",
        rotate: rotateLabels,
        tickPadding: 20,
      });
      g.appendChild(axisBandG);

      // 3) 영역 (area)
      if (area && areaD) {
        const areaPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        areaPath.setAttribute("d", areaD);
        areaPath.setAttribute("fill", color);
        areaPath.classList.add("line-area");
        g.appendChild(areaPath);
      }

      // 4) 선 (line)
      const linePath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      linePath.setAttribute("d", lineD);
      linePath.setAttribute("fill", "none");
      linePath.setAttribute("stroke", color);
      linePath.setAttribute("stroke-width", strokeWidth);
      linePath.setAttribute("stroke-linecap", "round");
      linePath.setAttribute("stroke-linejoin", "round");
      linePath.setAttribute("pathLength", "1"); // CSS 애니메이션용
      linePath.classList.add("line-path");
      g.appendChild(linePath);

      // 5) 포인트 (dots)
      if (showDots) {
        points.forEach((p) => {
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circle.setAttribute("cx", p.cx);
          circle.setAttribute("cy", p.cy);
          circle.setAttribute("r", dotRadius);
          circle.setAttribute("fill", color);
          circle.classList.add("line-dot");

          // 툴팁 이벤트
          circle.addEventListener("mouseenter", (e) => {
            const containerRect = container.getBoundingClientRect();
            tooltip.style.display = "block";
            tooltip.style.left = `${e.clientX - containerRect.left}px`;
            tooltip.style.top = `${e.clientY - containerRect.top - 8}px`;
            tooltip.innerHTML = `<strong>${
              p.label
            }</strong> · ${p.value.toLocaleString()}`;
          });

          circle.addEventListener("mousemove", (e) => {
            const containerRect = container.getBoundingClientRect();
            tooltip.style.left = `${e.clientX - containerRect.left}px`;
            tooltip.style.top = `${e.clientY - containerRect.top - 8}px`;
          });

          circle.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          });
          g.appendChild(circle);
        });
      }
    },
  });

  return {
    /**
     * 데이터 업데이트
     * @param {LineDatum[]} newData
     */
    update(newData) {
      currentData = newData;
      chartWrapper.update();
    },

    /**
     * 차트 제거
     */
    destroy() {
      chartWrapper.destroy();
    },
  };
}
