//CONST
var questions = [];
var actualQuestion = 0;
var responses = [];
var riskScore = 0;


async function onLoad(){
    connectToServer();
    showLoginModal();
	getQuestion();
}

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
		inputAnswer.id = "opt" + (i+1);

		answerText = document.createElement("label");
		answerText.classList.add("form-check-label");
		answerText.htmlFor = "opt" + (i+1);
		answerText.id = "answer" + (i+1);
		answerText.innerText = answers[actualQuestion]["r"][i];

		formCheckDiv.appendChild(inputAnswer);
		formCheckDiv.appendChild(answerText);
		answerDiv.appendChild(formCheckDiv);
	}

	if( responses[actualQuestion] )
		$('#opt' + responses[actualQuestion]).prop('checked', true);
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
	var bool = $('#opt1').is(':checked')
	for(let i=2; i<answers[actualQuestion]["r"].length+1; i++)
		bool = bool || $('#opt'+i).is(':checked');

	return bool;
}

function uncheckOption(){
	for(let i=0; i<answers[actualQuestion]["r"].length; i++)
		$('#opt' + (i+1)).prop('checked', false);
}

function getCheckedOption(){
	for(let i = 0; i<answers[actualQuestion]["r"].length; i++){
		if( $('#opt' + (i+1)).is(':checked') )
			return i+1;
	}
	return false;
}

function finishQuestion(){
	responses[actualQuestion] = getCheckedOption();
	if( allQuestion() ){
		console.log( "finished" );
		
		for( let i = 0; i<responses.length; i++ ){
			riskScore = riskScore + responses[i]
		}

		console.log( riskScore );
		showQuizResult();
	}
}

function showQuizResult(){
	$("#questionContent").hide();
	$(".assetMixLabel").show();
	$(".assetMixLabel").css("display", "flex");
	$(".assetMixLabel").css("justify-content", "center");
	$(".assetMixLabel").css("text-align", "center");

	drawAssetMixGraph()
	$("#retakeQuestionnaireButton").show();
	$("#nextPhase").show();
}

function drawAssetMixGraph(){
	var data = [];
	var labels = ["Bonds","Stocks"];
	if( riskScore < 10 ){
		//100 bond 0 stocks
		data = [100,0];
	}
	else if( riskScore < 20 ){
		//70 bond 30 stocks
		data = [70,30];
	}
	else if( riskScore < 30 ){
		//50 bond 50 stocks
		data = [50,50];
	}
	else if( riskScore < 40 ){
		//30 bond 70 stocks
		data = [30,70];
	}
	else{
		//0 bond 100 stocks
		data = [0,100];

	}

	assetMixCanvas = document.getElementById("assetMixCanvas");
	assetMixCanvas.width = 300;
    assetMixCanvas.height = 50;

	new Chart(assetMixCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                hoverOffset: 2,
                backgroundColor: ["blue","red"]
            }]
        },
		options: {
            tooltips: {
                callbacks: {
                    label: function(context) {
                        return data[context.index]+"% "+labels[context.index];
                    }
                }
            }
        }    
    });

}