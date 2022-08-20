import * as login from './manageLogin.js';

//CONST
var pfData = [];
var userName = "";
var pfDeleteNum = 0;

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

//Add onload function to body
document.getElementById("corpo").addEventListener("load", setEvent(), false);

//Set event
function setEvent(){
	$("#registerButton").click( login.showRegisterModal );
	$("#loginButton").click( login.checkLogin );
	$("#registerButton2").click( login.registerUser );
	$("#loginButton2").click( showLoginModal );
	$("#addPfDiv").click( addPf );		
	$("#tickerTypeInput").change( showTickerExchange );	
	$("#tickerExchangeInput").change( showTickerExchange );
	$("#profileDiv").click( showUserOption );
	$("#saveChangesButt").click( saveChangesButton );
	$("#deletePfButton").click( deletePfButt );
	$("#addPfSharesNumInput").keypress( filterLetters );
}

//Show user option for disconnect
function showUserOption(){

}

//Draw profile div
function drawProfileDiv( username ){
	let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + username;
	server.emit("getPfList",{"username":username}, (data) => {
		pfData = [];
		if( data.length > 0 ){
			pfData = data;
			loadTable1(data);
		}
		else{
			console.log("No saved Portfolio for logged user!");
		}
	});
}

//Show modal for login
function showLoginModal(){
	let usern = login.checkIfLogged()
	userName = usern;
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
		tickersData[i] = {value: data.type + ":" + data.exchange, label: data.data[i].s, placeholderValue: data.data[i].n };
	}
	multipleSelect.setChoices( tickersData, "value", "label", "placeholderValue");
}

//Load table with portfolios
function loadTable1(data){
	var portFolios = data;
	var tbody = document.getElementById("tbody1");
	$("#tbody1 tr").remove( ".itemTabella" );
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

		var td4 = document.createElement("td");
		td4.className = "modifyTd"
		
		//Add modify button
		var modifyButton = document.createElement("button");
		modifyButton.id = "modifyButt" + i;
        modifyButton.className = "btn btn-dark modifyPf";
        modifyButton.type = "button";
		modifyButton.dataset.toggle = "modal";
		modifyButton.dataset.target = "#addModal";
		modifyButton.onclick = function() { modifyPf(this); };
		var modifyImg = document.createElement("img");
		modifyImg.id = "modifyImg";
		modifyImg.src = "static/img/modify-icon.jpg";
		modifyButton.append(modifyImg);

		//Add delete button
		var deleteButton = document.createElement("button");
		//button.appendChild(document.createTextNode("Modify"));
		deleteButton.id = "deleteButt" + i;
        deleteButton.className = "btn btn-dark deletePf";
        deleteButton.type = "button";
		deleteButton.dataset.toggle = "modal";
		deleteButton.dataset.target = "#deleteModal";
		deleteButton.onclick = function() { deletePf(this); };
		var deleteImg = document.createElement("img");
		deleteImg.id = "deleteImg";
		deleteImg.src = "static/img/delete-icon-1.png";
		deleteButton.append(deleteImg);

        td4.appendChild(modifyButton);
		td4.appendChild(deleteButton);

		tr.appendChild(td4);

		tbody.insertBefore( tr, tbody.lastElementChild);
	}
}

