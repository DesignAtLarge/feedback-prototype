//Special NOTE: change of rubric_item, the original rubric_item is based on the mark deducted. Thus, if the rubric
//change the score input, original related comments won't be displayed. Thus, now it changed to match the number related to item,
//if you want to store in the original way, copy the code below and change rubric item:
//var rubric_item=$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html();
//and remember to add the dict to fetch the rubric item in the middle
	// $(".rubricItem").each(function(){
	// 	var num=$(this).children("button").html();
	// 	console.log("num is "+num);
	// 	var item=$(this).children().children().html();
	// 	console.log("item IIS "+item);
	// 	rubric_item_dict[num]=item;
	// });

//NOTE: rubric_item is for the rubric item itself(i.e.:-0.5), now it would be fetch from the 
//submissionGraderPoints>span
//note before start: refer to background.js for why there
//are comment[0,1,2,blabla]
//comment[0]==id(row number in google sheet)
//comment[1]==rubric question number
//comment[2]==assignment_number
//comment[3]==rubric_item
//comment[4]==submission_number
//comment[5]==comment text itself
//comment[6]==length of comment text(string)
//comment[8]==frequency
//comment[10]== if the comment is from PDF textbox
//comment[11]==user_id



var student_id;
var rubric_name;//question itself
var rubric_number; //the question itself
var user_id;
var rubric_item_applied;
var button_url;
var full_comments;
var always_show;
var full_sorted_comments;
var original_text; // text that was already in the comment box
var comment_text; // the text they have entered so far in the comment box
var comments_inserted = {}; // list with text of comments they have inserted on this page. format: { id: text }
// key = rubric question number, value = how many rubric items that question has
// this is specific to A6



//console.log($('.taBox--textarea'));

if(window.location.pathname.indexOf('assignments')>=0){
	console.log("in batch page");
	url_set= new Set();
	var i=0;
	let list= $("a[class='link-noUnderline']");
	while(i<list.length){
		url_set.add(list[i].href);
		i++;
	}
	var url_list=Array.from(url_set);
	console.log(url_list);
	chrome.storage.local.set({url_list:url_list});
}



//follow the demo, the key is the question itself and the value is the num of rubric items
var num_rubric_items = {1.1:7,1.2:7,1.3:7,1.4: 7,1.5: 7, 2.1:7,2.2:7, 2.3: 7, 3.1:7, 3.2:7, 3.3:7, 3.4:7, 3.5:7, 4.1:7,
	4.2: 7, 4.3:7, 4.4:7, 4.5:7, 5.1:7, 5.2:7,5.3:7, 5.4:7, 5.5:7,6.1:7,6.2:7,6.3:7,6.4: 7,6.5: 7,
	7.1:7,7.2:7,7.3:7,7.4: 7,7.5: 7, 2.4:7,2.5:7,
	 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7};

//get the assignment number and submission number
var attrobj= jQuery.parseJSON($("div[data-react-class]").attr('data-react-props'));
var ass_number=attrobj['assignment']['id'];
var ass_name= attrobj['course']['shortname'];
var sub_number=attrobj['assignment_submission']['id'];
console.log(attrobj);

//grader name to be stored as the username in the end
var grader_name=attrobj['file_comment_user_name'];
console.log(grader_name);
chrome.storage.local.set({assignment_num:ass_number, submission_num:sub_number});



$(document).ready(function(){
	var student_name= $("abbr[role=button]").attr('aria-label');
	student_name=student_name.replace("and ","");
	
	student_name_list= student_name.split(",");
	for(var i=0;i<student_name_list.length;i++){
		student_name_list[i]=student_name_list[i].trim();
	}
	console.log(student_name_list)
	chrome.runtime.sendMessage({action:"sendStudentSubmission",
	sub_number:sub_number,
	student_name_list: student_name_list
	});
});



$(document).ready(function(){
	original_text=$('.form--textArea').val();
});


