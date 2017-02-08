var student_id;
var rubric_number;
var user_id;
var button_url;
var full_comments;

function updateCurrentComment() { // not currently used
	var current_comment = $("#question_submission_evaluation_comments").val();
	console.log(current_comment);

	chrome.storage.local.get(null, function(items) {

		var comments = {};

		if (items.comments != undefined) {
			comments = items.comments;
		}

		comments[student_id] = current_comment;

		console.log("Current comments:");
		console.log(comments);

		chrome.storage.local.set({comments: comments}, function() {
	      	// Notify that we saved.
	      	console.log('Comments saved');
	    });

	  });
	
}

function storeAndPrintComments(comments) {

	$("#comments_good").html("");
	$("#comments_bad").html("");
	$("#comments_should").html("");

	// sort comments ascending by length
    comments = comments.sort(function(info1, info2) {
      var length1 = parseInt(info1[5]);
      var length2 = parseInt(info2[5]);
      if (length1 < length2) {
        return -1;
      } else if (length1 == length2) {
        return 0;
      } else {
        return 1;
      }
    });

    //console.log(comments);

    // sort comments descending by frequency
    comments = comments.sort(function(info1, info2) {
      var freq1 = parseInt(info1[7]);
      var freq2 = parseInt(info2[7]);
      if (freq2 < freq1) {
        return -1;
      } else if (freq1 == freq2) {
        return 0;
      } else {
        return 1;
      }
    });

    //console.log(comments);
    // get max and min frequency
    var max_freq = parseInt(comments[0][7]);
    var min_freq = parseInt(comments[0][7]);
    for (var i = 0; i < comments.length; i++) {
      if (parseInt(comments[i][7]) > max_freq) {
        max_freq = parseInt(comments[i][7]);
      }
      if (parseInt(comments[i][7]) < min_freq) {
        min_freq = parseInt(comments[i][7]);
      } 
    }
    
    // for determining what shade to use on text
    var num_shades;
    if ((max_freq - min_freq) == 0) {
    	num_shades = 1;
    } else {
    	num_shades = 150 / (max_freq - min_freq);
    }
    
    for (var i = 0; i < comments.length; i++) {
      var category = comments[i][6];
      var shade = num_shades * (max_freq - parseInt(comments[i][7]));

      var comment = comments[i][4].replace(/_blank_/g, "<span class='blank' contenteditable=true>______</span>");

      var string = "<tr"  + 
        " class='comment' style='color: rgb(" + shade + ", " + shade + ", " + shade + ")'>" + 
        "<td><img class='btn' id='" + i + "' src='" + button_url + "' height=20 width=20 /></td>" +
        "<td id='comment_" + i + "'>" + comment + "</td></tr>";

      if (category == "1") {
        $("#comments_good").append(string);
      } else if (category == "2") {
        $("#comments_bad").append(string);
      } else if (category == "3") {
        $("#comments_should").append(string);
      } else {
        $("#comments_should").append("error with comment category");
      }
    }
    
    // make insert buttons clickable
    $(".btn").click(function(obj) { 
      //console.log(obj.target.id);

      var comment = $("#comment_" + obj.target.id).html();

      comment = comment.replace(/<span class="blank" contenteditable="true">/g, "").replace(/<\/span>/g, "");

      comment = comment.replace(/"/g, '\\"').replace(/'/g, "\\'");

      //console.log("inserting comment: " + comment);
      insertComment(comment);
      chrome.runtime.sendMessage({action: "logEvent", comment_info: comments[obj.target.id]}, function(response) {
      	console.log(response);
      });      

    });

}

function insertComment(comment) {

	comment = comment.replace(/\\"/g, '"').replace(/\\'/g, "'");

  	$("#question_submission_evaluation_comments").val(
  		$("#question_submission_evaluation_comments").val() + "\n" + comment + "\n");
  	$("#question_submission_evaluation_comments").height($("#question_submission_evaluation_comments")[0].scrollHeight);
  	console.log("doin it");
  
  	// simulate keydown so the new comment will save
  	var event = new KeyboardEvent('keydown');
  	document.querySelector('#question_submission_evaluation_comments').dispatchEvent(event);
}

function searchComments(query) {
	var result_comments = [];
	//console.log(query);
	for (var i = 0; i < full_comments.length; i++) {
		var comment = full_comments[i];
		if (comment[4].toLowerCase().includes(query.toLowerCase())) {
			result_comments.push(comment);
		}
	}
	console.log(result_comments);
	storeAndPrintComments(result_comments);
}

function injectSuggestions() {
	//console.log("injecting suggestions");

	$("#question_submission_evaluation .previously-used-comments").before(
		"<label class='form-label' for='feedback_suggestions' style='color:#004ea3;'>Feedback Suggestions:</label>" + 
		"<div id='suggestion_box' class='rubric-comments'>" + 
			"<input id='search_text' placeholder='Search...' type='text'></input>" +
			'<div id="first_header" class="suggestion_header">"I wish..."</div>' +
		      	"<table id='comments_bad' class='comments_table'></table>" + 
		    '<div class="suggestion_header">"I suggest..."</div>' +
		      	"<table id='comments_should' class='comments_table'></table>" +
		    '<div class="suggestion_header">"I like..."</div>' +
		      	"<table id='comments_good' class='comments_table'></table>" +
		"</div>" + 
		"<div id='sugg_insts'>(Click <img id='example_btn' height=20 width=20 src='" + button_url + 
			"' /> to insert a comment. Double-click a blank to fill it in.)</div>" + 
		"<br/>"
	);

	$("#search_text").on("input", function() {
		searchComments($("#search_text").val());
	});

	chrome.runtime.sendMessage({action: "loadSpreadsheet"}, function(response) {
		console.log("loading spreadsheet: " + response);
	});
}

$(function() {

	student_id = $("#student-name-tooltip-link").html();
	rubric_number = $("#rubric-show-questions .rubric-question-title").html().split(":")[0];
	//console.log("rubric number: " + rubric_number);

	if (rubric_number == 2) {

		button_url = chrome.extension.getURL("button.png");

		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			//console.log("got comments message");
			if (request.comments) {
				//console.log("storing and printing comments");
				full_comments = request.comments;
				storeAndPrintComments(full_comments);
				sendResponse("stored");
			}
		});

		injectSuggestions();

		chrome.storage.local.set({student_id: student_id, rubric_number: rubric_number}, function() {
			console.log("Saved page info");
		});

		chrome.storage.local.get(null, function(items) {
			if (!items.user_id) {
				user_id = Math.random().toString(36) + new Date().getTime();
				chrome.storage.local.set({user_id: user_id});
			} else {
				user_id = items.user_id;
			}
		});
	}
});

// Update first thing in case there is already text there
/*updateCurrentComment();

$("#question_submission_evaluation_comments").change(function() {
	// every time it changes update again
	updateCurrentComment();
});*/

