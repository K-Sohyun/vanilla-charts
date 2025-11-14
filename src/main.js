import { createBarChart } from "./charts/BarChart/BarChart.js";
import { createBarGroupChart } from "./charts/BarChart/BarGroupChart.js";
import { createLineChart } from "./charts/LineChart/LineChart.js";
import { createLineGroupChart } from "./charts/LineChart/LineGroupChart.js";
import { createPieChart } from "./charts/PieChart/PieChart.js";

// 1) 막대 세로
const barSample = [
  { label: "1월", value: 50 },
  { label: "2월", value: 40 },
  { label: "3월", value: 48 },
  { label: "4월", value: 52 },
  { label: "5월", value: 64 },
  { label: "6월", value: 50 },
  { label: "7월", value: 76 },
  { label: "8월", value: 70 },
  { label: "9월", value: 80 },
  { label: "10월", value: 66 },
  { label: "11월", value: 80 },
  { label: "12월", value: 84 },
];

// 2) 막대 가로
const barSample2 = [
  { label: "A", value: 21 },
  { label: "B", value: 39 },
  { label: "C", value: 64 },
  { label: "D", value: 82 },
  { label: "E", value: 40 },
];

// 3) 그룹 막대 세로
const barSample3 = [
  { label: "2022", values: { plan: 60, actual: 50 } },
  { label: "2023", values: { plan: 80, actual: 64 } },
  { label: "2024", values: { plan: 74, actual: 70 } },
  { label: "2025", values: { plan: 75, actual: 81 } },
];

// 4) 그룹 막대 가로
const barSample4 = [
  { label: "영업", values: { completed: 64, waiting: 14, pending: 24 } },
  { label: "개발", values: { completed: 78, waiting: 16, pending: 26 } },
  { label: "디자인", values: { completed: 60, waiting: 10, pending: 20 } },
];

// 5) 단일 라인
const lineSample = [
  { label: "1월", value: 12000 },
  { label: "2월", value: 18500 },
  { label: "3월", value: 9200 },
  { label: "4월", value: 23100 },
  { label: "5월", value: 15800 },
  { label: "6월", value: 19600 },
  { label: "7월", value: 22400 },
];

// 6) 그룹 라인
const lineSample2 = [
  { label: "1월", values: { sales: 100, cost: 60, profit: 40 } },
  { label: "2월", values: { sales: 120, cost: 70, profit: 50 } },
  { label: "3월", values: { sales: 110, cost: 65, profit: 45 } },
  { label: "4월", values: { sales: 130, cost: 75, profit: 55 } },
  { label: "5월", values: { sales: 140, cost: 80, profit: 60 } },
  { label: "6월", values: { sales: 125, cost: 68, profit: 57 } },
];

// 7) 그룹 라인 (면 활성화)
const lineSample3 = [
  { label: "Q1", values: { teamA: 85, teamB: 92, teamC: 78 } },
  { label: "Q2", values: { teamA: 88, teamB: 95, teamC: 82 } },
  { label: "Q3", values: { teamA: 90, teamB: 98, teamC: 85 } },
  { label: "Q4", values: { teamA: 93, teamB: 96, teamC: 88 } },
];

// 8) 파이 & 도넛
const pieSample = [
  { label: "개발자", value: 1500 },
  { label: "디자이너", value: 800 },
  { label: "기획자", value: 300 },
  { label: "마케터", value: 600 },
];

// 1. 세로 막대 차트
createBarChart(document.getElementById("bar-chart-vertical"), {
  data: barSample,
  orientation: "vertical",
  rotateLabels: true,
  framePadding: { top: 20, right: 24, bottom: 50, left: 50 },
  valueAxis: {
    min: 0,
    max: 100,
    ticks: { step: 20 },
  },
  barColor: "#73a7d9",
  categoryGap: 0.25,
});

