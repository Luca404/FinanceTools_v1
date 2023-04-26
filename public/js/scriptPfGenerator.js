//CONST
var questions = [];
var actualQuestion = 0;
var responses = [];
var riskScore = 0;

//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
    showLoginDiv();
	getQuestion();
});
 
server.on("disconnect", () => {
    console.log("Disconnected");
});


function getQuestion(){
	server.emit( "getQuestions", (result) => {
		questions = result["data"];
		answers = result["data"];
		console.log( result["data"] );
	} );
}

function showQuestion(){
	$("#riskQuestionnaireButton").hide();

	var questionTab = document.getElementById("questionTab");
	var tabUl = document.createElement("ul");
	tabUl.classList.add("nav", "nav-pills")
	for(let i=0; i<questions.length; i++){
		var li = document.createElement("li");
		li.classList.add("nav-item");
		
		var a = document.createElement("a");
		a.classList.add("nav-link");
		a.id = "item" + i;
		a.innerText = i+1;
		if( i==0 )
			a.classList.add( "active" );

		li.appendChild(a);
		tabUl.appendChild(li);
	}
	questionTab.appendChild(tabUl);

	$("#questionTab").show();
	$("#nextQuestionButton").show();

	var questionDiv = document.getElementById("questions");
	questionDiv.innerText = questions[actualQuestion]["q"];

	printAnswers();

	$( ".nav-pills .nav-link" ).bind( "click", function(event) {
		event.preventDefault();
		var clickedItem = $( this );
		if( checkOption() || parseInt($(this).text())-1 < actualQuestion ){
			$( ".nav-pills .nav-link" ).each( function() {
				$( this ).removeClass( "active" );
			});
			clickedItem.addClass( "active" );

			responses[actualQuestion] = getCheckedOption();
			actualQuestion = parseInt($(this).text())-1;
			setQuestion();
			printAnswers();
			$('#opt' + responses[actualQuestion]).prop('checked', true)
		}
	});
}

function printAnswers(){
	var answerDiv = document.getElementById("answers");
	while (answerDiv.firstChild)
		answerDiv.removeChild(answerDiv.lastChild);

	for(let i=0;i<answers[actualQuestion]["r"].length;i++){
		//Create answer elements
		formCheckDiv = document.createElement("div");
		formCheckDiv.classList.add("form-check");

		inputAnswer = document.createElement("input");
		inputAnswer.classList.add("form-check-input");
		inputAnswer.type = "radio";
		inputAnswer.name = "flexRadioDefault";
		inputAnswer.id = "opt" + i;

		answerText = document.createElement("label");
		answerText.classList.add("form-check-label");
		answerText.htmlFor = "opt" + i;
		answerText.id = "answer" + i ;
		answerText.innerText = answers[actualQuestion]["r"][i];

		formCheckDiv.appendChild(inputAnswer);
		formCheckDiv.appendChild(answerText);
		answerDiv.appendChild(formCheckDiv);
	}
}	

function nextQuestion(){
	if( checkOption() ){
		responses[actualQuestion] = getCheckedOption();
		uncheckOption();

		$( "#item" + actualQuestion ).removeClass( "active" );
		actualQuestion+=1;
		$( "#item" + actualQuestion ).addClass( "active" );

		var questionDiv = document.getElementById("questions");
		questionDiv.innerText = questions[actualQuestion]["q"];

		if( responses[actualQuestion] )
			$('#opt' + responses[actualQuestion]).prop('checked', true);

		console.log( responses, actualQuestion );
		if( actualQuestion+1 == questions.length ){
			document.getElementById("nextQuestionButton").innerText = "Finish";
			document.getElementById("nextQuestionButton").onclick = finishQuestion;
		}
		else
			printAnswers()
	}
}

function finishQuestion(){
	responses[actualQuestion] = getCheckedOption();
	if( allQuestion() ){
		console.log( "finished" );
		
		for( let i = 0; i<responses.length; i++ ){
			riskScore = riskScore + responses[i]
		}

		console.log( riskScore )
	}
}

function setQuestion(){
	uncheckOption();
	var questionDiv = document.getElementById("questions");
	questionDiv.innerText = questions[actualQuestion]["q"];
	if( actualQuestion+1 == questions.length ){
		document.getElementById("nextQuestionButton").innerText = "Finish";
		document.getElementById("nextQuestionButton").onclick = finishQuestion;
	}
	else{
		document.getElementById("nextQuestionButton").innerText = "Next";
		document.getElementById("nextQuestionButton").onclick = nextQuestion;
	}
}

function allQuestion(){
	if( responses.length < questions.length )
		return false
	
	else{
		for( let i = 0; i < responses.length; i++ ){
			if( responses[i] == undefined || responses[i] == false )
				return false
		}
	}
	return true
}

function checkOption(){
	var bool = $('#opt0').is(':checked')
	for(let i=1; i<answers[actualQuestion]["r"].length; i++)
		bool = bool || $('#opt'+i).is(':checked');

	return bool;
}

