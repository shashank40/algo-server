const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const objectData = require('./json/data1.json');
const objectData2 = require('./json/data2.json');
const objectData3 = require('./json/data3.json');

const convertToOHLC = require('./utils/ohlcConvert.js');
const combineOHLCData = require('./utils/ohlcCombine.js');


app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function convertData(dataSet){
	const newData = dataSet.map((data)=>{
    const dateArr = Math.floor(Date.parse(data[0])/1000);
		return {time:dateArr, value:data[1]/1000};
	})
	return newData;
}

const data = convertData(objectData);
const data2 = convertData(objectData2);
const data3 = convertData(objectData3);
 
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  let lastSentTime = 0;

  function sendData(data, resolution = null) {
    const data_len = data.length;
    let i = 0;
    if(resolution != null){ /// if resolution is passed then it is phase 3 or phase 4
    let oldData = [];
    let oldSent = false;
      setInterval(() => {
        if(i<data_len){
          if(data[i].time>=lastSentTime) {
            socket.emit('receive_data', {newData: data[i], 
              oldData: oldData, resolutionIncoming: resolution});
            if(!oldSent){
              oldSent = true;
              oldData = [];
            } 
            lastSentTime = data[i].time;}
          else oldData.push(data[i]);
          i++;
        }
        else clearInterval();
      },200);

      if(!oldSent && oldData.length>0){ //// this is if all data is old data but we still need to send
        socket.emit('receive_data', {newData: null, 
          oldData: oldData, resolutionIncoming: resolution});
       }
      }
      else{ // else it is phase 2

        setInterval(() => {
          if(i<data_len){
              socket.emit('receive_data', {newData: data[i]});
            i++;
          }
          else clearInterval();
        },200);
        
      }
  }

  socket.on("phase2", ({message})=>{
    console.log(message);
    sendData(data,null);
  })

  socket.on('phase3', ({message})=>{
    console.log(message);

    const sendDataInInterval = (resolution)=>{
      const ohlcSend =  convertToOHLC(data, resolution);
      setTimeout(()=>{sendData(ohlcSend, message);}, 100);
    }
    const resolution = Number(message);
    sendDataInInterval(resolution);
  });

  socket.on("phase4", ({datas, resolution})=>{
    console.log(datas);
    const instrumentsData = [];

    const res = Number(resolution);

    if(datas.length==1){
      const ohlc = convertToOHLC(data, res);
      setTimeout(()=>{sendData(ohlc,res);}, 2000); 
    }
    else if(datas.length>1){
    datas.map((data)=>{
      if(data==0) instrumentsData.push(convertToOHLC(data, res));
      else if(data==1) instrumentsData.push(convertToOHLC(data2, res));
      else instrumentsData.push(convertToOHLC(data3, res));
    });
    const combinedData = combineOHLCData(instrumentsData);
    sendData(combinedData, resolution); 
  }
    else console.log("No data selected");
  });

});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});

