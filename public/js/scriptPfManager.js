import * as login from './manageLogin.js';

//CONST
var pfData = [];
var multiSelectOption = {
	removeItemButton: true,
	addItems: true,
	loadingText: 'Loading...',
	noResultsText: 'No results found',
	noChoicesText: 'No choices',
    searchFields: ['label', 'value'],
	shouldSort: false,
	placeholder: true,
    shouldSortItems: false,
	searchResultLimit: 6,
	//itemSelectText: 'Press to select',
};
var multipleSelect = new Choices('#addPfTickersInput', multiSelectOption );



//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
	showLoginModal();
});
 
server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("loginResult", (data) => {
	if( data["status"] ){
		login.successLogin( data["text"] );
		drawProfileDiv( data["text"] );
	}
	else
		login.failedLogin( data["text"] );
});

server.on("returnPfList", (data) => {
	if( data.length > 0 ){
		pfData = data;
		loadTable1(data);
	}
	else{
		console.log("No saved Portfolio for logged user!");
	}
});


//Add onload function to body
document.getElementById("corpo").addEventListener("load", setEvent(), false);

//Set event
function setEvent(){
	$("#registerButton").click( login.showRegisterModal );
	$("#loginButton").click( login.checkLogin );
	$("#registerButton2").click( login.registerUser );
	$("#loginButton2").click( showLoginModal );
	$("#addTdDiv").click( showTickerExchange );
	$("#addTdDiv").click( addPf );		
	$("#tickerTypeInput").change( showTickerExchange );	
	$("#tickerExchangeInput").change( showTickerExchange );
	$("#profileDiv").click( showUserOption );
	$("#addPfButt").click( addPfButton );
}

//Show user option for disconnect
function showUserOption(){

}

//Draw profile div
function drawProfileDiv( username ){
	let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + username;
	server.emit("getPfList",{"username":username});
}

//Show modal for login
function showLoginModal(){
	let usern = login.checkIfLogged()
	if( usern == "" ){
		$("#content").css("filter", "blur(5px)");
		$('#loginModal').modal({backdrop: 'static', keyboard: false, show: true});
		$("#registrationModal").modal("hide");
		$('#registrationModal').data('bs.modal',null);
	}
	else{
		drawProfileDiv(usern);
	}
}

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
	server.emit( "getTickersList", {"type": selectedType, "exchange": selectedExchange}, (result) => {
		showTickersInInput(result);
	});
}

//Function to change selected ticker type and exchange
async function changeSelectedExchange( type, exchange ){
	var inputTickerType = document.getElementById("tickerTypeInput");
	inputTickerType.value = type;
	let selectedType = inputTickerType.options[inputTickerType.selectedIndex].text;
	if( selectedType == "Stocks" ){
		var inputExchange = document.getElementById("tickerExchangeInput");
		inputExchange.value = exchange;
		inputExchange.style.display = "inline-block";
	}
	else{
		inputExchange.style.display = "none";
	}
}

//Show dropdown menu with the tickers list from the server
async function showTickersInInput(data){
	var tickersData = [];
	for( var i = 0; i < data.data.length; i++ ){
		//tickersData[i] = {value: data[i].s, label: data[i].n + " (" + data[i].s + ")", title: data[i].n};
		tickersData[i] = {value: data.data[i].s, label: data.data[i].s, placeholderValue: data.data[i].n };
	}
	multipleSelect.setChoices( tickersData, "value", "label", "placeholderValue");
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
		//button.dataset.target = "#modifyModal" + i;
		button.dataset.target = "#addModal";
		button.onclick = function() { modifyPfManager(this); };
		var modifyImg = document.createElement("img");
		modifyImg.id = "modifyImg";
		modifyImg.src = "static/img/modify-icon.jpg";
		button.append(modifyImg);
        td3.appendChild(button);
		tr.appendChild(td3);
		tbody.insertBefore( tr, tbody.lastElementChild);
	}
}

async function modifyPfManager(item){
	multipleSelect.clearStore();
	showTickerExchange();
	$("#addModalLabel").text("Modify Portfolio");
	var pfNum = item.id.toString();
	pfNum = pfNum.split("modifyButt")[1];
	$("#addPfNameInput").val(pfData[pfNum].pfName);
	$("#addPfSharesInput").val(pfData[pfNum].numShares);
	console.log(pfData[pfNum]);
	var inputTickerType = document.getElementById("tickerTypeInput");
	var selectedType = inputTickerType.options[inputTickerType.selectedIndex].value;
	var inputExchange = document.getElementById("tickerExchangeInput");
	var selectedExchange = inputExchange.options[inputExchange.selectedIndex].value;
	for( let i = 0; i<pfData[pfNum].tickers.length; i++ ){
		selectedType = inputTickerType.options[inputTickerType.selectedIndex].value;
		selectedExchange = inputExchange.options[inputExchange.selectedIndex].value;
		var type = pfData[pfNum].type[i].split(":")[0];
		var exch = pfData[pfNum].type[i].split(":")[1];
		console.log( "selectedExch: ", selectedExchange );
		console.log( "tickerExch: ", exch );
		await new Promise(r => setTimeout(r, 200));
		if( selectedType.toLowerCase() != type || selectedExchange.toLowerCase() != exch ){
			console.log("typeDiverso:", pfData[pfNum].tickers[i]);
			server.emit( "getTickersList", {"type": type, "exchange": exch}, (result) => {		
				showTickersInInput(result);
				changeSelectedExchange(type, exch);					
				multipleSelect.setChoiceByValue(pfData[pfNum].tickers[i]);
			});	
		}
		else{
			console.log("typeUguale: ", pfData[pfNum].tickers[i]);
			multipleSelect.setChoiceByValue(pfData[pfNum].tickers[i]);
		}
	}
}

function addPf(){
	multipleSelect.clearStore();
	$("#addModalLabel").text("Add Portfolio");	
	$("#addPfNameInput").val("");
	$("#addPfSharesInput").val("");
}

//Function to add a portFolio
function addPfButton(){
	console.log("pollo");
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
