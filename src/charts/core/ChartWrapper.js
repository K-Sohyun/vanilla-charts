/**
 * createChartWrapper
 * SVG 차트 래퍼 생성 (반응형, 패딩, 축 영역 관리)
 *
 * @param {HTMLElement} container - 차트를 그릴 HTML 컨테이너
 * @param {Object} options
 * @param {number} [options.width] - 고정 너비 (없으면 반응형)
 * @param {number} [options.height=360] - 차트 높이
 * @param {Partial<import('./types').Padding>} [options.framePadding] - 프레임 패딩
 * @param {number} [options.minWidth=320] - 최소 너비
 * @param {number} [options.defaultWidth=640] - 초기 기본 너비
 * @param {(context: { innerWidth: number, innerHeight: number, svg: SVGSVGElement, g: SVGGElement }) => void} options.render - 렌더링 콜백
 * @returns {{ destroy: () => void, update: () => void }}
 */
export function createChartWrapper(
  container,
  {
    width,
    height = 360,
    framePadding,
    minWidth = 320,
    defaultWidth = 640,
    render,
  }
) {
  // 기존 SVG만 제거 (다른 요소는 보존)
  const existingSvgs = container.querySelectorAll("svg");
  existingSvgs.forEach((svg) => svg.parentElement?.remove());

  // 기본 패딩
  const defaultPadding = { top: 24, right: 24, bottom: 40, left: 40 };
  const pad = { ...defaultPadding, ...(framePadding ?? {}) };

  // Wrapper div
  const wrapper = document.createElement("div");
  wrapper.style.width = width ? `${width}px` : "100%";

  // SVG 생성
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.maxWidth = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";

  // 내부 g 요소 (패딩 적용)
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${pad.left},${pad.top})`);
  svg.appendChild(g);

  wrapper.appendChild(svg);
  container.appendChild(wrapper);

  // 현재 너비 상태
  let currentWidth = width ?? defaultWidth;

  // 초기 너비 측정 (고정 너비가 아닐 경우)
  if (!width) {
    const rect = wrapper.getBoundingClientRect();
    if (rect.width > 0) {
      currentWidth = Math.max(rect.width, minWidth);
    }
  }

  // 렌더링 함수
  const doRender = () => {
    const outerW = currentWidth;
    const innerWidth = outerW - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;

    svg.setAttribute("width", outerW);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${outerW} ${height}`);

    // 내부 차트 렌더링
    render({ innerWidth, innerHeight, svg, g });
  };

  // ResizeObserver (반응형)
  let resizeObserver = null;
  if (!width) {
    let resizeTimer = null;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.max(entry.contentRect.width, minWidth);
        if (newWidth !== currentWidth) {
          currentWidth = newWidth;

          // debounce: 리사이징 완료 후 100ms 후에 렌더링
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            doRender();
          }, 100);
        }
      }
    });
    resizeObserver.observe(wrapper);
  }

  // 초기 렌더링
  doRender();

  return {
    /**
     * 차트 업데이트 (데이터 변경시)
     */
    update() {
      doRender();
    },

    /**
     * 리소스 정리
     */
    destroy() {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      container.innerHTML = "";
    },
  };
}
