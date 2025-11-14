import { createChartWrapper } from "../core/ChartWrapper.js";
import { linearScale, bandScale } from "../core/scales.js";
import { makeTicks } from "../core/ticks.js";
import { renderAxisLinear } from "../core/AxisLinear.js";
import { renderAxisBand } from "../core/AxisBand.js";
import { renderLegend } from "../core/Legend.js";
import { createColorScale } from "../core/colorScale.js";

/**
 * @typedef {Object} GroupLineDatum
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
 * createLineGroupChart
 * 그룹 라인 차트 생성
 *
 * @param {HTMLElement} container - 차트를 그릴 컨테이너
 * @param {Object} props
 * @param {GroupLineDatum[]} props.data - 차트 데이터
 * @param {number} [props.width] - 차트 너비 (고정 너비, 없으면 반응형)
 * @param {number} [props.height=360] - 차트 높이
 * @param {string[]} [props.seriesOrder] - 시리즈 순서
 * @param {Record<string, string>} [props.colors] - 시리즈별 색상
 * @param {number} [props.strokeWidth=2] - 선 두께
 * @param {boolean} [props.showDots=true] - 포인트 표시 여부
 * @param {number} [props.dotRadius=3] - 포인트 반지름
 * @param {boolean} [props.rotateLabels=false] - X축 라벨 회전 여부
 * @param {number} [props.categoryGap=0.2] - 카테고리 간격 비율
 * @param {ValueAxisOpts} [props.valueAxis] - 값 축 설정
 * @param {Partial<import('../core/types').Padding>} [props.framePadding] - 프레임 패딩
 * @param {Record<string, string>} [props.seriesLabels] - 시리즈 라벨 매핑
 * @param {LegendOpts} [props.legend] - 범례 설정
 * @param {boolean} [props.area=false] - 영역(면) 채우기 여부
 * @returns {{ update: (newData: GroupLineDatum[]) => void, destroy: () => void }}
 */
export function createLineGroupChart(
  container,
  {
    data,
    width,
    height = 360,
    seriesOrder,
    colors,
    strokeWidth = 2,
    showDots = true,
    dotRadius = 3,
    rotateLabels = false,
    categoryGap = 0.2,
    valueAxis,
    framePadding,
    seriesLabels,
    legend = { show: true, position: "top" },
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

  const displayOf = (key) => seriesLabels?.[key] ?? key;

  // 차트 래퍼 생성
  const chartWrapper = createChartWrapper(container, {
    width,
    height,
    framePadding,
    render: ({ innerWidth, innerHeight, svg, g }) => {
      // 기존 내용 제거
      g.innerHTML = "";

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

      // 스케일 생성
      const xBand = bandScale(labels, 0, innerWidth, categoryGap);
      const yScale = linearScale(vMin, vMax, innerHeight, 0);

      // 각 시리즈별로 포인트와 라인 데이터 생성
      const seriesData = inferredKeys.map((seriesKey) => {
        const points = currentData.map((d) => {
          const cx = xBand.getX(d.label) + xBand.bandWidth / 2;
          const cy = yScale(Math.max(0, d.values[seriesKey] ?? 0));
          return {
            label: d.label,
            series: seriesKey,
            value: d.values[seriesKey] ?? 0,
            cx,
            cy,
          };
        });

        // 라인 경로
        let lineD = "";
        if (points.length > 0) {
          const [first, ...rest] = points;
          lineD =
            `M ${first.cx} ${first.cy} ` +
            rest.map((p) => `L ${p.cx} ${p.cy}`).join(" ");
        }

        // 영역 경로
        let areaD = "";
        if (area && points.length > 0) {
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

        return {
          seriesKey,
          points,
          lineD,
          areaD,
          color: colorOf(seriesKey),
        };
      });

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
      if (area) {
        seriesData.forEach(({ seriesKey, areaD, color }) => {
          if (areaD) {
            const areaPath = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            areaPath.setAttribute("d", areaD);
            areaPath.setAttribute("fill", color);
            areaPath.classList.add("line-area");
            g.appendChild(areaPath);
          }
        });
      }

      // 4) 라인들
      seriesData.forEach(({ seriesKey, lineD, color }) => {
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
        linePath.setAttribute("pathLength", "1");
        linePath.classList.add("line-path");
        g.appendChild(linePath);
      });

      // 5) 포인트들
      if (showDots) {
        seriesData.forEach(({ seriesKey, points, color }) => {
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
              tooltip.innerHTML = `<strong>${p.label}</strong> · ${displayOf(
                p.series
              )} : ${p.value.toLocaleString()}`;
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
        });
      }
    },
  });

  return {
    /**
     * 데이터 업데이트
     * @param {GroupLineDatum[]} newData
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
