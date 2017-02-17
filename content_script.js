var student_id;
var rubric_name;
var rubric_number;
var user_id;
var button_url;
var full_comments;
var always_show;
var full_sorted_comments;
// key = rubric question number, value = how many rubric items that question has
// this is specific to A6
var num_rubric_items = {1: 2, 2: 3, 3: 7, 4: 2, 5: 4};

// take in a list of all the comments for this rubric question
// return result: a list of lists where result[i] is a list holding the comments for rubric item i
function filterComments(comments) {
	// first get only this rubric question number
	comments = comments.filter(function(comment) {
		return comment[1] == rubric_number;
	});

	var result = [];

	// add comments for each rubric item
	var i = 0;
	while (i < num_rubric_items[rubric_number]) {
		result.push(comments.filter(function(comment) {
			return comment[2] == i;
		}));
		i++;
	}

	// now if any of them turned out empty, use all the comments for that rubric item
	for (var j=0; j < result.length; j++) {
		if (result[j].length == 0) {
			result[j] = comments;
		}
	}
	
	//console.log("FILTERED COMMENTS");
	//console.log(result);
	return result;
}

// print all comments for this rubric question
function storeAndPrintAllComments(comments) {
	full_sorted_comments = comments;
	console.log("in store and print all");
	$(".rubric-item").each(function(ind) {
		console.log("rubric item " + ind);
		storeAndPrintComments(comments[ind], this.id, ind);
		//console.log("storing comments for rubric item " + ind);
		//console.log(comments[ind]);
	});
}

