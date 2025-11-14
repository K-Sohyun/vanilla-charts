import { createColorScale } from "../core/colorScale.js";
import { renderLegend } from "../core/Legend.js";

/**
 * @typedef {Object} PieDatum
 * @property {string} label
 * @property {number} value
 */

const TAU = Math.PI * 2;

/**
 * polar 좌표 변환
 */
const polar = (cx, cy, r, angle) => [
  cx + Math.cos(angle) * r,
  cy + Math.sin(angle) * r,
];

/**
 * 원호 경로 생성
 */
function arcPath(cx, cy, rOuter, rInner, start, end) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const [sx, sy] = polar(cx, cy, rOuter, start);
  const [ex, ey] = polar(cx, cy, rOuter, end);

  if (rInner <= 0) {
    // 파이 차트 (중심에서 시작)
    return [
      `M ${cx} ${cy}`,
      `L ${sx} ${sy}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ex} ${ey}`,
      "Z",
    ].join(" ");
  } else {
    // 도넛 차트
    const [isx, isy] = polar(cx, cy, rInner, end);
    const [iex, iey] = polar(cx, cy, rInner, start);
    return [
      `M ${sx} ${sy}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ex} ${ey}`,
      `L ${isx} ${isy}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iex} ${iey}`,
      "Z",
    ].join(" ");
  }
}

/**
 * createPieChart
 * 파이/도넛 차트 생성
 *
 * @param {HTMLElement} container - 차트를 그릴 컨테이너
 * @param {Object} props
 * @param {PieDatum[]} props.data - 차트 데이터
 * @param {number} [props.width] - 차트 너비 (없으면 반응형)
 * @param {number} [props.height=360] - 차트 높이
 * @param {number} [props.innerRadiusRatio=0] - 내부 반지름 비율 (0=파이, 0.6=도넛)
 * @param {Object} [props.legend] - 범례 설정
 * @param {boolean} [props.legend.show=true] - 범례 표시 여부
 * @param {'top' | 'right'} [props.legend.position='top'] - 범례 위치
 * @param {Record<string, string>} [props.colors] - 커스텀 색상 맵
 * @returns {{ update: (newData: PieDatum[]) => void, destroy: () => void }}
 */
