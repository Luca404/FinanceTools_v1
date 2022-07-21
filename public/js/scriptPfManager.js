//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
});
 
server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("loginResult", (data) => {
    console.log(data);
});


loadTable1();
showTickerExchange();

//Function for showing portFolios ticker option
function showTickerExchange(value){
	inputExchange = document.getElementById("tickerExchangeInput");
	if( value == 1 )
		inputExchange.style.display = "inline-block";
	else 
		inputExchange.style.display = "none";
}

async function loadTable1(){
	const pf = await import( "../json/portfolios.json", {
		assert: {
			type: 'json'
		}
	});
	var portFolios = pf.default.PortFolios;
	var tbody = document.getElementById("tbody1");
	for(var i = 0; i < portFolios.length; i++) {
		var tr = document.createElement("tr");
		tr.className = "itemTabella";

		var td1 = document.createElement("td");
		td1.className = "itemTd"
		td1.appendChild(document.createTextNode(portFolios[i].pfName));
		tr.appendChild(td1);

		var td2 = document.createElement("td");
		td2.className = "itemTd"
		td2.appendChild(document.createTextNode(portFolios[i].tickers));
		tr.appendChild(td2);

		var td3 = document.createElement("td");
		td3.className = "modifyTd"
		var button = document.createElement("button");
		//button.appendChild(document.createTextNode("Modify"));
		button.id = "modifyButt" + i;
        button.className = "btn btn-dark modifyPf";
        button.type = "button";
		button.dataset.toggle = "modal";
		button.dataset.target = "#modifyModal" + i;
		button.onclick = function() { modifyPfManager(this); };
		var modifyImg = document.createElement("img");
		modifyImg.id = "modifyImg";
		modifyImg.src = "img/modify-icon.jpg";
		button.append(modifyImg);
        td3.appendChild(button);
		
		//Modal
		var modalDiv1 = document.createElement("div");
		modalDiv1.className = "modal fade";
		modalDiv1.id = "modifyModal" + i;
		modalDiv1.tabIndex = "-1";
		modalDiv1.role = "dialog";
		modalDiv1.ariaLabelledBy = "modifyModalLabel";
		modalDiv1.ariaHidden = "true";

		var modalDiv2 = document.createElement("div");
		modalDiv2.className = "modal-dialog";
		modalDiv2.role = "document";

		var modalDiv3 = document.createElement("div");
		modalDiv3.className = "modal-content";

		var modalDiv4 = document.createElement("div");
		modalDiv4.className = "modal-header";

		//Modal title
		var modalTitle = document.createElement("h4");
		modalTitle.className = "modal-title";
		modalTitle.id = "modifyModalLabel";
		modalTitle.appendChild(document.createTextNode("Modify Portfolio"));
		modalDiv4.appendChild(modalTitle);

		var closeButton = document.createElement("button");
		closeButton.type = "button";
		closeButton.className = "close";
		closeButton.dataset.dismiss = "modal";
		closeButton.ariaLabel = "Close";

		var closeSpan = document.createElement("span");
		closeSpan.innerHTML = "&times;";
		closeButton.appendChild(closeSpan);
		modalDiv4.appendChild(closeButton);
		modalDiv3.appendChild(modalDiv4);

		//Modal content
		var modalDiv5 = document.createElement("div");
		modalDiv5.className = "modal-body";

		var pfName = document.createElement("h5");
		pfName.appendChild(document.createTextNode("Portfolio Name: "));
		var pfNameInput = document.createElement("input");
		pfNameInput.value = portFolios[i].pfName;
		pfName.appendChild(pfNameInput);
		modalDiv5.appendChild(pfName);

		var pfTickers = document.createElement("h5");
		pfTickers.appendChild(document.createTextNode("Portfolio Tickers: "));
		var pfTickersInput = document.createElement("input");
		pfTickersInput.value = portFolios[i].tickers;
		pfTickers.appendChild(pfTickersInput);
		modalDiv5.appendChild(pfTickers);

		modalDiv3.appendChild(modalDiv5);

		var modalDiv6 = document.createElement("div");
		modalDiv6.className = "modal-footer";

		var footCloseButton = document.createElement("button");
		footCloseButton.type="button";
		footCloseButton.className = "btn btn-secondary";
		footCloseButton.dataset.dismiss = "modal";
		footCloseButton.appendChild(document.createTextNode("Close"));
		modalDiv6.appendChild(footCloseButton);

		var saveButton = document.createElement("button");
		saveButton.type = "button";
		saveButton.className = "btn btn-primary";
		saveButton.appendChild(document.createTextNode("Save changes"));
		modalDiv6.appendChild(saveButton);

		modalDiv3.appendChild(modalDiv6);
		modalDiv2.appendChild(modalDiv3);
		modalDiv1.appendChild(modalDiv2);

		td3.appendChild(modalDiv1);
		
		tr.appendChild(td3);
		tbody.insertBefore( tr, tbody.lastElementChild);
	}
}

function modifyPfManager(item){
	pfNum = item.id.toString();
	pfNum = pfNum.split("modifyButt")[1];
	console.log(pfNum);
}

function addPfInputTickers(input){

	if(input.value.slice(-1) == ","){
		document.getElementById(input.id).setAttribute("disabled", true);
		document.getElementById("loaderIcon").style.display = "block";
		var ticker = input.value.split(",")[0];
		console.log(ticker);
		fetchFromYahoo1(ticker);
	}
	
}

async function fetchFromYahoo(ticker){
	const encodedParams = new URLSearchParams();
	encodedParams.append("symbol", ticker );

	const options = {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			'X-RapidAPI-Key': '1d07df0099msh1a0d579d94b2bcfp13e6b3jsnc049c5c88a8e',
			'X-RapidAPI-Host': 'yahoo-finance97.p.rapidapi.com'
		},
		body: encodedParams
	};
	
	fetch('https://yahoo-finance97.p.rapidapi.com/stock-info', options)
		.then(response => response.json())
		.then(response => {
			var name = response.data.longName;
			if( name != undefined )
				console.log(name);
			else
				console.log("Symbol not found");
		})
		.catch(err => console.error(err));
}

function showLoginModal(){
	$('#loginModal').modal({backdrop: 'static', keyboard: false});
	$("#loginModal").modal("show");
}

function checkLogin(){
	var usrn = document.getElementById("usernInput");
	var passwd = document.getElementById("passwdInput");
	if(usrn.value == ""){
		usrn.style.animation = "0.25s linear 0s 1 normal forwards running error";
		usrn.placeholder = "Insert username";
		setTimeout(() => {
			usrn.style.animation = "";
		}, 250);
		setTimeout(() => {
			usrn.placeholder = "";
		}, 1500);
	}
	if(passwd.value == ""){
		passwd.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwd.placeholder = "Insert password";
		setTimeout(() => {
			passwd.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwd.placeholder = "";
		}, 1500);
	}
	
	if( usrn.value != "" && passwd.value != "" ){		
		var hashPass = hash(passwd.value);
		console.log(hashPass);
		server.emit("login",{"username":usrn.value, "password":hashPass});
	}
}

function hash(e){for(var r=0,i=0;i<e.length;i++)r=(r<<5)-r+e.charCodeAt(i),r&=r;return r};