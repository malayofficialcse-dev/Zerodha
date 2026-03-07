// import React from "react";
// import {
//   ChartCanvas,
//   Chart,
//   series,
//   scale,
//   coordinates,
//   axes,
//   helper,
//   tooltip,
// } from "react-financial-charts";
// import { timeParse } from "d3-time-format";

// const { CandlestickSeries } = series;
// const { discontinuousTimeScaleProvider } = scale;
// const { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, EdgeIndicator } =
//   coordinates;
// const { XAxis, YAxis } = axes;
// const { fitWidth } = helper;
// const { OHLCTooltip } = tooltip;

// const parseDate = timeParse("%Y-%m-%d");

// function CandleChart({ data, width = 600, height = 400 }) {
//   // Data must have: date, open, high, low, close
//   const formattedData = data.map((d) => ({
//     ...d,
//     date: d.date instanceof Date ? d.date : parseDate(d.date),
//   }));

//   const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(
//     (d) => d.date
//   );
//   const {
//     data: chartData,
//     xScale,
//     xAccessor,
//     displayXAccessor,
//   } = xScaleProvider(formattedData);

//   const start = xAccessor(chartData[0]);
//   const end = xAccessor(chartData[chartData.length - 1]);
//   const xExtents = [start, end];

//   return (
//     <ChartCanvas
//       height={height}
//       width={width}
//       ratio={1}
//       margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
//       type="svg"
//       seriesName="Candle"
//       data={chartData}
//       xScale={xScale}
//       xAccessor={xAccessor}
//       displayXAccessor={displayXAccessor}
//       xExtents={xExtents}
//     >
//       <Chart id={1} yExtents={(d) => [d.high, d.low]}>
//         <XAxis />
//         <YAxis />
//         <MouseCoordinateX />
//         <MouseCoordinateY />
//         <CandlestickSeries />
//         <EdgeIndicator
//           itemType="last"
//           orient="right"
//           edgeAt="right"
//           yAccessor={(d) => d.close}
//         />
//         <OHLCTooltip origin={[-40, 0]} />
//       </Chart>
//       <CrossHairCursor />
//     </ChartCanvas>
//   );
// }

// export default fitWidth(CandleChart);

// import React from "react";
// import { Chart, CandlestickSeries } from "react-lightweight-charts";

// const CandleChart = ({ data, width = 700, height = 400 }) => {
//   // data should be an array of { time, open, high, low, close }
//   // time should be in 'YYYY-MM-DD' format or a JS Date object
//   return (
//     <div style={{ width, height }}>
//       <Chart
//         width={width}
//         height={height}
//         rightPriceScale={{ visible: true }}
//         timeScale={{ timeVisible: true, secondsVisible: false }}
//         crosshair={{ mode: 1 }}
//         layout={{ background: { type: "Solid", color: "#fff" } }}
//       >
//         <CandlestickSeries data={data} />
//       </Chart>
//     </div>
//   );
// };

// export default CandleChart;