export function createPieChart(
  container,
  {
    data,
    width,
    height = 360,
    innerRadiusRatio = 0,
    legend = { show: true, position: "top" },
    colors,
  }
) {
  // 컨테이너 초기화
  container.innerHTML = "";
  container.style.position = "relative";
  container.classList.add("chart-wrapper");

  // 툴팁 생성
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.style.display = "none";
  container.appendChild(tooltip);

  let currentData = data;
  let resizeObserver = null;
  let currentWidth = width || 640;

  // SVG 래퍼
  const svgWrapper = document.createElement("div");
  svgWrapper.classList.add("pie-chart-box");
  if (width) {
    svgWrapper.style.width = `${width}px`;
  }
  container.appendChild(svgWrapper);

  // SVG 생성
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.maxWidth = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.setAttribute("shape-rendering", "geometricPrecision");
  svgWrapper.appendChild(svg);

  // 렌더링 함수
  const render = () => {
    // 유효한 데이터만 필터링
    const validData = currentData
      .map((d) => ({
        ...d,
        value: Number.isFinite(d.value) ? Math.max(0, d.value) : 0,
      }))
      .filter((d) => d.value > 0);

    const labels = validData.map((d) => d.label);
    const total = validData.reduce((acc, d) => acc + d.value, 0);

    // 색상 스케일
    const getColor = createColorScale(labels, colors);

    // 범례 렌더링 (svgWrapper 앞에 삽입)
    if (legend?.show) {
      // 기존 범례 제거
      const existingLegends = container.querySelectorAll(".chart-legend");
      existingLegends.forEach((el) => el.remove());

      const seriesLabels = labels.reduce((m, k) => {
        m[k] = k;
        return m;
      }, {});

      // svgWrapper 앞에 범례 삽입
      const legendEl = renderLegend(null, {
        seriesOrder: labels,
        seriesLabels,
        getColor,
        position: legend.position || "top",
      });
      container.insertBefore(legendEl, svgWrapper);
    } else {
      // 범례가 없을 때 기존 범례 요소 제거
      const existingLegends = container.querySelectorAll(".chart-legend");
      existingLegends.forEach((el) => el.remove());
    }

    // 각도 계산
    const slices = [];
    if (validData.length > 0 && total > 0) {
      let angle = -Math.PI / 2; // 12시 시작
      validData.forEach((d) => {
        const fraction = d.value / total;
        const span = fraction * TAU;
        const start = angle;
        const end = angle + span;
        angle = end;
        slices.push({ ...d, start, end, fraction });
      });
    }

    // 차트 크기 계산
    const paddingTop = legend?.show ? 20 : 10;
    const padding = 10;

    const availableWidth = currentWidth - padding * 2;
    const availableHeight = height - paddingTop - padding;
    const radius = Math.min(availableWidth, availableHeight) / 2;

    const cx = padding + availableWidth / 2;
    const cy = paddingTop + availableHeight / 2;

    const ratio = Math.max(0, Math.min(innerRadiusRatio, 0.95));
    const innerR = Math.max(0, Math.min(radius * ratio, radius - 2));

    // SVG 속성 설정
    svg.setAttribute("width", currentWidth);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${currentWidth} ${height}`);
    svg.innerHTML = "";

    if (slices.length === 0) {
      // 빈 상태: 회색 원
      const emptyCircle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      emptyCircle.setAttribute("cx", cx);
      emptyCircle.setAttribute("cy", cy);
      emptyCircle.setAttribute("r", radius);
      emptyCircle.classList.add("pie-empty-ring");
      svg.appendChild(emptyCircle);
      return;
    }

    // 유니크 마스크 ID 생성
    const maskId = `pie-mask-${Math.random().toString(36).substr(2, 9)}`;

    // 마스크 정의
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", maskId);
    mask.setAttribute("maskUnits", "userSpaceOnUse");

    const maskRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    maskRect.setAttribute("x", "0");
    maskRect.setAttribute("y", "0");
    maskRect.setAttribute("width", currentWidth);
    maskRect.setAttribute("height", height);
    maskRect.setAttribute("fill", "black");
    mask.appendChild(maskRect);

    // 스윕 애니메이션용 원
    const sweepCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    sweepCircle.setAttribute("cx", cx);
    sweepCircle.setAttribute("cy", cy);
    sweepCircle.setAttribute("r", radius);
    sweepCircle.setAttribute("fill", "none");
    sweepCircle.setAttribute("stroke", "#fff");
    sweepCircle.setAttribute("stroke-width", radius * 2);

    const circumference = Math.round(TAU * radius);
    sweepCircle.setAttribute("stroke-dasharray", circumference);
    sweepCircle.setAttribute("stroke-dashoffset", circumference);
    sweepCircle.setAttribute("stroke-linecap", "butt");
    sweepCircle.classList.add("pie-mask-sweep");

    // CSS 변수로 중심점 설정 (React와 동일)
    sweepCircle.style.setProperty("--r", `${radius}px`);
    sweepCircle.style.setProperty("--circ", `${circumference}px`);
    sweepCircle.style.setProperty("--cx", `${cx}px`);
    sweepCircle.style.setProperty("--cy", `${cy}px`);

    mask.appendChild(sweepCircle);
    defs.appendChild(mask);
    svg.appendChild(defs);

    // 마스크가 적용될 그룹
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("mask", `url(#${maskId})`);

    // 조각 그리기
    slices.forEach((s) => {
      const d = arcPath(cx, cy, radius, innerR, s.start, s.end);
      const color = getColor(s.label);
      const percent = s.fraction * 100;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", d);
      path.setAttribute("fill", color);
      path.classList.add("pie-slice");

      // 툴팁 이벤트
      path.addEventListener("mouseenter", (e) => {
        const containerRect = container.getBoundingClientRect();
        tooltip.style.display = "block";
        tooltip.style.left = `${e.clientX - containerRect.left}px`;
        tooltip.style.top = `${e.clientY - containerRect.top - 8}px`;
        tooltip.textContent = `${
          s.label
        }\n${s.value.toLocaleString()} (${percent.toFixed(1)}%)`;
        tooltip.style.whiteSpace = "pre-line";
      });

      path.addEventListener("mousemove", (e) => {
        const containerRect = container.getBoundingClientRect();
        tooltip.style.left = `${e.clientX - containerRect.left}px`;
        tooltip.style.top = `${e.clientY - containerRect.top - 8}px`;
      });

      path.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });

      g.appendChild(path);
    });

    svg.appendChild(g);

    // 분리선
    slices.forEach((s) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      if (innerR <= 0) {
        // 파이: 중심에서 외곽까지
        const [x2, y2] = polar(cx, cy, radius, s.start);
        line.setAttribute("x1", cx);
        line.setAttribute("y1", cy);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
      } else {
        // 도넛: 내부에서 외곽까지
        const [x1, y1] = polar(cx, cy, innerR, s.start);
        const [x2, y2] = polar(cx, cy, radius, s.start);
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
      }
      line.classList.add("pie-separator-radial");
      g.appendChild(line);
    });

    // 외곽 링
    const outerRing = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    outerRing.setAttribute("cx", cx);
    outerRing.setAttribute("cy", cy);
    outerRing.setAttribute("r", radius);
    outerRing.classList.add("pie-separator-ring");
    g.appendChild(outerRing);

    // 내부 링 (도넛)
    if (innerR > 0) {
      const innerRing = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      innerRing.setAttribute("cx", cx);
      innerRing.setAttribute("cy", cy);
      innerRing.setAttribute("r", innerR);
      innerRing.classList.add("pie-separator-ring");
      g.appendChild(innerRing);
    }

    svg.appendChild(g);
  };

  // ResizeObserver (반응형)
  if (!width) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.max(entry.contentRect.width, 320);
        if (newWidth !== currentWidth) {
          currentWidth = newWidth;
          render();
        }
      }
    });
    resizeObserver.observe(svgWrapper);
  }

  // 초기 렌더링
  render();

  return {
    /**
     * 데이터 업데이트
     * @param {PieDatum[]} newData
     */
    update(newData) {
      currentData = newData;
      render();
    },

    /**
     * 차트 제거
     */
    destroy() {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      container.innerHTML = "";
    },
  };
}