// take in a list of all the comments for this rubric question
// return result: a list of lists where result[i] is a list holding the comments for rubric item i
function filterComments(comments) {
	// first get only this rubric question number
	
	// comments = comments.filter(function(comment) {
	// 	return (comment[7] != "0" && (comment[1].includes(rubric_number) || comment[1].includes("0")));
	// });

	var result = [];
	console.log("question number: "+rubric_number);
	// deal with comments that apply to multiple rubric questions
	/*for (var i = 0; i < comments.length; i++) {
		var comment = comments[i]
		var rubric_numbers = comment[1].split("/");
		if (rubric_numbers.length > 1) {
			if (rubric_numbers[0] == rubric_number) {
				comments[i][2] = comments[i][2].split("/")[0];
			} else if (rubric_numbers[1] == rubric_number) {
				comments[i][2] = comments[i][2].split("/")[1];
			} else {
				console.log("error, wtf did you do");
			}
		}
		//console.log(comments[i]);
	}*/

	// add comments for each rubric item
	var i = 0;
	while (i < num_rubric_items[rubric_number]) {
		result.push(comments.filter(function(comment) {
			/*var rubric_items = comment[2].split(" ");
			return rubric_items.includes(i.toString());*/
			return comment[1]==rubric_number;
			//return true;
		}));
		i++;
	}

	// now if any of them turned out empty, use all the comments for that rubric item
	/*for (var j=0; j < result.length; j++) {
		if (result[j].length == 0) {
			result[j] = comments;
		}
	}*/
	
	console.log("FILTERED COMMENTS");
	console.log(result);
	return result;
}

// print all comments for this rubric question
function storeAndPrintAllComments(comments) {
	full_sorted_comments = comments;

	console.log("in store and print all comments");
	rubric_item_dict={};

	//console.log("val for rubric_item_dict[1] "+rubric_item_dict[1]);
	$(".rubricItem--key").each(function(ind) {
		// don't show suggs for None rubric item
		if (ind < num_rubric_items[rubric_number] && comments[ind].length > 0) { 
			var rub=ind+1;
			storeAndPrintComments(rub,comments[ind], ind, ind,false,false);
			console.log("storing comments for rubric item " + ind);
			console.log(comments[ind]);
		}
		// else if (ind < num_rubric_items[rubric_number]) {
		// 	$("#search_" + ind).hide();
		// }
	});
}

