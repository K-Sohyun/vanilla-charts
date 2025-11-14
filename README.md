# Vanilla Charts 사용 가이드

빌드 도구 없이 어디서나 쓰는 순수 JavaScript + SVG (ES Modules) 차트 라이브러리.

## 📦 설치/구성

원본 저장소의 `src/`에서 아래 폴더를 프로젝트에 복사하세요.

```
your-project/
├── charts/
│   ├── core/            # Axis/Legend/Scale/Wrapper 등 공통
│   ├── BarChart/
│   ├── LineChart/
│   └── PieChart/
└── styles/
    ├── base.css
    └── charts.css
```

**CSS 로드**

```html
<link rel="stylesheet" href="./styles/base.css" />
<link rel="stylesheet" href="./styles/charts.css" />
<link rel="stylesheet" href="./charts/BarChart/styles.css" />
<link rel="stylesheet" href="./charts/LineChart/styles.css" />
<link rel="stylesheet" href="./charts/PieChart/styles.css" />
```

## ⚙️ 공통 사용 패턴

```html
<div id="chart"></div>
<script type="module">
  import { createBarChart } from "./charts/BarChart/BarChart.js";

  const chart = createBarChart(document.getElementById("chart"), {
    data: [
      { label: "A", value: 30 },
      { label: "B", value: 50 },
    ],
    height: 360,
  });

  // 갱신 / 정리
  // chart.update(newData);
  // chart.destroy();
</script>
```

**전달 방식**: `create*Chart(container, options)`  
**반환값**: 인스턴스 (`update(newData)`, `destroy()` 제공)  
**숫자 표시**: `toLocaleString()` 포맷  
**반응형**: `ResizeObserver`로 컨테이너 너비 감지

---

## 📊 차트 빠른 예시

### 막대 (BarChart)

```html
<script type="module">
  import { createBarChart } from "./charts/BarChart/BarChart.js";
  createBarChart(document.getElementById("bar"), {
    data: [
      { label: "1월", value: 50 },
      { label: "2월", value: 70 },
    ],
    height: 360,
    barColor: "#73a7d9",
    orientation: "vertical", // or "horizontal"
    valueAxis: { min: 0, max: 100, ticks: { step: 20 } },
  });
</script>
```

### 그룹 막대 (BarGroupChart)

```html
<script type="module">
  import { createBarGroupChart } from "./charts/BarChart/BarGroupChart.js";
  createBarGroupChart(document.getElementById("bar-group"), {
    data: [
      { label: "2023", values: { plan: 80, actual: 64 } },
      { label: "2024", values: { plan: 74, actual: 70 } },
    ],
    seriesOrder: ["plan", "actual"],
    seriesLabels: { plan: "목표", actual: "실적" },
    colors: { plan: "#afc5db", actual: "#ffc2a0" },
    legend: { show: true, position: "top" },
  });
</script>
```

### 라인 (LineChart)

```html
<script type="module">
  import { createLineChart } from "./charts/LineChart/LineChart.js";
  createLineChart(document.getElementById("line"), {
    data: [
      { label: "1월", value: 12000 },
      { label: "2월", value: 18500 },
    ],
    color: "#4f83cc",
    area: true,
    valueAxis: { min: 0, max: 20000, ticks: { step: 5000 } },
  });
</script>
```

### 그룹 라인 (LineGroupChart)

```html
<script type="module">
  import { createLineGroupChart } from "./charts/LineChart/LineGroupChart.js";
  createLineGroupChart(document.getElementById("line-group"), {
    data: [
      { label: "1월", values: { sales: 100, cost: 60 } },
      { label: "2월", values: { sales: 120, cost: 70 } },
    ],
    seriesOrder: ["sales", "cost"],
    colors: { sales: "#42a5f5", cost: "#ff6b6b" },
    legend: { show: true, position: "top" },
  });
</script>
```

### 파이/도넛 (PieChart)

```html
<script type="module">
  import { createPieChart } from "./charts/PieChart/PieChart.js";

  // 파이
  createPieChart(document.getElementById("pie"), {
    data: [
      { label: "개발자", value: 1500 },
      { label: "디자이너", value: 800 },
    ],
    height: 320,
    innerRadiusRatio: 0,
    legend: { show: true, position: "top" },
  });

  // 도넛
  createPieChart(document.getElementById("donut"), {
    data: [
      { label: "A", value: 30 },
      { label: "B", value: 50 },
    ],
    height: 320,
    innerRadiusRatio: 0.6,
    legend: { show: true, position: "right" },
  });
</script>
```

---

## 🧩 옵션 한눈에

**공통**: `data`, `width?`, `height(=360)`, `legend?`, `colors?`

**막대**: `orientation?`, `categoryGap?`, `rotateLabels?`, `valueAxis?`

**라인**: `color?`, `strokeWidth?`, `showDots?`, `dotRadius?`, `area?`, `rotateLabels?`, `valueAxis?`

**그룹**: `seriesOrder?`, `seriesLabels?`, `seriesGap?`

**파이/도넛**: `innerRadiusRatio` (0=pie, ~0.6=donut)

---

## 🛠 트러블슈팅

**로컬 CORS**: 간단 서버로 열기

```bash
npx serve .
# 또는
python -m http.server 8000
```

**안 보임**: CSS 로드 / `<script type="module">` / 콘솔 에러 확인

**지원 브라우저**: ES Modules + ResizeObserver 지원 권장 (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+)
