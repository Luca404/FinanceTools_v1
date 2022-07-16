const server = io();
server.on("connect", () => {
    console.log("Connected");
});

server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("pfHistory", (data) => {
    console.log(data);
});


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