//Function for modify a portfolio
async function modifyPf(item){
	multipleSelect.clearStore();
	showTickerExchange();
	$("#addModalLabel").text("Modify Portfolio");
	var pfNum = item.id.toString();
	pfNum = pfNum.split("modifyButt")[1];
	$("#addPfNameInput").val(pfData[pfNum].pfName);
	$("#addPfSharesNumInput").val(pfData[pfNum].numShares);
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

//Function for show modal to delete a portfolio
function deletePf(item){
	var pfNum = item.id.toString();
	pfDeleteNum = pfNum.split("deleteButt")[1];
	var h5 = document.getElementById("deletePfText");
	var text = "Are you sure you want to delete '" + pfData[pfDeleteNum].pfName + "' ?";
	h5.innerText = text;
}

//Function for delete a portfolio
function deletePfButt(){
	server.emit( "deletePf", pfData[pfDeleteNum], (result) => {
		if( result ){
			let delModal = document.getElementById("deleteModal");
			let content = delModal.getElementsByClassName("modal-content")[0];
			content.style = "filter: blur(10px)";
			var divSuccess = document.createElement("div");
			divSuccess.appendChild(document.createTextNode("Portfolio deleted successfully"));
			divSuccess.id = "successDeleteDiv";
			delModal.appendChild(divSuccess);
			content.style.pointerEvents = "none";
			delModal.style.userSelect = "none";
			delModal.style.flexWrap = "wrap";
			setTimeout(() => {
				$("#deleteModal").modal("hide");
				$("#successDeleteDiv").remove();
				content.style = "filter: blur(0px)";
			}, 1500);
			server.emit("getPfList",{"username":userName}, (data) =>{ 
				pfData = [];
				if( data.length > 0 ){
					pfData = data;
					loadTable1(data);
				}
				else{
					console.log("Error");
				}
			});
		}
		else{
			alert("Error with the server");
		}
	});
}

function addPf(){
	multipleSelect.clearStore();
	$("#addModalLabel").text("Add Portfolio");	
	$("#addPfNameInput").val("");
	$("#addPfSharesNumInput").val("");	
	showTickerExchange();
}

//Function to add a portFolio
function saveChangesButton(){
	let check = true;
	var pfName = document.getElementById("addPfNameInput");
	var pfTickersOpt = $('#addPfTickersInput option');
	var pfTickers = [];
	var pfTypes = [];
	var pfShares = [];

	//Check PF Name
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
		check = false;
	}

	//Check Pf tickers
	var choicesDiv = document.getElementsByClassName("choices__inner")[0];
	let choicesInput = choicesDiv.getElementsByTagName("input")[0];
	let tickersNum = $('#addPfTickersInput option').length;
	for( let i = 0; i < tickersNum; i++ ){
		pfTickers.push( pfTickersOpt[i].label );
		pfTypes.push( pfTickersOpt[i].value );
	}
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
		check = false;
	}

	//Check numbers of shares
	let pfSharesInput = document.getElementById("addPfSharesNumInput");
	let pfSharesValue = pfSharesInput.value.replace(/\s+/g, '');
	let pfSharesNum = pfSharesValue.split(",");
	let done = true;
	for(let i = 0 ; i < pfSharesNum.length; i++){
		pfShares.push( parseInt(pfSharesNum[i]) );
		if( pfSharesNum[i] == "" )
			done = false;
	}
	console.log( pfShares );
	if( pfSharesValue == "" ){
		pfSharesInput.style.animation = "0.25s linear 0s 1 normal forwards running error";
		pfSharesInput.value = "";
		pfSharesInput.placeholder = "Insert Num of Shares";
		setTimeout(() => {
			pfSharesInput.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfSharesInput.placeholder = "";
		}, 1500);
		check = false;
	}
	if( pfSharesNum.length != tickersNum || !done ){
		pfSharesInput.style.animation = "0.25s linear 0s 1 normal forwards running error";
		let text = pfSharesInput.value;
		pfSharesInput.value = "";
		pfSharesInput.placeholder = "Insert a number for symbol";
		setTimeout(() => {
			pfSharesInput.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfSharesInput.placeholder = "";
			pfSharesInput.value = text;
		}, 1500);
		check = false;
	}
	if( check )
		server.emit( "savePf", {userID: userName, pfName: pfNameValue, tickers: pfTickers, type: pfTypes, numShares: pfShares }, (result) => {
			if( result ){
				let addModal = document.getElementById("addModal");
				let content = addModal.getElementsByClassName("modal-content")[0];
				content.style = "filter: blur(10px)";
				var divSuccess = document.createElement("div");
				divSuccess.appendChild(document.createTextNode("Portfolio added successfully"));
				divSuccess.id = "successSavedDiv";
				addModal.appendChild(divSuccess);
				content.style.pointerEvents = "none";
				addModal.style.userSelect = "none";
				setTimeout(() => {
					$("#addModal").modal("hide");
					$("#successSavedDiv").remove();
					content.style = "filter: blur(0px)";
				}, 1500);
				server.emit("getPfList",{"username":userName}, (data) => {
					pfData = [];
					if( data.length > 0 ){
						pfData = data;
						loadTable1(data);
					}
					else{
						console.log("Error!!");
					}
				});
			}
			else{
				alert("Error with server");
			}
		});
}

function filterLetters(evt){
	var hold = String.fromCharCode(evt.which);  
	if((/[a-z A-Z*!@#$%^&*()_/[\]}=+><{?":;.'"|]/.test(hold))){  
	  evt.preventDefault();  
	}
}