// print the comments for the given rubric item
// id_num is the rubric item's HTML id (a long number)
// index is its index in the list of rubric items
// searching = true if this was called by the search function
function storeAndPrintComments(rub,comments, id_num, index, searching,PDF) {
	console.log("id num in store and print "+id_num);

	id_num=id_num+1;
	fit_comments=comments.filter(function(comment){
		return comment[3]==rub;
	});
	comments=fit_comments;
	// specifies which rubric item suggestion box we are adding to
	if(PDF){
		var selector_addition="#suggestion_box_pdf_"+id_num;

	}else{
	var selector_addition = "#suggestion_box_" + id_num;
	}
	$(selector_addition + " .comments_good").html("");
	// $(selector_addition + " .comments_bad").html("");
	// $(selector_addition + " .comments_should").html("");

	//if comments is empty, just return
	if(comments.length==0){
		return;
	}




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



	comments= comments.sort(function(info1,info2){
		var nameA= (info1[5].split(' '))[0].toLowerCase();
		var nameB = (info2[5].split(' '))[0].toLowerCase();
		if(nameA === nameB) return 0; 
    	return nameA > nameB ? 1 : -1;

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
	



    //A10: put non-0 comments first (ones specific to this rubric question)
    var comments_0 = [];
    var comments_non0 = [];
    for (var i = 0; i < comments.length; i++) {
    	if (parseInt(comments[i][1]) == 0) {
    		comments_0.push(comments[i]);
    	} else {
    		comments_non0.push(comments[i]);
    	}
    }

    comments = comments_non0.concat(comments_0);

    console.log(comments);
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
      		"<input type='text' class='blank' />");

      var blank_values = "";
      if (comments[i][10] != undefined) {
	    blank_values = comments[i][10].split(", ");
	  }
	  if(!PDF){
      var string = "<tr"  + 
        " class='comment' style='color: rgb(" + shade + ", " + shade + ", " + shade + ")'>" + 
        	"<td><img class='btn " + i + "' src='" + button_url + "' height=20 width=20 /></td>" +
        	"<td class='comment_" + i + "' data-blanks='" + blank_values + "'>" + comment + "</td>" + 
        "</tr>";
	  }else{
		var string = "<tr"  + 
        " class='comment' style='color: rgb(" + shade + ", " + shade + ", " + shade + ")'>" + 
        	"<td class='comment_" + i + "' data-blanks='" + blank_values + "'>" + comment + "</td>" + 
        "</tr>";
	  }
      if (category == "1") {
        $(selector_addition + " .comments_good").append(string);
	  }else {
        $(selector_addition + " .comments_should").append("error with comment category");
      }

      // now make the "blank" placeholders show 
      if (comments[i][10] != undefined) {

	    $(selector_addition).find(".comment_" + i).each(function() {

	    	var blanks = $(this).attr("data-blanks").split(",");

	    	$(this).find(".blank").each(function() {
		    	$(this).attr("placeholder", blanks[$(this).index()]);
		    });
		});
	  }
    }



	
    
    if (!searching) {
    	// save these for the button callback's use
		full_sorted_comments[index] = comments;
    	// hide search bar if there are 5 or less comments (unnecessary)
    	if (comments.length <= 5) {
    		$("#search_" + id_num).hide();
    	}
    }
	


	//add the comment to the ta-box when the btn_pdf is clicked





	  
	// 	  // simulate blur so the new comment will save
	// 	  var event = new KeyboardEvent('keydown');
	// 	  document.querySelector('.taBox--textarea').dispatchEvent(event);

	// });





    // make insert buttons clickable
    $(".btn").unbind("click");
    $(".btn").click(function(obj) { 
	  // button clicked! insert suggestion
      var btn_id_num = $(this).attr("class").split(" ")[1];

			// index of this rubric item = index of these comments in full_sorted_comments
			//* find the gradescope correspondence here***
			var this_index = $(this).parents("div").attr('id').slice(-1)-1;
      console.log(this_index);
	   console.log(full_sorted_comments)
	  var comment = $(this).parents("tr").find(".comment_" + btn_id_num).html();
	  
      //console.log(comment);

      // remove the blanky stuff
      var blank_loc = comment.indexOf("<input");
      var blank_i = 0;
      while (blank_loc != -1) {
      	comment = comment.replace(/<input.*?>/, $(this).parents("tr").find(".blank").get(blank_i).value);
      	blank_i++;
      	blank_loc = comment.indexOf("<input");
      }

      comment = comment.replace(/"/g, '\\"').replace(/'/g, "\\'");

	  //var rubric_item = $(this).parents("li").find(".rubricItem--pointsAndDescription").find(".rubricField-points").html();
	  var rubric_item=$(".rubricItem--key-applied").html();
	  rubric_item_applied=rubric_item;
	  console.log("inserting comment: " + comment);
      console.log(full_sorted_comments[this_index]);
      console.log(full_sorted_comments[this_index][btn_id_num]);
      var comment_id = full_sorted_comments[this_index][btn_id_num][0];
      insertComment(comment, comment_id);
      chrome.runtime.sendMessage({action: "logEvent", 
      							comment_info: full_sorted_comments[this_index][btn_id_num], 
      							rubric_question: rubric_name,
								rubric_item: rubric_item,
								comment: comment,
								submission_num: sub_number
      						}, function(response) {
		  console.log(response);
      });      

    });

}





function updateCommentViews(view_id) {

	console.log('view_id is '+view_id);
	setTimeout(function(){ 
		$(".comment_view_text").each(function(ind) {
			if (view_id == undefined || this.id != view_id) {
				$(this).val($(".form--textArea").val());
			}
		});
		// save current text
		comment_text = $('.form--textArea').val();

		if (original_text != "") {
			var split = comment_text.split(original_text);
			console.log("split is: "+split);
			if (split.length == 2) {
				comment_text = split[1];
			} else {
				comment_text = split[0];
			}
		}
		console.log("got updated comments: ")
		console.log(comment_text);

		chrome.storage.local.set({comment_text: comment_text, comments_inserted: comments_inserted, 
			comments_rubric_number: rubric_number, saved: false,rubric_item:rubric_item_applied});
	}, 100);
	
}

function updateCommentBox(view_id) {
	console.log("In update, this.id is "+view_id);
	setTimeout(function(){ 
		$(".form--textArea").val($("#" + view_id).val());
		setTimeout(function() {
			updateCommentViews(view_id);
		}, 1000);
	}, 100);
	// simulate blur so the new comment will save
	var event = new KeyboardEvent('blur');
	document.querySelector('.form--textArea').dispatchEvent(event);
}