function uncheckOption(){
	for(let i=0; i<answers[actualQuestion]["r"].length; i++)
		$('#opt' + i).prop('checked', false);
}

function getCheckedOption(){
	for(let i = 0; i<answers[actualQuestion]["r"].length; i++){
		if( $('#opt' + i).is(':checked') )
			return i;
	}
	return false;
}


//Show login div
function showLoginDiv(){
	let usern = getCookie( "username" );
    userName = usern;
    let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + usern;
}

//Save cookies function
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie( cname ){
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookie = decodedCookie.split(';');
	let cookieName = cname + "=";
	for(let i = 0; i <cookie.length; i++) {
		let c = cookie[i];
		while (c.charAt(0) == ' ') {
		  c = c.substring(1);
		}
		if (c.indexOf(cookieName) == 0) {
		  return c.substring(cookieName.length, c.length);
		}
	}
	return "";
}

//Fix SideBar
function fixContent(){
    var sideBar = document.getElementById("sidebar");
    var content = document.getElementById("content");
    if( sideBar.classList[0] == "active" )
        content.style.marginLeft = "300px";
    else
        content.style.marginLeft = "20px";
}

//Login Functions Section

//Function to check if still logged
function checkIfLogged(){
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookie = decodedCookie.split(';');
	let cookieName = "username=";
	for(let i = 0; i <cookie.length; i++) {
		let c = cookie[i];
		while (c.charAt(0) == ' ') {
		  c = c.substring(1);
		}
		if (c.indexOf(cookieName) == 0) {
		  return c.substring(cookieName.length, c.length);
		}
	}
	return "";
}

//Show modal for registration
function showRegisterModal(){
	$('#registrationModal').modal({backdrop: 'static', keyboard: false, show: true});
	$("#loginModal").modal("hide");	
	$('#loginModal').data('bs.modal',null);
}

//Call server and check if login is ok
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
		//var hashPass = hash(passwd.value);
		server.emit("login",{"username":usrn.value, "password":passwd.value});
	}
}

//If login is successful
function successLogin( usern ){
	var loginModal = document.getElementById("loginModal");
	var content = loginModal.getElementsByClassName("modal-content")[0];
	content.style = "filter: blur(10px)";
	var divSuccess = document.createElement("div");
	divSuccess.appendChild(document.createTextNode("Successfully logged in!"));
	divSuccess.id = "successLoginDiv";
	loginModal.appendChild(divSuccess);
	content.style.pointerEvents = "none";
	loginModal.style.userSelect = "none";
	setTimeout(() => {
		$("#loginModal").modal("hide");
		$("#content").css("filter", "");
	}, 1500);
	setCookie("username",usern,5);
}

//Save cookies function
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

//If login is unsuccessful
function failedLogin( error ){
	var usrn = document.getElementById("usernInput");
	var passwd = document.getElementById("passwdInput");
	if( error == "Wrong Password" ){
		passwd.value = "";
		passwd.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwd.placeholder = "Wrong password";
		setTimeout(() => {
			passwd.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwd.placeholder = "";
		}, 2000);
	}
	else{
		usrn.value = "";
		passwd.value = "";
		usrn.style.animation = "0.25s linear 0s 1 normal forwards running error";
		usrn.placeholder = "Account doesnt exist";
		setTimeout(() => {
			usrn.style.animation = "";
		}, 250);
		setTimeout(() => {
			usrn.placeholder = "";
		}, 2000);
	}
}

//function for register a user
function registerUser(){
	var usrn = document.getElementById("usernInputReg");
	var passwd = document.getElementById("passwdInputReg");
	var passwdConf = document.getElementById("passwdInputConf");
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
	if(passwdConf.value == ""){
		passwdConf.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwdConf.placeholder = "Confirm password";
		setTimeout(() => {
			passwdConf.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwdConf.placeholder = "";
		}, 1500);
	}
	if(passwd.value != passwdConf.value){
		passwdConf.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwdConf.value = "";
		passwdConf.placeholder = "Passwords dont match";
		setTimeout(() => {
			passwdConf.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwdConf.placeholder = "";
		}, 1500);
	}

	if( usrn.value != "" && passwd.value != "" && passwd.value == passwdConf.value ){		
		//var hashPass = hash(passwd.value);
		server.emit("registerUser",{"username":usrn.value, "password":passwd.value});
	}
}

function hash(e){for(var r=0,i=0;i<e.length;i++)r=(r<<5)-r+e.charCodeAt(i),r&=r;return r};


//Onload Functions
function bindScroll( elem ) {
	var el = $( elem );
	if( el.width()-10 > el.parent().width() ){
		setTimeout(function(){
			$(el).addClass( "scrollText" );
		}, 3000);  
	}
	else{
		$(el).css( { marginLeft: "20%" } );
		$(el).removeClass( "scrollText" );
	}
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';
  
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}