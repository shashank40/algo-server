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

  function sendData(data) {
    const data_len = data.length;
    let i = 0;
      setInterval(() => {
        if(i<data_len){
          if(data[i].time>=lastSentTime) {
          socket.emit('receive_data', data[i]); 
          lastSentTime = data[i].time;
          }
          i++;
        }
        else {
          clearInterval();
        }
      },600);
  }

  socket.on("phase2", ({message})=>{
    console.log(message);
    sendData(data);
  })

  socket.on('phase3', ({message})=>{
    console.log(message);
    if(message=="1"){ 
      const ohlc1min =  convertToOHLC(data, 1);
      setTimeout(()=>{sendData(ohlc1min);}, 2000);
    }
    else if(message=="5"){ 
      const ohlc5min= convertToOHLC(data, 5);
      setTimeout(()=>{sendData(ohlc5min);}, 2000);
    }
    else if(message=="30") {
      const ohlc30min = convertToOHLC(data, 30);
      setTimeout(()=>{sendData(ohlc30min);}, 2000);
    }
    else{ 
      const ohlc1hr =  convertToOHLC(data, 60);
      setTimeout(()=>{sendData(ohlc1hr);}, 2000); 
    };
  });

});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});

