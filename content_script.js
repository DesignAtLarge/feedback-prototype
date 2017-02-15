var student_id;
var rubric_name;
var rubric_number;
var user_id;
var button_url;
var full_comments;
var always_show;
var convoluted_rubric3_mapping = [0, 2, 1, 0, 2, 1, 0, 0];

function filterComments(comments) {

	var result = [];
	
	if (rubric_number == "3") {
		// full comments should be a list with 3 lists inside (a, b and c)
		result.push(comments.filter(function(comment) {
			return comment[1] == "3a";
		}));
		result.push(comments.filter(function(comment) {
			return comment[1] == "3b";
		})); 
		result.push(comments.filter(function(comment) {
			return comment[1] == "3c";
		}));
	} else {
		result = comments.filter(function(comment) {
			return comment[1] == rubric_number;
		});
	}
	return result;
}

function storeAndPrintComments(comments, id_num, index, comments_partitioned) {

	if (rubric_number == 3 && id_num == undefined) {
		$(".rubric-item").each(function(ind) {
			storeAndPrintComments(comments, this.id, ind);
		});
		return;
	}

	var selector_addition = "";
	if (id_num != undefined) {
		selector_addition = "#suggestion_box_" + id_num + " ";
	} 

	$(selector_addition + ".comments_good").html("");
	$(selector_addition + ".comments_bad").html("");
	$(selector_addition + ".comments_should").html("");

	if (rubric_number == 3 && !comments_partitioned) {
		console.log("index: " + index);
		var comments_index = convoluted_rubric3_mapping[index];
		console.log("comments ind: " + comments_index);
		comments = comments[comments_index];
	}


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

      var comment = comments[i][4].replace(/_blank_/g, 
      		"<span class='blank' contenteditable=true>______</span>");

      var string = "<tr"  + 
        " class='comment' style='color: rgb(" + shade + ", " + shade + ", " + shade + ")'>" + 
        	"<td><img class='btn " + i + "' src='" + button_url + "' height=20 width=20 /></td>" +
        	"<td class='comment_" + i + "'>" + comment + "</td>" + 
        "</tr>";

      if (category == "1") {
        $(selector_addition + ".comments_good").append(string);
      } else if (category == "2") {
        $(selector_addition + ".comments_bad").append(string);
      } else if (category == "3") {
        $(selector_addition + ".comments_should").append(string);
      } else {
        $(selector_addition + ".comments_should").append("error with comment category");
      }
    }
    
    // make insert buttons clickable
    $(".btn").unbind("click");
    $(".btn").click(function(obj) { 
      var btn_id_num = $(this).attr("class").split(" ")[1];
      //console.log(btn_id_num);

      var comment = $(this).parents("tr").find(".comment_" + btn_id_num).html();
      //console.log(comment);

      comment = comment.replace(/<span class="blank" contenteditable="true">/g, "").replace(/<\/span>/g, "");

      comment = comment.replace(/"/g, '\\"').replace(/'/g, "\\'");

      var rubric_item = $(this).parents("li.rubric-item").find(".rubric-description").find(".mathInput--preview").html();
      console.log(rubric_item);

      //console.log("inserting comment: " + comment);
      insertComment(comment);
      chrome.runtime.sendMessage({action: "logEvent", 
      							comment_info: comments[btn_id_num], 
      							rubric_question: rubric_name,
      							rubric_item: rubric_item
      						}, function(response) {
      	console.log(response);
      });      

    });

}

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
	//console.log(query);
	//console.log(full_comments);
	var comments_to_search = full_comments;
	if (rubric_number == 3) {
		var box_index = $("#" + id_num).index();
		comments_to_search = full_comments[convoluted_rubric3_mapping[box_index]];
	}

	for (var i = 0; i < comments_to_search.length; i++) {
		var comment = comments_to_search[i];
		if (comment[4].toLowerCase().includes(query.toLowerCase())) {
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

	$(".see_suggestions").click(function() {
		var selected_id_num = this.id.split("see_suggestions_")[1];
		var action = $("#see_suggestions_" + selected_id_num + " .toggle_word").html();
		toggleSuggestionBox(selected_id_num);

		var rubric_item = $(this).parents("li.rubric-item").find(".rubric-description").find(".mathInput--preview").html();
      	console.log(rubric_item);
		
		chrome.runtime.sendMessage({action: "logSuggestion" + action,
									rubric_question: rubric_name,
									rubric_item: rubric_item
			}, function(response) {
				console.log("logging suggestion " + action + ": " + response);
		});

	});

	$(".search_text").on("input", function(e) {
		//console.log(e.target.id);
		searchComments($(this).val(), e.target.id);
	});

	chrome.runtime.sendMessage({action: "loadSpreadsheet"}, function(response) {
		console.log("loading spreadsheet: " + response);
	});
}

$(function() {

	rubric_name = $("#rubric-show-questions .rubric-question-title").html();

	student_id = $("#student-name-tooltip-link").html();
	rubric_number = rubric_name.split(":")[0];
	//console.log("rubric number: " + rubric_number);

	// only work for assignment 5
	if (rubric_name == "1: Revisit the Brief" || rubric_name == "2: Development Plan" ||
		rubric_name == "3: Wireframes" || rubric_name == "4: Skeleton" || rubric_name == "5: Screens") {

		button_url = chrome.extension.getURL("button.png");

		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			//console.log("got comments message");
			if (request.comments) {
				//console.log("storing and printing comments");
				full_comments = filterComments(request.comments);
				//console.log(full_comments);
				storeAndPrintComments(full_comments);
				sendResponse("stored");
			} else if (request == "always show changed") {
				chrome.storage.local.get(null, function(items) {
					always_show = items.always_show;
					if (always_show) {
						showAllSuggestions();
					} else {
						hideAllSuggestions();
					}
					chrome.runtime.sendMessage({action: "logShowSetting"}, function(response) {
						console.log("sent show setting: " + response);
					});
				});
			}
		});

		chrome.storage.local.set({student_id: student_id, rubric_number: rubric_number}, function() {
			console.log("Saved page info");
		});

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

// Update first thing in case there is already text there
/*updateCurrentComment();

$("#question_submission_evaluation_comments").change(function() {
	// every time it changes update again
	updateCurrentComment();
});*/