// comment has been clicked. Add it to the gradescope comment box.
function insertComment(comment, comment_id) {

	comment = comment.replace(/\\"/g, '"').replace(/\\'/g, "'");

	comments_inserted[comment_id] = comment;
		//find if the corresponding gradescope name changed
  	$(".form--textArea").val(
  		$(".form--textArea").val() + "\n" + comment + "\n");
  	$(".form--textArea").height($(".form--textArea")[0].scrollHeight);
  	//console.log("making the insertion");
  
  	// simulate blur so the new comment will save
  	var event = new KeyboardEvent('keydown');
  	document.querySelector('.form--textArea').dispatchEvent(event);
}

function searchComments(query, search_id) {
	var id_num = search_id.split("search_")[1];
	var result_comments = [];
	//TODO:change box index, I think it should be 0 if we display all the comments?
	var box_index = $("#" + id_num).index();
	console.log("box index: "+box_index);
	console.log("full comments has a thing: "+full_comments[full_comments.length-1]);
	var comments_to_search = full_comments[full_comments.length-1];

	for (var i = 0; i < comments_to_search.length; i++) {
		var comment = comments_to_search[i];
		if (comment[5].toLowerCase().includes(query.toLowerCase())) {
			result_comments.push(comment);
		}
	}
	console.log("calling store and print from search");
	console.log(result_comments);
	storeAndPrintComments(id_num,result_comments, id_num-1, id_num-1, true);
}

function toggleSuggestionBox(id_num) {

	$("#suggestion_container_" + id_num).toggle();
	if ($("#see_suggestions_" + id_num + " .toggle_word").html() == "See") {
		$("#see_suggestions_" + id_num + " .toggle_word").html("Hide");
	} else {
		$("#see_suggestions_" + id_num + " .toggle_word").html("See");
	}
}

function hideAllSuggestions() {
	$(".suggestion_container").each(function() {
		if ($(this).is(":visible")) {
			var cur_id_num = this.id.split("suggestion_container_")[1];
			toggleSuggestionBox(cur_id_num);
		}
	});
}