// 2. 가로 막대 차트
createBarChart(document.getElementById("bar-chart-horizontal"), {
  data: barSample2,
  orientation: "horizontal",
  framePadding: { bottom: 30 },
  valueAxis: {
    min: 0,
    max: 100,
    ticks: { step: 20 },
    formatTick: (v) => `${v}%`,
  },
  barColor: "#ffc860",
  categoryGap: 0.4,
});

// 3. 그룹 세로 막대 차트
createBarGroupChart(document.getElementById("bar-group-vertical"), {
  data: barSample3,
  orientation: "vertical",
  seriesOrder: ["plan", "actual"],
  seriesLabels: { plan: "목표", actual: "실적" },
  colors: { plan: "#afc5db", actual: "#ffc2a0" },
  categoryGap: 0.4,
  seriesGap: 0.2,
  framePadding: { left: 30 },
  valueAxis: { min: 0, max: 100, ticks: { step: 20 } },
});

// 4. 그룹 가로 막대 차트
createBarGroupChart(document.getElementById("bar-group-horizontal"), {
  data: barSample4,
  height: 440,
  orientation: "horizontal",
  seriesOrder: ["completed", "waiting", "pending"],
  seriesLabels: {
    completed: "완료",
    waiting: "대기중",
    pending: "진행중",
  },
  colors: {
    completed: "#d7d7d7",
    waiting: "#C49BCF",
    pending: "#FF9B66",
  },
  categoryGap: 0.2,
  seriesGap: 0.3,
  framePadding: { top: 40, bottom: 30, left: 60 },
  valueAxis: {
    min: 0,
    max: 100,
    ticks: { step: 20 },
    formatTick: (v) => `${v}건`,
  },
  legend: { show: true, position: "right" },
});

// 5. 단일 라인 차트
createLineChart(document.getElementById("line-chart"), {
  data: lineSample,
  height: 360,
  color: "#60a5fa",
  strokeWidth: 2,
  showDots: true,
  dotRadius: 4,
  area: true,
  rotateLabels: false,
  valueAxis: {
    min: 0,
    max: 25000,
    ticks: { step: 5000 },
    formatTick: (v) => `${Math.round(v / 1000)}K`,
  },
});

// 6. 그룹 라인 차트
createLineGroupChart(document.getElementById("line-group-chart"), {
  data: lineSample2,
  height: 380,
  seriesOrder: ["sales", "cost", "profit"],
  seriesLabels: { sales: "매출액", cost: "비용", profit: "순이익" },
  colors: {
    sales: "#4f83cc",
    cost: "#ff6b6b",
    profit: "#51cf66",
  },
  strokeWidth: 2,
  showDots: true,
  dotRadius: 3,
  area: false,
  rotateLabels: false,
  valueAxis: {
    min: 0,
    max: 160,
    ticks: { step: 40 },
    formatTick: (v) => `${v}억`,
  },
  legend: { show: true, position: "top" },
});

// 7. 그룹 라인 차트 (면 활성화)
createLineGroupChart(document.getElementById("line-group-area"), {
  data: lineSample3,
  height: 400,
  seriesOrder: ["teamA", "teamB", "teamC"],
  seriesLabels: {
    teamA: "A팀",
    teamB: "B팀",
    teamC: "C팀",
  },
  colors: {
    teamA: "#ffa726",
    teamB: "#42a5f5",
    teamC: "#ab47bc",
  },
  strokeWidth: 2,
  showDots: true,
  dotRadius: 3,
  area: true,
  rotateLabels: false,
  framePadding: { top: 50 },
  valueAxis: {
    min: 70,
    max: 100,
    ticks: { step: 10 },
    formatTick: (v) => `${v}점`,
  },
  legend: { show: true, position: "right" },
});

// 8. 파이 차트
createPieChart(document.getElementById("pie-chart"), {
  data: pieSample,
  height: 320,
  legend: {
    show: true,
    position: "top",
  },
});

// 9. 도넛 차트
createPieChart(document.getElementById("donut-chart"), {
  data: pieSample,
  height: 320,
  innerRadiusRatio: 0.5,
  legend: {
    show: true,
    position: "right",
  },
});
