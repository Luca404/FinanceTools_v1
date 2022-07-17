//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
});

server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("pfHistory", (data) => {
    var pfData = JSON.parse( data );
    drawPerformaceChart(pfData);
});


//PortFolio Period
var PERIOD = 2;
var NORMALIZED = true;

function drawPerformaceChart(data) {
    console.log(data);
    var tickers = Object.keys(data);
    var dataset = [];
    for(var i = 0; i < tickers.length; i++){
        dataset[i] = {
            data: Object.values(data[tickers[i]]),
            label: tickers[i],
            borderColor: "#" + Math.floor(Math.random()*16777215).toString(16),
            fill: false
        };
    }
    var dateArray = Object.keys(data[tickers[0]]);
    var dateList = [];
    for(var i = 0; i < dateArray.length; i++){
        var date = new Date(dateArray[i] * 1);
        var aDate = date.toLocaleDateString();
        dateList.push(aDate);
    }
    
    new Chart(document.getElementById("pfPerformanceCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: dataset 
        },
        options: {
            title: {
                display: true,
                text: 'Single Assets performance'
            },
            responsive:false,
            elements: {
                point:{
                    radius: 0
                }
            },
            scales: {
                xAxes: [{
                    ticks: {
                        maxTicksLimit: 20
                    }
                }]
            }
        }        
    });
}

function setPeriod(){
    var opt = document.getElementById("selectPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    console.log(PERIOD);
}

function setNormalized(){
    var opt = document.getElementById("selectNormalized");
    var pfNorm = opt.options[opt.selectedIndex].text;
    if( pfNorm == "Yes" )
        NORMALIZED = true;
    else
        NORMALIZED = false;
    console.log(NORMALIZED);
}

async function loadSavedPf(){
    const pf = await import( "../json/portfolios.json", {
		assert: {
			type: 'json'
		}
	});
	var portFolios = pf.default.PortFolios;
    var savedPfMenu = document.getElementById('savedPfMenu'); 
    for(var i = 0; i < portFolios.length; i++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.appendChild(document.createTextNode(portFolios[i].pfName + ":  "));
		opt.appendChild(document.createTextNode(" " + portFolios[i].tickers));
        savedPfMenu.appendChild(opt);
    }
    loadSelectedPf(); 
}
loadSavedPf();

function loadSelectedPf(){
    var opt = document.getElementById("savedPfMenu");
    var pfInfo = opt.options[opt.selectedIndex].text;
    var pfName = pfInfo.split(": ")[0];
    var pfTickers = pfInfo.split(": ")[1];
    await server.emit("pfInfo", {name: pfName, tickers: pfTickers, period: PERIOD, norm: NORMALIZED});
    console.log(pfName, "+", pfTickers);
}

