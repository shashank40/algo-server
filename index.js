const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const objectData = require('./json/data1.json');
const convertToOHLC = require('./utils/ohlcConvert.js');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function convertData(){
	const newData = objectData.map((data)=>{
    const dateArr = Math.floor(Date.parse(data[0])/1000);
		return {time:dateArr, value:data[1]/1000};
	})
	return newData;
}

const data = convertData();
 
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  let lastSentTime = 0;

  function sendData(data, resolution) {
    const data_len = data.length;
    let i = 0;
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
      },1000);

      if(!oldSent && oldData.length>0){ //// this is if all data is old data but we still need to send
        socket.emit('receive_data', {newData: null, 
          oldData: oldData, resolutionIncoming: resolution});
       }
  }

  socket.on("phase2", ({message})=>{
    console.log(message);
    sendData(data);
  })

  socket.on('phase3', ({message})=>{
    console.log(message);
    if(message=="1"){ 
      const ohlc1min =  convertToOHLC(data, 1);
      setTimeout(()=>{sendData(ohlc1min, message);}, 2000);
    }
    else if(message=="5"){ 
      const ohlc5min= convertToOHLC(data, 5);
      setTimeout(()=>{sendData(ohlc5min, message);}, 2000);
    }
    else if(message=="30") {
      const ohlc30min = convertToOHLC(data, 30);
      setTimeout(()=>{sendData(ohlc30min, message);}, 2000);
    }
    else{ 
      const ohlc1hr =  convertToOHLC(data, 60);
      setTimeout(()=>{sendData(ohlc1hr,message);}, 2000); 
    };
  });

});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});

