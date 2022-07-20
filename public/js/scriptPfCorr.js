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
    //Canvas creation
    var canvasDiv = document.getElementById("canvasDiv");
    if( canvasDiv.children.length > 0 ){
        canvasDiv.removeChild( document.getElementById("singlePerfCanvas") );
        canvasDiv.removeChild( document.getElementById("pfPerfCanvas") );
    }
    var canvasSinglePerformance = document.createElement("canvas");
    var canvasPfPerformance = document.createElement("canvas");
    canvasSinglePerformance.id = "singlePerfCanvas";
    canvasPfPerformance.id = "pfPerfCanvas";
    canvasSinglePerformance.width = 700;
    canvasSinglePerformance.height = 450;
    canvasPfPerformance.width = 700;
    canvasPfPerformance.height = 450;
    canvasSinglePerformance.setAttribute("style", "display: inline-block");
    canvasPfPerformance.setAttribute("style", "display: inline-block; margin-left: 5%");
    canvasDiv.appendChild(canvasSinglePerformance);
    canvasDiv.appendChild(canvasPfPerformance);

    //Timestamp to Date conversion
    var tickers = Object.keys(data);
    var datasetSingle = [];
    var datasetPf = []
    for(var i = 0; i < tickers.length; i++){
        if( tickers[i] == "pfRet" ){
            datasetPf[0] = {
                data: Object.values(data[tickers[i]]),
                label: "Portfolio",
                borderColor: "#" + Math.floor(Math.random()*16777215).toString(16),
                fill: false
            };
        }
        else{
            datasetSingle[i] = {
                data: Object.values(data[tickers[i]]),
                label: tickers[i],
                borderColor: "#" + Math.floor(Math.random()*16777215).toString(16),
                fill: false
            };
        }
    }
    var dateArray = Object.keys(data[tickers[0]]);
    var dateList = [];
    for(var i = 0; i < dateArray.length; i++){
        var date = new Date(dateArray[i] * 1);
        var aDate = date.toLocaleDateString();
        dateList.push(aDate);
    }
    
    //Single Performance Chart Draw
    new Chart(document.getElementById("singlePerfCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: datasetSingle
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

    //PortFolio performance chart draw
    new Chart(document.getElementById("pfPerfCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: datasetPf 
        },
        options: {
            title: {
                display: true,
                text: 'Portfolio performance'
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

async function loadSelectedPf(){
    var opt = document.getElementById("savedPfMenu");
    var pfInfo = opt.options[opt.selectedIndex].text;
    var pfName = pfInfo.split(": ")[0];
    var pfTickers = pfInfo.split(": ")[1];
    const pf = await import( "../json/portfolios.json", {
		assert: {
			type: 'json'
		}
	});
    var portFolios = pf.default.PortFolios;
	for(var i = 0; i < portFolios.length; i++) {
        if(portFolios[i].pfName == pfName)
            var weights = portFolios[i].numShares;
    }

    server.emit("getPfData", {name: pfName, tickers: pfTickers, period: PERIOD, norm: NORMALIZED, weights: weights});
}
