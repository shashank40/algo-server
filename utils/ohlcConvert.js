function convertToOHLC(data, resolution) {
  const result = [];
  const OHLCData = {};
  const resolutionMs = resolution * 4; 

  for (let i = 0; i < data.length; i++) {
    const {time, value} = data[i];
    const intervalStart = Math.floor(time / (resolutionMs)) * (resolutionMs);

    if (!OHLCData[intervalStart]) {
      OHLCData[intervalStart] = {
        open: value,
        high: value,
        low: value,
        close: value
      };
    } else {
      const currentInterval = OHLCData[intervalStart];
      currentInterval.high = Math.max(currentInterval.high, value);
      currentInterval.low = Math.min(currentInterval.low, value);
      currentInterval.close = value;
    }
  }

  for (const timestamp in OHLCData) {
    const interval = OHLCData[timestamp];
    result.push({
      "open" : interval.open,
      "high" : interval.high,
      "low" : interval.low,
      "close"  :interval.close,
      "time" : Number(timestamp),
  });
  }
  return result;
}
  module.exports = convertToOHLC;