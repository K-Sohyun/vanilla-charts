import { createChartWrapper } from "../core/ChartWrapper.js";
import { linearScale, bandScale } from "../core/scales.js";
import { makeTicks } from "../core/ticks.js";
import { renderAxisLinear } from "../core/AxisLinear.js";
import { renderAxisBand } from "../core/AxisBand.js";

/**
 * @typedef {Object} BarDatum
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
 * createBarChart
 * 단일 막대 차트 생성
 *
 * @param {HTMLElement} container - 차트를 그릴 컨테이너
 * @param {Object} props
 * @param {BarDatum[]} props.data - 차트 데이터
 * @param {'vertical' | 'horizontal'} [props.orientation='vertical'] - 차트 방향
 * @param {number} [props.width] - 차트 너비 (고정 너비, 없으면 반응형)
 * @param {number} [props.height=360] - 차트 높이
 * @param {string} [props.barColor='#73a7d9'] - 막대 색상
 * @param {boolean} [props.rotateLabels=false] - X축 라벨 회전 여부
 * @param {number} [props.categoryGap=0.2] - 카테고리 간격 비율
 * @param {ValueAxisOpts} [props.valueAxis] - 값 축 설정
 * @param {Partial<import('../core/types').Padding>} [props.framePadding] - 프레임 패딩
 * @returns {{ update: (newData: BarDatum[]) => void, destroy: () => void }}
 */
export function createBarChart(
  container,
  {
    data,
    orientation = "vertical",
    width,
    height = 360,
    barColor = "#73a7d9",
    rotateLabels = false,
    categoryGap = 0.2,
    valueAxis,
    framePadding,
  }
) {
  // 컨테이너 초기화
  container.innerHTML = "";
  container.style.position = "relative";
  container.classList.add(
    "chart-wrapper",
    orientation === "vertical" ? "bar-chart--vert" : "bar-chart--hori"
  );

  // 툴팁 생성
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.style.cssText =
    "display: none; position: absolute; pointer-events: none;";
  container.appendChild(tooltip);

  let currentData = data;
  let isAnimated = false;
  let animationFrameId = null;

  // 차트 래퍼 생성
  const chartWrapper = createChartWrapper(container, {
    width,
    height,
    framePadding,
    render: ({ innerWidth, innerHeight, svg, g }) => {
      // 기존 내용 제거
      g.innerHTML = "";

      const labels = currentData.map((d) => d.label);
      const values = currentData.map((d) => d.value);
      const dataMax = values.length ? Math.max(...values, 0) : 0;

      const isVertical = orientation === "vertical";
      const vMin = valueAxis?.min ?? 0;
      const vMaxRaw = valueAxis?.max ?? dataMax;
      const vMax = vMaxRaw === vMin ? vMin + 1 : vMaxRaw;
      const ticks = makeTicks(vMin, vMax, valueAxis?.ticks);

      // 스케일 생성
      const band = isVertical
        ? bandScale(labels, 0, innerWidth, categoryGap)
        : bandScale(labels, 0, innerHeight, categoryGap);

      const valueScale = isVertical
        ? linearScale(vMin, vMax, innerHeight, 0)
        : linearScale(vMin, vMax, 0, innerWidth);

      // 1) 값 축
      const axisLinearG = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      renderAxisLinear(axisLinearG, {
        ticks,
        scale: valueScale,
        length: isVertical ? innerWidth : innerHeight,
        side: isVertical ? "left" : "bottom",
        grid: true,
        formatTick: valueAxis?.formatTick,
      });
      g.appendChild(axisLinearG);

      // 2) 범주 축
      const axisBandG = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      if (isVertical) {
        axisBandG.setAttribute("transform", `translate(0, ${innerHeight})`);
      }
      renderAxisBand(axisBandG, {
        labels,
        getPos: band.getX,
        bandWidth: band.bandWidth,
        side: isVertical ? "bottom" : "left",
        rotate: rotateLabels,
        tickPadding: 20,
      });
      g.appendChild(axisBandG);

      // 3) 막대 그리기
      currentData.forEach((d, i) => {
        const safeValue = Math.max(0, d.value);

        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("fill", barColor);
        rect.setAttribute("rx", "6");
        rect.classList.add("bar");
        rect.style.transitionDelay = `${i * 40}ms`;

        if (isVertical) {
          const x = band.getX(d.label);
          const bw = band.bandWidth;
          const y1 = valueScale(safeValue);
          const h = innerHeight - y1;

          rect.setAttribute("x", x);
          rect.setAttribute("y", y1);
          rect.setAttribute("width", bw);
          rect.setAttribute("height", h);
        } else {
          const yPos = band.getX(d.label);
          const bh = band.bandWidth;
          const x0 = valueScale(0);
          const x1 = valueScale(safeValue);
          const x = Math.min(x0, x1);
          const w = Math.abs(x1 - x0);

          rect.setAttribute("x", x);
          rect.setAttribute("y", yPos);
          rect.setAttribute("width", w);
          rect.setAttribute("height", bh);
        }

        // 툴팁 이벤트
        rect.addEventListener("mouseenter", (e) => {
          const containerRect = container.getBoundingClientRect();
          tooltip.style.display = "block";
          tooltip.style.left = `${e.clientX - containerRect.left}px`;
          tooltip.style.top = `${e.clientY - containerRect.top - 8}px`;
          tooltip.innerHTML = `<strong>${
            d.label
          }</strong> · ${d.value.toLocaleString()}`;
        });

        rect.addEventListener("mousemove", (e) => {
          const containerRect = container.getBoundingClientRect();
          tooltip.style.left = `${e.clientX - containerRect.left}px`;
          tooltip.style.top = `${e.clientY - containerRect.top - 8}px`;
        });

        rect.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });

        g.appendChild(rect);
      });

      // 리사이징 후에도 애니메이션 적용
      if (!isAnimated) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isAnimated = true;
            const bars = container.querySelectorAll(".bar");
            bars.forEach((bar) => bar.classList.add("bar--animated"));
          });
        });
      } else {
        // 이미 애니메이션된 경우 즉시 적용
        requestAnimationFrame(() => {
          const bars = g.querySelectorAll(".bar");
          bars.forEach((bar) => bar.classList.add("bar--animated"));
        });
      }
    },
  });

  return {
    /**
     * 데이터 업데이트
     * @param {BarDatum[]} newData
     */
    update(newData) {
      currentData = newData;
      chartWrapper.update();
    },

    /**
     * 차트 제거
     */
    destroy() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      chartWrapper.destroy();
    },
  };
}
