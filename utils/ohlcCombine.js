function combineOHLCData(instrumentsData) {
    let combinedData = [];
  
    // Iterate through each instrument data
    instrumentsData.forEach(instrumentData => {
      // Iterate through each OHLC data point of the instrument
      instrumentData.forEach(dataPoint => {
        // Check if the time of the data point already exists in the combined data
        const existingDataPoint = combinedData.find(item => item.time === dataPoint.time);
  
        if (existingDataPoint) {
          // Update the high, low, and close values if necessary
          existingDataPoint.high = Math.max(existingDataPoint.high, dataPoint.high);
          existingDataPoint.low = Math.min(existingDataPoint.low, dataPoint.low);
          existingDataPoint.close = dataPoint.close;
        } else {
          // Add a new data point to the combined data
          combinedData.push({
            open: dataPoint.open,
            high: dataPoint.high,
            low: dataPoint.low,
            close: dataPoint.close,
            time: dataPoint.time
          });
        }
      });
    });
  
    // Sort the combined data based on time (if necessary)
    combinedData.sort((a, b) => a.time - b.time);
  
    return combinedData;
  }

  module.exports = combineOHLCData;