// print the comments for the given rubric item
// id_num is the rubric item's HTML id (a long number)
// index is its index in the list of rubric items
// searching = true if this was called by the search function
function storeAndPrintComments(comments, id_num, index, searching) {

	// specifies which rubric item suggestion box we are adding to
	var selector_addition = "#suggestion_box_" + id_num;
	
	$(selector_addition + " .comments_good").html("");
	$(selector_addition + " .comments_bad").html("");
	$(selector_addition + " .comments_should").html("");

	// sort comments ascending by length
    comments = comments.sort(function(info1, info2) {
      var length1 = parseInt(info1[6]);
      var length2 = parseInt(info2[6]);
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
      var freq1 = parseInt(info1[8]);
      var freq2 = parseInt(info2[8]);
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
    var max_freq = parseInt(comments[0][8]);
    var min_freq = parseInt(comments[0][8]);
    for (var i = 0; i < comments.length; i++) {
      if (parseInt(comments[i][8]) > max_freq) {
        max_freq = parseInt(comments[i][8]);
      }
      if (parseInt(comments[i][8]) < min_freq) {
        min_freq = parseInt(comments[i][8]);
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
      var category = comments[i][7];
      var shade = num_shades * (max_freq - parseInt(comments[i][8]));

      var comment = comments[i][5].replace(/_blank_/g, 
      		"<span class='blank' contenteditable=true>______</span>");

      var string = "<tr"  + 
        " class='comment' style='color: rgb(" + shade + ", " + shade + ", " + shade + ")'>" + 
        	"<td><img class='btn " + i + "' src='" + button_url + "' height=20 width=20 /></td>" +
        	"<td class='comment_" + i + "'>" + comment + "</td>" + 
        "</tr>";

      if (category == "1") {
        $(selector_addition + " .comments_good").append(string);
      } else if (category == "2") {
        $(selector_addition + " .comments_bad").append(string);
      } else if (category == "3") {
        $(selector_addition + " .comments_should").append(string);
      } else {
        $(selector_addition + " .comments_should").append("error with comment category");
      }
    }

    // save these for the button callback's use
    if (!searching) {
    	full_sorted_comments[index] = comments;
    }
    
    // make insert buttons clickable
    $(".btn").unbind("click");
    $(".btn").click(function(obj) { 
      var btn_id_num = $(this).attr("class").split(" ")[1];

      // index of this rubric item = index of these comments in full_sorted_comments
      var this_index = $(this).parents("li.rubric-item").index();
      //console.log(this_index);

      var comment = $(this).parents("tr").find(".comment_" + btn_id_num).html();
      //console.log(comment);

      comment = comment.replace(/<span class="blank" contenteditable="true">/g, "").replace(/<\/span>/g, "");

      comment = comment.replace(/"/g, '\\"').replace(/'/g, "\\'");

      var rubric_item = $(this).parents("li.rubric-item").find(".rubric-description").find(".mathInput--preview").html();

      console.log("inserting comment: " + comment);
      console.log(full_sorted_comments[this_index]);
      console.log(full_sorted_comments[this_index][btn_id_num]);
      insertComment(comment);
      chrome.runtime.sendMessage({action: "logEvent", 
      							comment_info: full_sorted_comments[this_index][btn_id_num], 
      							rubric_question: rubric_name,
      							rubric_item: rubric_item
      						}, function(response) {
      	console.log(response);
      });      

    });

}

// comment has been clicked. Add it to the gradescope comment box.
function insertComment(comment) {

	comment = comment.replace(/\\"/g, '"').replace(/\\'/g, "'");

  	$("#question_submission_evaluation_comments").val(
  		$("#question_submission_evaluation_comments").val() + "\n" + comment + "\n");
  	$("#question_submission_evaluation_comments").height($("#question_submission_evaluation_comments")[0].scrollHeight);
  	//console.log("doin it");
  
  	// simulate keydown so the new comment will save
  	var event = new KeyboardEvent('keydown');
  	document.querySelector('#question_submission_evaluation_comments').dispatchEvent(event);
}

function searchComments(query, search_id) {
	var id_num = search_id.split("search_")[1];

	var result_comments = [];
	var box_index = $("#" + id_num).index();
	var comments_to_search = full_comments[box_index];

	for (var i = 0; i < comments_to_search.length; i++) {
		var comment = comments_to_search[i];
		if (comment[5].toLowerCase().includes(query.toLowerCase())) {
			result_comments.push(comment);
		}
	}
	console.log("calling store and print from search");
	console.log(result_comments);
	storeAndPrintComments(result_comments, id_num, $("#" + id_num).index(), true);
}

function toggleSuggestionBox(id_num) {

	$("#suggestion_box_" + id_num).toggle();
	if ($("#see_suggestions_" + id_num + " .toggle_word").html() == "See") {
		$("#see_suggestions_" + id_num + " .toggle_word").html("Hide");
	} else {
		$("#see_suggestions_" + id_num + " .toggle_word").html("See");
	}
}

function hideAllSuggestions() {
	$(".suggestion_box").each(function() {
		if ($(this).is(":visible")) {
			var cur_id_num = this.id.split("suggestion_box_")[1];
			toggleSuggestionBox(cur_id_num);
		}
	});
}

function showAllSuggestions() {
	$(".suggestion_box").each(function() {
		if (!$(this).is(":visible")) {
			var cur_id_num = this.id.split("suggestion_box_")[1];
			toggleSuggestionBox(cur_id_num);
		}
	});
}

// inject suggestion box code underneath each rubric item
function injectSuggestions() {
	//console.log("injecting suggestions");
	var toggle_word = "See";
	var display_setting = " style='display:none;'";
	if (always_show) {
		toggle_word = "Hide";
		display_setting = "";
	}

	$("li.rubric-item").each(function() {

		$(this).append(
			"<div class='see_suggestions' id='see_suggestions_" + this.id + "'>" + 
				"<span class='toggle_word'>" + toggle_word + "</span> suggestions..." + 
			"</div>" +
			"<div id='suggestion_box_" + this.id + "' class='rubric-comments suggestion_box'" + display_setting + ">" + 
				"<input class='search_text' id='search_" + this.id + "' placeholder='Search...' type='text'></input>" +
				'<div class="first_header suggestion_header">"I wish..."</div>' +
			      	"<table class='comments_bad comments_table'></table>" + 
			    '<div class="suggestion_header">"I suggest..."</div>' +
			      	"<table class='comments_should comments_table'></table>" +
			    '<div class="suggestion_header">"I like..."</div>' +
			      	"<table class='comments_good comments_table'></table>" +
			"</div>"
		);
	});

	// see/hide button functionality
	$(".see_suggestions").click(function() {
		var selected_id_num = this.id.split("see_suggestions_")[1];
		var action = $("#see_suggestions_" + selected_id_num + " .toggle_word").html();
		toggleSuggestionBox(selected_id_num);

		var rubric_item = $(this).parents("li.rubric-item").find(".rubric-description").find(".mathInput--preview").html();
		
		// tell chrome to log the event that we just clicked see/hide
		chrome.runtime.sendMessage({action: "logSuggestion" + action,
									rubric_question: rubric_name,
									rubric_item: rubric_item
			}, function(response) {
				console.log("logging suggestion " + action + ": " + response);
		});

	});

	// search functionality
	$(".search_text").on("input", function(e) {
		//console.log(e.target.id);
		searchComments($(this).val(), e.target.id);
	});

	// now that all the base code is there, load in the comments from the spreadsheet
	chrome.runtime.sendMessage({action: "loadSpreadsheet"}, function(response) {
		console.log("loading spreadsheet: " + response);
	});
}

$(function() {

	rubric_name = $("#rubric-show-questions .rubric-question-title").html();

	student_id = $("#student-name-tooltip-link").html();
	rubric_number = rubric_name.split(":")[0];
	//console.log("rubric number: " + rubric_number);

	// only work for assignment 6
	if (rubric_name == "1: POV/Inspiration" || rubric_name == "2: Reading JSON Data" ||
		rubric_name == "3: App Pages" || rubric_name == "4: Development Plan" || rubric_name == "5: Task Description &amp; URL's") {

		button_url = chrome.extension.getURL("button.png");

		// wait to receive the comments from spreadsheet
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			//console.log("got comments message");
			if (request.comments) {
				console.log("storing and printing comments");
				full_comments = filterComments(request.comments);
				//console.log(full_comments);
				storeAndPrintAllComments(full_comments);
				sendResponse("stored");
			// or a notification that the user changed the always show setting
			} else if (request == "always show changed") {
				chrome.storage.local.get(null, function(items) {
					always_show = items.always_show;
					if (always_show) {
						showAllSuggestions();
					} else {
						hideAllSuggestions();
					}
					// tell chrome to log event that setting was changed
					chrome.runtime.sendMessage({action: "logShowSetting"}, function(response) {
						console.log("sent show setting: " + response);
					});
				});
			}
		});

		chrome.storage.local.set({student_id: student_id, rubric_number: rubric_number}, function() {
			console.log("Saved page info");
		});

		// get user id and settings
		chrome.storage.local.get(null, function(items) {
			if (!items.user_id) {
				user_id = Math.random().toString(36) + new Date().getTime();
				always_show = (Math.random() < 0.5);
				console.log("always show setting: " + always_show);
				chrome.storage.local.set({user_id: user_id, always_show: always_show});
			} else if (items.always_show == undefined) {
				user_id = items.user_id;
				always_show = (Math.random() < 0.5);
				console.log("always show setting: " + always_show);
				chrome.storage.local.set({always_show: always_show});
			} else {
				console.log("already stored?");
				user_id = items.user_id;
				always_show = items.always_show;
			}
			console.log("always show done: " + always_show);
			injectSuggestions();
		});

	}
});

