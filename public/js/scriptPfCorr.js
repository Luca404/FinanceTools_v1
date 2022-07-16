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

function drawPerformaceChart(data) {
    console.log(data);
    var tickers = Object.keys(data);
    var dataset = [];
    for(var i = 0; i < tickers.length; i++){
        dataset.append({
            data: data[tickers[i]],
            label: tickers[i],
            fill: false
        });
    }
    /*
    new Chart(document.getElementById("pfPerformanceCanvas"), {
        type: 'line',
        data: {
            labels: tickers,
            datasets: [{}] 
                data: [86,114,106,106,107,111,133,221,783,2478],
                label: "Africa",
                borderColor: "#3e95cd",
                fill: false
            }, { 
                data: [282,350,411,502,635,809,947,1402,3700,5267],
                label: "Asia",
                borderColor: "#8e5ea2",
                fill: false
            }, { 
                data: [168,170,178,190,203,276,408,547,675,734],
                label: "Europe",
                borderColor: "#3cba9f",
                fill: false
            }, { 
                data: [40,20,10,16,24,38,74,167,508,784],
                label: "Latin America",
                borderColor: "#e8c3b9",
                fill: false
            }, { 
                data: [6,3,2,2,7,26,82,172,312,433],
                label: "North America",
                borderColor: "#c45850",
                fill: false
            }
            ]
        },
        options: {
            title: {
            display: true,
            text: 'PortFolios performance'
            }
        }
    });*/
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
    pfName = pfInfo.split(": ")[0]    
    pfTickers = pfInfo.split(": ")[1]
    server.emit("pfInfo", {name: pfName, tickers: pfTickers})
    console.log(pfName, "+", pfTickers);
}

