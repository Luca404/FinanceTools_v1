//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
});

server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("pfData", (data) => {
    var pfData = JSON.parse( data );
    drawPerformaceChart(pfData);
});


//PortFolio Period
var PERIOD = 2;
var NORMALIZED = true;

function drawPerformaceChart(data) {
    console.log(data);
    var canvasDiv = document.getElementById("canvasDiv");
    if( canvasDiv.children.length > 0 )
        canvasDiv.removeChild( document.getElementById("pfPerformanceCanvas") );
    var canvas = document.createElement("canvas");
    canvas.id = "pfPerformanceCanvas";
    canvas.width = 800;
    canvas.height = 450;
    canvasDiv.appendChild(canvas);
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
    loadSelectedPf();
}

function setNormalized(){
    var opt = document.getElementById("selectNormalized");
    var pfNorm = opt.options[opt.selectedIndex].text;
    if( pfNorm == "Yes" )
        NORMALIZED = true;
    else
        NORMALIZED = false;
    loadSelectedPf();
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
    server.emit("getPfData", {name: pfName, tickers: pfTickers, period: PERIOD, norm: NORMALIZED});
}
