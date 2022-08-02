import * as login from './manageLogin.js';

//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
	login.showLoginModal();
});
 
server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("loginResult", (data) => {
	if( data["status"] )
		login.successLogin( data["text"] );
	else
		login.failedLogin( data["text"] );
});

server.on("returnPfList", (data) => {
	if( data.length > 0 ){
		loadTable1(data);
	}
	else{
		console.log("No saved Portfolio for logged user!");
	}
});

server.on("returnTickersList", (data) => {
	showTickersInInput(data);
});

//Add onload function to body
document.getElementById("corpo").addEventListener("load", setEvent(), false);

//Set event
function setEvent(){
	$("#registerButton").click( login.showRegisterModal );
	$("#loginButton").click( login.checkLogin );
	$("#registerButton2").click( login.registerUser );
	$("#loginButton2").click( login.showLoginModal );
}

var multipleSelect = new Choices('#addPfTickersInput', {
	removeItemButton: true,
	addItems: true,
	loadingText: 'Loading...',
	noResultsText: 'No results found',
	noChoicesText: 'No choices',
    searchFields: ['label', 'value'],
	shouldSort: false,
    shouldSortItems: false,
	searchResultLimit: 6,
	//itemSelectText: 'Press to select',
});


//Function for showing tickers exchange
function showTickerExchange(){
	var inputTickerType = document.getElementById("tickerTypeInput");
	let selectedType = inputTickerType.options[inputTickerType.selectedIndex].text;
	var inputExchange = document.getElementById("tickerExchangeInput");
	let selectedExchange = inputExchange.options[inputExchange.selectedIndex].text;
	console.log( selectedExchange );
	if( selectedType == "Stocks" )
		inputExchange.style.display = "inline-block";
	else{
		inputExchange.style.display = "none";
		selectedExchange = selectedType;
	}
	
	server.emit("getTickersList", {"type": selectedType, "exchange": selectedExchange} );
}

//Show dropdown menu with the tickers list from the server
function showTickersInInput(data){
	var tickersData = [];
	for( var i = 0; i < data.length; i++ ){
		tickersData[i] = {value: data[i].s, label: data[i].n + " (" + data[i].s + ")", title: data[i].n};
	}
	multipleSelect.setChoices( tickersData, "value", "label", "title");
}

//Load table with portfolios
function loadTable1(data){
	var portFolios = data;
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
		td3.className = "itemTd"
		td3.appendChild(document.createTextNode(portFolios[i].numShares));
		tr.appendChild(td3);

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

		var pfShares = document.createElement("h5");
		pfShares.appendChild(document.createTextNode("Num of Shares: "));
		var pfSharesInput = document.createElement("input");
		pfSharesInput.value = portFolios[i].numShares;
		pfShares.appendChild(pfSharesInput);
		modalDiv5.appendChild(pfShares);

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


/*
function addPfInputTickers(input){

	if(input.value.slice(-1) == ","){
		document.getElementById(input.id).setAttribute("disabled", true);
		document.getElementById("loaderIcon").style.display = "block";
		var ticker = input.value.split(",")[0];
		console.log(ticker);
		fetchFromYahoo1(ticker);
	}
	
}
*/

//Function to add a portFolio
function addPfButton(){
	var pfName = document.getElementById("addPfNameInput");
	var pfTickers = document.getElementById("addPfTickersInput");
	var pfShares = document.getElementById("addPfSharesInput");

	let pfNameValue = pfName.value.replace(/\s+/g, '');
	if( pfNameValue == "" ){
		pfName.style.animation = "0.25s linear 0s 1 normal forwards running error";
		pfName.value = "";
		pfName.placeholder = "Insert Portfolio Name";
		setTimeout(() => {
			pfName.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfName.placeholder = "";
		}, 1500);
	}

	var choicesDiv = document.getElementsByClassName("choices__inner")[0];
	let choicesInput = choicesDiv.getElementsByTagName("input")[0];
	let tickersNum = $('#addPfTickersInput option').length;
	if( tickersNum == 0 ){
		choicesDiv.style.animation = "0.25s linear 0s 1 normal forwards running error";
		choicesInput.placeholder = "Insert Symbol";
		choicesInput.classList.add("selectCheck");
		setTimeout(() => {
			choicesDiv.style.animation = "";
		}, 250);
		setTimeout(() => {
			choicesInput.classList.remove("selectCheck");
			choicesInput.placeholder = "Select Symbols";
		}, 1500);
	}

	let pfSharesValue = pfShares.value.replace(/\s+/g, '');
	let pfSharesNum = pfSharesValue.split(",");
	console.log(pfSharesNum);
	if( pfSharesValue == "" ){
		pfShares.style.animation = "0.25s linear 0s 1 normal forwards running error";
		pfShares.value = "";
		pfShares.placeholder = "Insert Num of Shares";
		setTimeout(() => {
			pfShares.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfShares.placeholder = "";
		}, 1500);
	}
	if( pfSharesNum.length != tickersNum ){
		pfShares.style.animation = "0.25s linear 0s 1 normal forwards running error";
		pfShares.value = "";
		pfShares.placeholder = "Insert a number for symbol";
		setTimeout(() => {
			pfShares.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfShares.placeholder = "";
		}, 1500);
	}
}