function showAllSuggestions() {
	$(".suggestion_container").each(function() {
		if (!$(this).is(":visible")) {
			var cur_id_num = this.id.split("suggestion_container_")[1];
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

	//TODO: now gradescope has no id for the li.rubricEntryDragContainer
	$("li.rubricEntryDragContainer").each(function(ind) {
		var this_id=$(this).find(".rubricItem--key").html();
			
		// don't show suggs for None rubric item
		if (ind < num_rubric_items[rubric_number]) { 
			
			//var this_id=$(this).find(".rubricItem--key").html();
			//console.log("new var value is "+this_id);
			$(this).append(
				"<div class='see_suggestions' id='see_suggestions_" + this_id + "'>" + 
					"<span class='toggle_word'>" + toggle_word + "</span> suggestions..." + 
				"</div>" +
				"<div id='suggestion_container_" + this_id + "' class='suggestion_container'" + display_setting + ">" +
					"<div id='suggestion_box_" + this_id + "' class='rubric-comments suggestion_box'>" + 
						"<input class='search_text' id='search_" + this_id + "' placeholder='Search...' type='text'></input>" +
					    '<div class="first_header suggestion_header">Suggestions:</div>' +
					      	"<table class='comments_good comments_table'></table>" +
					"</div>" + 
				"</div>"
			);
			//$(this).find(".comment_view_text").val($(".form--textarea").val());
		}
	});

	
	$(
		"<div class='category_selection'>"+
		"<span  id ='ins_check' style='color:red'>Check boxes below if you meet the critiria. If you don't want to comment, press 'z' for next question</span>"+
		"<br/>"+
		"<input type='checkbox' class='catCheck--spec' name='category' value='is_specific' style='height:10px; width:10px;'>Is specific"+
		"<input type='checkbox' class='catCheck--act' name='category' value='is_actionable' style='height:10px; width:10px;'>Is actionable"+
		"<input type='checkbox' class='catCheck--just' name='category' value='is_justified' style='height:10px; width:10px;'>Is justified"+
		"</div>"
	).insertAfter(".form--textArea");


	//disable the nextQuestion button until all checkbox clicked
	$(document).ready(function(){
		$(".actionBar--action-next").attr('disabled',true);
		let cur_url= window.location.href
		chrome.storage.local.get(null, function(items){
		url_list= items.url_list;
		console.log(url_list.length);
		url_list.forEach(function(element){
			if(cur_url.indexOf(element)>-1){
				url_list=url_list.filter(function(a){return a!==element;});
			}
		});
		console.log(url_list.length);
		chrome.storage.local.set({url_list:url_list});
			if((url_list).length>0){
				console.log($(".actionBar--action-next")[0].href);
				$(".actionBar--action-next")[0].href=url_list[Math.floor(Math.random() * url_list.length)];
				console.log($(".actionBar--action-next")[0].href);
			}
		})
	});


	//trigger word function: if the 
	$(document).change(function(){
		comment_text = $('.form--textArea').val();
		comment_split=comment_text.split(" ");
		if (comment_split.includes('may')||comment_split.includes('should')){
			$('.catCheck--act').prop('checked',true);
		}
		if(comment_split.includes('because')||comment_split.includes('so')){
			$('.catCheck--just').prop('checked',true);
		}
		
	});

	$(document).change(function(){
		if($('input[class="catCheck--spec"]').is(':checked')){
			if($('input[class="catCheck--act"]').is(':checked')){
				if($('input[class="catCheck--just"]').is(':checked')){
					$('#ins_check').text('Good to go!');
					$('#ins_check').css('color','green');
					
				}else{
					$('#ins_check').css('color','red');
					$('#ins_check').text('Your comment can be more justified.');
				}
			}else if($('input[class="catCheck--just"]').is(':checked')){
				$('#ins_check').css('color','red');
				$('#ins_check').text('Your comment can be more actionable.');
			}else{
				$('#ins_check').css('color','red');
				$('#ins_check').text('Your comment could be improved to be more actionable and justified.');
			}
		}else if($('input[class="catCheck--act"]').is(':checked')){
			if($('input[class="catCheck--just"]').is(':checked')){
				$('#ins_check').css('color','red');
				$('#ins_check').text('Your comment is actionable and justified, just be specific.');
			}else{
				$('#ins_check').css('color','red');
				$('#ins_check').text('Your comment is actionable only, make it better.');
			}
		}else if($('input[class="catCheck--just"]').is(':checked')){
			$('#ins_check').css('color','red');
			$('#ins_check').text('Your comment is justified only, make it better.');
		}else{
			$('#ins_check').css('color','red');
			$('#ins_check').text('If you believe your comment meets the criteria listed below, check them.');
		}


	});



	$(document).change(function(){
		var count=$('input[name="category"]:checked').length;
		if(count==3){
			$(".actionBar--action-next").attr('disabled',false);
		}else{
			$(".actionBar--action-next").attr('disabled',true);
		}


	});

	//hide all the suggestion first, then let the related suggestions pop up as needed
	$(document).ready(function(){
		if(!always_show){
		hideAllSuggestions();
		id_already_there=$('.rubricItem--key-applied').html();
		if (!$('suggestion_container_'+id_already_there).is(":visible")) {
			toggleSuggestionBox(id_already_there);
		}
	}
	});


	$(document).ready(function(){
		$('.btnGroup--btn-flex').append("<span>(page will refresh after add item)</span>");
	});







	//Things in here is to make the selection of rubric items can be both be clicked/by keyboard
// Select the node that will be observed for mutations
const targetNode = document.getElementsByClassName('rubricItem--key');
console.log(targetNode);

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };


const callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('A child node has been added or removed.');
        }
        else if (mutation.type === 'attributes') {
			var classList = mutation.target.className;
			if(classList.indexOf("rubricItem--key-applied")>0){
					rubric_item=$(".rubricItem--key-applied").html()
			
					$('.pageViewerControls.u-pointerEventsNone').append($(
						"<div id='suggestion_container_pdf_" + rubric_item + "' class= 'suggestion_container_pdf'>" +
						"<div id='mydivheader'>DRAG PDF TO ME</div>"+
						"<div id='suggestion_box_pdf_" + rubric_item + "' class='rubric-comments suggestion_box_pdf' style='overflow-y:scroll'>" + 
							'<div class="suggestion_header">"Suggestions:"</div>' +
								  "<table class='comments_good comments_table'></table>" +
						"</div>" + 
					"</div>"
					));
					//$("<div class='temp' style='border-style: dashed; border: 1px solid red;'>NAIVEEEEEE</div>").insertAfter('.taBox--textarea');
					storeAndPrintComments(rubric_item,full_sorted_comments[rubric_item-1], rubric_item-1, rubric_item-1, false,true);
					
				if(!always_show){
				var id=$('.rubricItem--key-applied').html();
				console.log("IIID is: "+id);
				if (!$('suggestion_container_'+id).is(":visible")) {
					toggleSuggestionBox(id);
				}
			}
			}else{
				$('.suggestion_container_pdf').remove();
				var id=$(mutation.target).html();
				console.log("IIID  dis appear is: "+id);
				if (!$('suggestion_container_'+id).is(":visible")) {
					toggleSuggestionBox(id);
				}
			}

        }
    }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// // Start observing the target node for configured mutations
for(var i=0;i<targetNode.length;i++){
observer.observe(targetNode[i], config);
}


$(document).ready(function(){
	if($("rubric-Item--key-applied").length>0){
		rubric_item=$(".rubricItem--key-applied").html()
			
		$('.pageViewerControls.u-pointerEventsNone').append($(
			"<div id='suggestion_container_pdf_" + rubric_item + "' class= 'suggestion_container_pdf'>" +
			"<div id='mydivheader'>DRAG PDF TO ME</div>"+
			"<div id='suggestion_box_pdf_" + rubric_item + "' class='rubric-comments suggestion_box_pdf' style='overflow-y:scroll'>" + 
				'<div class="suggestion_header">"Suggestions:"</div>' +
					  "<table class='comments_good comments_table'></table>" +
			"</div>" + 
		"</div>"
		));
		//$("<div class='temp' style='border-style: dashed; border: 1px solid red;'>NAIVEEEEEE</div>").insertAfter('.taBox--textarea');
		storeAndPrintComments(rubric_item,full_sorted_comments[rubric_item-1], rubric_item-1, rubric_item-1, false,true);
	}
});


	// $(".comment_view_text").keydown(function() { 
	// 	console.log("this id "+this.id);
	// 	updateCommentBox(this.id); });
	$(".form--textArea").focus(function() { 
		//console.log(this);

		//I assume that rubric_item variable is the score like -0.5
		//var rubric_item = $(this).parents("li").find(".rubricItem--pointsAndDescription").find(".rubricField-points").html();
		//first step to make the ONLY comment box available
		var rubric_item=$(".rubricItem--key-applied").html();
		rubric_item_applied=rubric_item;
		// tell chrome to log the event that we just clicked the comment box
		chrome.runtime.sendMessage({action: "logFocus",
									rubric_question: rubric_name,
									rubric_item: rubric_item,
									submission_num:sub_number
			}, function(response) {
				console.log("logging focus: " + response);
				//console.log("RRRRRRRRR "+rubric_item);
		});
	});

	$("taBox--textarea").focus(function(){
		var rubric_item=$(".rubricItem--key-applied").html();

		chrome.runtime.sendMessage({action:"logPDFFocus",
		rubric_question: rubric_name,
		rubric_item: rubric_item,																	
		submission_num: sub_number															
	},function(response){
		console.log("logging pdf event: "+response);
	});
	});
	// see/hide button functionality
	$(".see_suggestions").click(function() {
		var selected_id_num = this.id.split("see_suggestions_")[1];
		var action = $("#see_suggestions_" + selected_id_num + " .toggle_word").html();
		toggleSuggestionBox(selected_id_num);

		//var rubric_item = $(this).parents("li").find(".rubricItem--pointsAndDescription").find(".rubricField-points").html();
		var rubric_item=$(".rubricItem--key-applied").html();
		// tell chrome to log the event that we just clicked see/hide
		chrome.runtime.sendMessage({action: "logSuggestion" + action,
									rubric_question: rubric_name,
									rubric_item: rubric_item,
									submission_num: sub_number
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


$(document).change(function(){
	if($('.taBox-is-editing')){
		var rubric_item=$(".rubricItem--key-applied").html();

		chrome.runtime.sendMessage({action:"logPDFFocus",
		rubric_question: rubric_name,
		rubric_item: rubric_item,																	
		submission_num:sub_number																
	},function(response){
		console.log("logging pdf event: "+response);
	});	

	}
});



$(function() {

	rubric_name = $(".submissionGraderSidebar--title > span > span").html();
	//console.log("RRRRRDD "+rubric_item);
	//TODO: get student id
	student_id = "temp";
	rubric_number = rubric_name.split(":")[0];
	//console.log("rubric number: " + rubric_number);
	var rubric_name_lower = rubric_name.toLowerCase();


	//Add a new rubric item, then it should refresh on thei
	$(document).on('DOMNodeInserted', function(e) {
		//console.log("should REFRESH!");
		//console.log(e.target);
		if ( $(e.target).hasClass('rubricEntryDragContainer') ) {
		   //element with rubricItem was inserted, refresh the page
		   //alert("Sorry dude, the page needs to be reloaded to update rubric items, click 'OK' to continue");
		   window.location.reload();
		}
	});

	$(document).ready(function(){
		$("rubricItem--key").click(function(){
			$(".suggestion_container").css('display','block');
		});
		
	});
	// change true so that it only works on grading pages
	if (window.location.pathname.indexOf('grade')>=0 && window.location.pathname.indexOf('assignments')==-1) {

		// tell chrome we are on a grading page
		chrome.runtime.sendMessage({action: "onGradingPage"});

		button_url = chrome.extension.getURL("button.png");
		rubric_item_applied=$('.rubricItem--key-applied').html();
		// get text currently in comment box
		//original_text = $(".form--textArea").val();
		console.log("original text:");
		console.log(original_text);

		// event listener for whenever comment box updates, to update all the comment views too
		 $(".form--textArea").keydown(function() {
			setTimeout(function(){ 
				
				// save current text, so that the thing will be stored, and this works
				comment_text = $('.form--textArea').val();
				if (original_text != "") {
					var split = comment_text.split(original_text);
					console.log("comment split AAA: "+split);
					if (split.length == 2) {
						comment_text = split[1];
					} else {
						comment_text = split[0];
					}
				}
				console.log("got updated comments: ")
				console.log(comment_text);
		
				chrome.storage.local.set({comment_text: comment_text, comments_inserted: comments_inserted, 
					comments_rubric_number: rubric_number, saved: false,rubric_item:rubric_item_applied});
			}, 100);

		 });

		$(".form--textArea").focus(function() { 
			// tell chrome to log the event that we just clicked the comment box
			chrome.runtime.sendMessage({action: "logGradescopeFocus",
										rubric_question: rubric_name,
										submission_num:sub_number
				}, function(response) {
					console.log("logging gradescope focus: " + response);
			});
		});

		// wait to receive the comments from spreadsheet
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			console.log("got comments message");
			if (request.comments) {
				console.log("storing and printing comments");
				//TODO: made the comments customized for each question(rubric_number)
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
			chrome.storage.local.get(function(result){console.log(result)})


		});

		// get user id and settings
		chrome.storage.local.get(null, function(items) {
			if (!items.user_id) {
				user_id = grader_name
				// Math.random().toString(36) + new Date().getTime();
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
	$(window).on('beforeunload', function(){
		console.log("LEAVING");
		if($('input[name="category"]:checked').length==0){
			var checked="";
		}
		else{
			temp=[]
			for(var i=0;i<$('input[name="category"]:checked').length;i++){
			var name=$('input[name="category"]:checked')[i].value
			temp.push(name)
		}
		checked=temp.join();
	}
		chrome.runtime.sendMessage({action: "onLeaving",
	tbox_num:$('.taBox--textarea').length,
	rubric_question:rubric_name,
	rubric_item:$(".rubricItem--key-applied").html(),
	comment: $('.form--textArea').val(),
	submission_num:sub_number,
	assignment_name: ass_name,
	grader_name:grader_name,
	check_box_status:checked
	});
		console.log("SEND PDF COMMENTS");
	
//console.log($('.taBox--textarea')[0].innerHTML);
		var i=0;
		if($('.taBox--textarea').length>0){
		var pdf_text_list=[]
		while(i<$('.taBox--textarea').length){
			pdf_text_list.push($('.taBox--textarea')[i].innerHTML)
			i++;
		}
		
		console.log(pdf_text_list)
		chrome.runtime.sendMessage({action:"sendPDFbox",
		pdf_list: pdf_text_list,
		rubric_question:rubric_number,
		rubric_item:$(".rubricItem--key-applied").html(),
		submission_num:sub_number,
		assignment_name: ass_number,
		grader_name:grader_name

	},function(response) {
		console.log("logging focus: " + response);
		//console.log("RRRRRRRRR "+rubric_item);
});
	
}
  });
	// else {
	// 	// tell chrome we are NOT on a grading page
	// 	chrome.runtime.sendMessage({action: "onOtherPage"});
	// }
});



