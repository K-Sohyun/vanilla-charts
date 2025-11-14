import { createChartWrapper } from "../core/ChartWrapper.js";
import { linearScale, bandScale } from "../core/scales.js";
import { makeTicks } from "../core/ticks.js";
import { renderAxisLinear } from "../core/AxisLinear.js";
import { renderAxisBand } from "../core/AxisBand.js";
import { renderLegend } from "../core/Legend.js";
import { createColorScale } from "../core/colorScale.js";

/**
 * @typedef {Object} GroupBarDatum
 * @property {string} label
 * @property {Record<string, number>} values
 */

/**
 * @typedef {Object} ValueAxisOpts
 * @property {number} [min]
 * @property {number} [max]
 * @property {import('../core/types').YTicks} [ticks]
 * @property {(v: number) => string | number} [formatTick]
 */

/**
 * @typedef {Object} LegendOpts
 * @property {boolean} [show]
 * @property {'top' | 'right'} [position]
 */

/**
 * createBarGroupChart
 * 그룹 막대 차트 생성
 *
 * @param {HTMLElement} container - 차트를 그릴 컨테이너
 * @param {Object} props
 * @param {GroupBarDatum[]} props.data - 차트 데이터
 * @param {'vertical' | 'horizontal'} [props.orientation='vertical'] - 차트 방향
 * @param {number} [props.width] - 차트 너비 (고정 너비, 없으면 반응형)
 * @param {number} [props.height=360] - 차트 높이
 * @param {string[]} [props.seriesOrder] - 시리즈 순서
 * @param {Record<string, string>} [props.colors] - 시리즈별 색상
 * @param {boolean} [props.rotateLabels=false] - X축 라벨 회전 여부
 * @param {number} [props.categoryGap=0.2] - 카테고리 간격 비율
 * @param {number} [props.seriesGap=0.2] - 시리즈 간격 비율
 * @param {ValueAxisOpts} [props.valueAxis] - 값 축 설정
 * @param {Partial<import('../core/types').Padding>} [props.framePadding] - 프레임 패딩
 * @param {Record<string, string>} [props.seriesLabels] - 시리즈 라벨 매핑
 * @param {LegendOpts} [props.legend] - 범례 설정
 * @returns {{ update: (newData: GroupBarDatum[]) => void, destroy: () => void }}
 */
export function createBarGroupChart(
  container,
  {
    data,
    orientation = "vertical",
    width,
    height = 360,
    seriesOrder,
    colors,
    rotateLabels = false,
    categoryGap = 0.2,
    seriesGap = 0.2,
    valueAxis,
    framePadding,
    seriesLabels,
    legend = { show: true, position: "top" },
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

  const displayOf = (key) => seriesLabels?.[key] ?? key;

  // 차트 래퍼 생성
  const chartWrapper = createChartWrapper(container, {
    width,
    height,
    framePadding,
    render: ({ innerWidth, innerHeight, svg, g }) => {
      // 기존 내용 제거
      g.innerHTML = "";

      const isVertical = orientation === "vertical";

      // 시리즈 키 추출
      const inferredKeys =
        seriesOrder ??
        Array.from(new Set(currentData.flatMap((d) => Object.keys(d.values))));

      const labels = currentData.map((d) => d.label);

      // 모든 값 추출
      const allValues = currentData.flatMap((d) =>
        inferredKeys.map((k) => d.values[k] ?? 0)
      );
      const dataMax = allValues.length ? Math.max(...allValues, 0) : 0;

      const vMin = valueAxis?.min ?? 0;
      const vMaxRaw = valueAxis?.max ?? dataMax;
      const vMax = vMaxRaw === vMin ? vMin + 1 : vMaxRaw;
      const ticks = makeTicks(vMin, vMax, valueAxis?.ticks);

      // 색상 스케일
      const colorOf = createColorScale(inferredKeys, colors);

      // 범례 렌더링
      if (legend?.show) {
        // 기존 범례 제거
        const existingLegends = container.querySelectorAll(".chart-legend");
        existingLegends.forEach((el) => el.remove());

        const legendEl = renderLegend(null, {
          seriesOrder: inferredKeys,
          seriesLabels:
            seriesLabels ?? Object.fromEntries(inferredKeys.map((k) => [k, k])),
          getColor: colorOf,
          position: legend.position ?? "top",
        });
        // 툴팁 다음, SVG 래퍼 앞에 삽입
        const svgWrapper = container.querySelector("div:not(.chart-tooltip)");
        if (svgWrapper) {
          container.insertBefore(legendEl, svgWrapper);
        } else {
          container.appendChild(legendEl);
        }
      } else {
        const existingLegends = container.querySelectorAll(".chart-legend");
        existingLegends.forEach((el) => el.remove());
      }

      // 바깥/안쪽 밴드 스케일
      const outer = isVertical
        ? bandScale(labels, 0, innerWidth, categoryGap)
        : bandScale(labels, 0, innerHeight, categoryGap);
      const inner = bandScale(inferredKeys, 0, outer.bandWidth, seriesGap);

      // 값 축 스케일
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
        getPos: outer.getX,
        bandWidth: outer.bandWidth,
        side: isVertical ? "bottom" : "left",
        rotate: rotateLabels,
        tickPadding: 20,
      });
      g.appendChild(axisBandG);

      // 3) 그룹 막대 그리기
      currentData.forEach((d, gi) => {
        const base = outer.getX(d.label);

        inferredKeys.forEach((key, si) => {
          const val = Math.max(0, d.values[key] ?? 0);

          const rect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          rect.setAttribute("fill", colorOf(key));
          rect.setAttribute("rx", "6");
          rect.classList.add("bar");
          rect.style.transitionDelay = `${
            (gi * inferredKeys.length + si) * 30
          }ms`;

          if (isVertical) {
            const x = base + inner.getX(key);
            const bw = inner.bandWidth;
            const y1 = valueScale(val);
            const h = innerHeight - y1;

            rect.setAttribute("x", x);
            rect.setAttribute("y", y1);
            rect.setAttribute("width", bw);
            rect.setAttribute("height", h);
          } else {
            const yPos = base + inner.getX(key);
            const bh = inner.bandWidth;
            const x0 = valueScale(0);
            const x1 = valueScale(val);
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
            tooltip.innerHTML = `<strong>${d.label}</strong> · ${displayOf(
              key
            )} : ${val.toLocaleString()}`;
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
     * @param {GroupBarDatum[]} newData
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
