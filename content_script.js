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


var being_clicked_in_pdf=new Set()
var already_on_pdf= new Set()
var Zdisabled=false
var window_url=window.location.href

//console.log($('.taBox--textarea'));


// if(window.location.pathname.indexOf('assignments')>=0){
// 	console.log("in batch page");
// 	url_set= new Set();
// 	var i=0;
// 	let list= $("a[class='link-noUnderline']");
// 	while(i<list.length){
// 		url_set.add(list[i].href);
// 		i++;
// 	}
// 	var url_list=Array.from(url_set);
// 	console.log(url_list);
// 	chrome.storage.local.set({url_list:url_list});
// }



//follow the demo, the key is the question itself and the value is the num of rubric items,
//total 7 questions, each with 10 rubric items
var num_rubric_items = {1.1:10,1.2:10,1.3:10,1.4: 10,1.5: 10, 2.1:10,2.2:10, 2.3: 10, 3.1:10, 3.2:10, 3.3:10, 3.4:10, 3.5:10, 4.1:10,
    4.2: 10, 4.3:10, 4.4:10, 4.5:10, 5.1:10, 5.2:10,5.3:10, 5.4:10, 5.5:10,6.1:10,6.2:10,6.3:10,6.4: 10,6.5: 10,
    7.1:10,7.2:10,7.3:10,7.4: 10,7.5: 10, 2.4:10,2.5:10,
	 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10,8:10,9:10,10:10,1.6:10,1.7:10,1.8:10,2.6:10,2.7:10,2.8:10,
	 3.6:10,3.7:10,3.8:10,4.6:10,4.7:10,4.8:10,5.6:10,5.7:10,5.8:10,6.6:10,6.7:10,6.8:10,
	 7.6:10,7.7:10,7.8:10};

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
	var i=0;
	if($('.taBox--textarea').length>0){
	while(i<$('.taBox--textarea').length){
		var text=$('.taBox--textarea')[i].innerHTML
		already_on_pdf.add(text)
		
		i++;
	}
}
});

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




	//sort the comments by the first word(move them together)
	// comments= comments.sort(function(info1,info2){
	// 	var nameA= (info1[5].split(' '))[0].toLowerCase();
	// 	var nameB = (info2[5].split(' '))[0].toLowerCase();
	// 	if(nameA === nameB) return 0; 
    // 	return nameA > nameB ? 1 : -1;

	// });

	// // sort comments ascending by length
    // comments = comments.sort(function(info1, info2) {
    //   var length1 = parseInt(info1[6]);
    //   var length2 = parseInt(info2[6]);
    //   if (length1 < length2) {
    //     return -1;
    //   } else if (length1 == length2) {
    //     return 0;
    //   } else {
    //     return 1;
    //   }
    // });


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
	//PUT ONLY TOP 20 COMMENTS inside the box


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

	  //NOTE: Upon Mia's request, the shade is no longer implemented here because sorting is already
	  //done, but always feel free to add shade back
	  //just change the rgb value from 0 to shade
	  if(!PDF){
      var string = "<tr"  + 
	  " class='comment' style='color: rgb(" + 0 + ", " + 0 + ", " + 0 + ")'>" + 
			"<td class='tdd_"+i+"'><img class='btn " + i + "' src='" + button_url + "' height=20 width=20 /></td>" +
        	 "<td class='comment_" + i + "' datablanks='" + blank_values + "'>" + comment + "</td>" + 
        "</tr>";
	  }else{
		var string = "<tr"  + 
		" class='comment' style='color: rgb(" + 0 + ", " + 0 + ", " + 0 + ")'>" + 
		"<td class='tdd_"+i+"'><input  type= 'button' class='btn_pdf "+ i + "' src='" + button_url + "' height=20 width=20 /></td>" +
        	"<td class='comment_" + i + "' datablanks='" + blank_values + "'>" + comment + "</td>" + 
        "</tr>";
	  }
      if (category == "1") {
		$(selector_addition + " .comments_good").append(string);
		// var tdd="."+"tdd_"+i
		
		// if($(tdd).children().length==1 && !PDF){
		
		// var resultLink=makeTdWithLink(comment,blank_values,i)
		// console.log(resultLink)
		// $(tdd).parents('tr').append(resultLink)
		// }
	  }else {
        $(selector_addition + " .comments_should").append("error with comment category");
      }

      // now make the "blank" placeholders show 
      if (comments[i][10] != undefined) {

	    $(selector_addition).find(".comment_" + i).each(function() {

	    	var blanks = $(this).attr("datablanks").split(",");

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
	$('.btn_pdf').on('click',function(){
		
		var btn_id_num = $(this).attr("class").split(" ")[1];
		var this_index = $(this).parents("div").attr('id').slice(-1)-1;
		Zdisabled=false
		$(".actionBar--action-next").attr('disabled',false);
		//var comment= $(this).parents("tr").find(".comment_"+btn_id_num).text();
		var comment = full_sorted_comments[this_index][btn_id_num][5];
		var $temp = $("<input>");
		$("body").append($temp);
		$temp.val($(this).parents("tr").find(".comment_"+btn_id_num).text()).select();
		document.execCommand("copy");
		$temp.remove();	
		console.log("inserting comment: " + comment);
		console.log(full_sorted_comments[this_index]);
		console.log(full_sorted_comments[this_index][btn_id_num]);
		var comment_id = full_sorted_comments[this_index][btn_id_num][0];
		insertComment_pdf(comment,comment_id);
		being_clicked_in_pdf.add(comment);
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
	  Zdisabled=false
	  $(".actionBar--action-next").attr('disabled',false);
	  var rubric_item=$(".rubricItem--key-applied").html();
	  rubric_item_applied=rubric_item;
	  console.log("inserting comment: " + comment);
      console.log(full_sorted_comments[this_index]);
      console.log(full_sorted_comments[this_index][btn_id_num]);
	  var comment_id = full_sorted_comments[this_index][btn_id_num][0];
	  
	  //var comment = $(this).parents("tr").find(".comment_" + btn_id_num).html();
	  var comment = full_sorted_comments[this_index][btn_id_num][5];
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

$(".rubricItem--key").change(function(){
	
	var rubric_item_score=$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html();
	try{
	var arr=$(".submissionGraderPoints").html().split(" ")
	}
	catch(error){
		return
	}
	arr.pop()
	var total_score=arr.pop()
	var res_total="+"+total_score
	if(rubric_item_score==undefined && $(".taBox--displayText").length==0 && $(".form--textArea").val()=="" ){
		Zdisabled=true
		$(".actionBar--action-next").attr('disabled',true);
		return
	}
	if(rubric_item_score !=="-0.0"){
		if(rubric_item_score.substring(0,1)!="-"){
			if(rubric_item_score==res_total){
				Zdisabled=false
				$(".actionBar--action-next").attr('disabled',false);
				return
			}
			if($('.tabox--textarea').length>0){
				Zdisabled=false
				$(".actionBar--action-next").attr('disabled',false);
				return
			}
			Zdisabled=true
			$(".actionBar--action-next").attr('disabled',true);
		}
	}else{
		Zdisabled=false
		$(".actionBar--action-next").attr('disabled',false);
		return
	}
	})



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
		if(comment_text!==""){
			Zdisabled=false
			$(".actionBar--action-next").attr('disabled',false)
		}else if(comment_text=="" && $('.taBox--textarea').length==0){
			Zdisabled=true
			$(".actionBar--action-next").attr('disabled',true)

		}else{
			Zdisabled=false
			$(".actionBar--action-next").attr('disabled',false)
		}

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


function insertComment_pdf(comment,comment_id){
	comment = comment.replace(/\\"/g, '"').replace(/\\'/g, "'");
	comments_inserted[comment_id] = comment;
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
"<div class=pdf_comments_display>"+
"<p style='font-family:verdana; color:blue'>Comments you put directly on the PDF:</p>"+
"</div>"

).insertAfter(".form--textArea")

$(document).ready(function(){
		b=Array.from(already_on_pdf)
		console.log(b.length)
		for(var i=0;i<b.length;i++){
			$('.pdf_comments_display').append("<span class='anchor_on_right'>"+b[i]+"</span>"+"<br/>")
		}
});





	$(
		"<div class='category_selection'>"+
		"<span  id ='ins_check' style='color:red'>Your feedback should be specific, actionable, and justified. Check the boxes below if your comments meet the criteria. You can press 'z' for the next question as long as you write a comment if the student did not receive full credit.</span>"+
		"<br/>"+
		"<input type='checkbox' class='catCheck--spec' name='category' value='is_specific' style='height:10px; width:10px;'>Is specific"+
		"<input type='checkbox' class='catCheck--act' name='category' value='is_actionable' style='height:10px; width:10px;'>Is actionable"+
		"<input type='checkbox' class='catCheck--just' name='category' value='is_justified' style='height:10px; width:10px;'>Is justified"+
		"</div>"
	).insertAfter(".pdf_comments_display");





	// //disable the nextQuestion button until all checkbox clicked
	// $(document).ready(function(){

	// 	let cur_url= window.location.href
	// 	chrome.storage.local.get(null, function(items){
	// 	url_list= items.url_list;
	// 	console.log(url_list.length);
	// 	url_list.forEach(function(element){
	// 		if(cur_url.indexOf(element)>-1){
	// 			url_list=url_list.filter(function(a){return a!==element;});
	// 		}
	// 	});
	// 	console.log(url_list.length);
	// 	chrome.storage.local.set({url_list:url_list});
	// 		if((url_list).length>0){
	// 			console.log($(".actionBar--action-next")[0].href);
	// 			$(".actionBar--action-next")[0].href=url_list[Math.floor(Math.random() * url_list.length)];
	// 			console.log($(".actionBar--action-next")[0].href);
	// 		}
	// 	})
	// });


	//trigger word function(bonus point): some words can trigger checkboxes to be cliked
	$('.form--textArea').change(function(){
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
					$('#ins_check').text('Please add a justification for your comment');
				}
			}else if($('input[class="catCheck--just"]').is(':checked')){
				$('#ins_check').css('color','red');
				$('#ins_check').text('Please add a concrete suggestion to your comment to make it actionable');
			}else{
				$('#ins_check').css('color','red');
				$('#ins_check').text('Please add a concrete suggestion to your comment to make it actionable');
			}
		}else if($('input[class="catCheck--act"]').is(':checked')){
			if($('input[class="catCheck--just"]').is(':checked')){
				$('#ins_check').css('color','red');
				$('#ins_check').text('Please add a concrete suggestion to your comment to make it actionable');
			}else{
				$('#ins_check').css('color','red');
				$('#ins_check').text('Please add a concrete suggestion to your comment to make it actionable');
			}
		}else if($('input[class="catCheck--just"]').is(':checked')){
			$('#ins_check').css('color','red');
			$('#ins_check').text('Please add a concrete suggestion to your comment to make it actionable');
		}else{
			$('#ins_check').css('color','red');
			$('#ins_check').text('If you believe your comment meets the criteria listed below, check them.');
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





$(document).ready(function(){
	if(rubric_item_score==undefined && $(".form--textArea").val()=="" && $('.taBox--displayText').length==0){
		Zdisabled=true
		$(".actionBar--action-next").attr('disabled',true);
		return
	}
var rubric_item_score=$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html();
try{
	var arr=$(".submissionGraderPoints").html().split(" ")
	}
	catch(error){
		return
	}
//var arr=$(".submissionGraderPoints").html().split(" ")
arr.pop()
var total_score=arr.pop()
var res_total="+"+total_score
console.log(rubric_item_score)
console.log(total_score)
console.log(res_total)
if(rubric_item_score !=="-0.0"){
	try{
	if(rubric_item_score.substring(0,1)!="-"){
		if(rubric_item_score==res_total){
			Zdisabled=false
			$(".actionBar--action-next").attr('disabled',false);
			return
		}
	}
}
catch(error){
	return
}
	var text=$('.form--textArea').val()
	console.log(text)
	if(text=="" ||$('.taBox--textarea').length==0){
		console.log("START TRUE")
		Zdisabled=true

	}else{
		Zdisabled=false
	}
}
if(Zdisabled){
	$(".actionBar--action-next").attr('disabled',true);
	}else{
		$(".actionBar--action-next").attr('disabled',false);
	}

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
			console.log(classList)
			console.log(mutation.target)
			if(classList.indexOf("rubricItem--key-applied")>=0){
					// let len_rb=$(".rubricItem--key-applied").length-1
					// let item_rb=$(".rubricItem--key-applied")[len_rb]
					// console.log(item_rb)
					rubric_item=mutation.target.innerHTML
					console.log(rubric_item)
					$('.pageViewerControls.u-pointerEventsNone').append($(
						"<div id='suggestion_container_pdf_" + rubric_item + "' class= 'suggestion_container_pdf'>" +
						"<div id='mydivheader'>PDF SUGGESTION BOX:DRAG PDF TO ME!</div>"+
						"<div id='suggestion_box_pdf_" + rubric_item + "' class='rubric-comments suggestion_box_pdf' style='overflow-y:scroll'>" + 
							'<div class="suggestion_header">"Suggestions: Clicking the button by the suggested comment will copy it. Simply paste it in your comment box after"</div>' +
								  "<table class='comments_good comments_table'></table>" +
						"</div>" + 
					"</div>"
					));
					
					var rubric_item_score=$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html();
					var arr=$(".submissionGraderPoints").html().split(" ")
					arr.pop()
					var total_score=arr.pop()
					var res_total="+"+total_score
					if(rubric_item_score !=="-0.0"){
						
						if($('.form--textArea').val()!=="" || $(".taBox--displayText").length>0){
							
							Zdisabled=false
							$(".actionBar--action-next").attr('disabled',false);
						}
						else if(rubric_item_score.substring(0,1)!="-"){
							if(rubric_item_score==res_total){
								Zdisabled=false
								$(".actionBar--action-next").attr('disabled',false);
								
							}
						}else{
						
						Zdisabled=true
						$(".actionBar--action-next").attr('disabled',true);
						}
					}else{
						Zdisabled=false
						$(".actionBar--action-next").attr('disabled',false);
						
					}
					if(rubric_item_score==undefined){
						if($(".form--textArea").val()!==""|| $(".taBox--textarea").length>0){
						Zdisabled=false
						$(".actionBar--action-next").attr('disabled',false);
						}
					}

					//$("<div class='temp' style='border-style: dashed; border: 1px solid red;'>NAIVEEEEEE</div>").insertAfter('.taBox--textarea');
					try{
					storeAndPrintComments(rubric_item,full_sorted_comments[rubric_item-1], rubric_item-1, rubric_item-1, false,true);
					}
					catch(error){
						console.log(error)
					}
					
				if(!always_show){
				var id=mutation.target.innerHTML;
				console.log("IIID is: "+id);
				if (!$('suggestion_container_'+id).is(":visible")) {
					toggleSuggestionBox(id);
				}
			}
			}else{
				$('.suggestion_container_pdf').remove();
				if($(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html()==undefined){
				Zdisabled=true
				$(".actionBar--action-next").attr('disabled',true);
				}
				var id=$(mutation.target).html();
				console.log("IIID  dis appear is: "+id);
				if (!$('suggestion_container_'+id).is(":visible") && !always_show) {
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





	// $(".comment_view_text").keydown(function() { 
	// 	console.log("this id "+this.id);
	// 	updateCommentBox(this.id); });
	// $(".form--textArea").focus(function() { 
	// 	//console.log(this);

	// 	//I assume that rubric_item variable is the score like -0.5
	// 	//var rubric_item = $(this).parents("li").find(".rubricItem--pointsAndDescription").find(".rubricField-points").html();
	// 	//first step to make the ONLY comment box available
	// 	var rubric_item=$(".rubricItem--key-applied").html();
	// 	rubric_item_applied=rubric_item;
	// 	// tell chrome to log the event that we just clicked the comment box
	// 	chrome.runtime.sendMessage({action: "logFocus",
	// 								rubric_question: rubric_name,
	// 								rubric_item: rubric_item,
	// 								submission_num:sub_number
	// 		}, function(response) {
	// 			console.log("logging focus: " + response);
	// 			//console.log("RRRRRRRRR "+rubric_item);
	// 	});
	// });

	// $("taBox--textarea").focus(function(){
	// 	//var rubric_item=$(".rubricItem--key-applied").html();
		

	// // 	chrome.runtime.sendMessage({action:"logPDFFocus",
	// // 	rubric_question: rubric_name,
	// // 	rubric_item: rubric_item,																	
	// // 	submission_num: sub_number															
	// // },function(response){
	// // 	console.log("logging pdf event: "+response);
	// // });
	// });
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


// $(document).change(function(){
// 	if($('.taBox-is-editing')){
// 		var rubric_item=$(".rubricItem--key-applied").html();

// 		chrome.runtime.sendMessage({action:"logPDFFocus",
// 		rubric_question: rubric_name,
// 		rubric_item: rubric_item,																	
// 		submission_num:sub_number																
// 	},function(response){
// 		console.log("logging pdf event: "+response);
// 	});	

// 	}
// });



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
				if(comment_text!==""){
					Zdisabled=false
					$(".actionBar--action-next").attr('disabled',false)
				}else if(comment_text=="" && $('.taBox--textarea').length==0){
					Zdisabled=true
					$(".actionBar--action-next").attr('disabled',true)

				}else{
					Zdisabled=false
					$(".actionBar--action-next").attr('disabled',false)
				}
		
				chrome.storage.local.set({comment_text: comment_text, comments_inserted: comments_inserted, 
					comments_rubric_number: rubric_number, saved: false,rubric_item:rubric_item_applied});
			}, 100);

		 });

		// $(".form--textArea").focus(function() { 
		// 	// tell chrome to log the event that we just clicked the comment box
		// 	chrome.runtime.sendMessage({action: "logGradescopeFocus",
		// 								rubric_question: rubric_name,
		// 								submission_num:sub_number
		// 		}, function(response) {
		// 			console.log("logging gradescope focus: " + response);
		// 	});
		// });

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
	

	$('.actionBar--action-next').click(everyUnloading);

// 	$(window).on('beforeunload', everyUnloading
		
// 	// 	console.log("LEAVING");
// 	// 	console.log("SEND PDF COMMENTS");
	
// 	// 	//console.log($('.taBox--textarea')[0].innerHTML);
// 	// 			var i=0;
// 	// 			if($('.taBox--textarea').length>0){
// 	// 			var pdf_text_list=[]
// 	// 			while(i<$('.taBox--textarea').length){
// 	// 				var text=$('.taBox--textarea')[i].innerHTML
// 	// 				if(!being_clicked_in_pdf.has(text) && !already_on_pdf.has(text)){
// 	// 				text=checkEqualTextPDF(text,full_sorted_comments)
// 	// 				if(text!==undefined){
// 	// 				pdf_text_list.push(text)
// 	// 				}
// 	// 				}
// 	// 				i++;
// 	// 			}
				
// 	// 			being_clicked_in_pdf.clear();
// 	// 			console.log(pdf_text_list)
// 	// 			if(pdf_text_list.length>0){
// 	// 			chrome.runtime.sendMessage({action:"sendPDFbox",
// 	// 			pdf_list: pdf_text_list,
// 	// 			rubric_question:rubric_number,
// 	// 			rubric_item:$(".rubricItem--key-applied").html(),
// 	// 			submission_num:sub_number,
// 	// 			assignment_name: ass_number,
// 	// 			grader_name:user_id
		
// 	// 		},function(response) {
// 	// 			console.log("logging focus: " + response);
// 	// 			//console.log("RRRRRRRRR "+rubric_item);
// 	// 	});
// 	// 			}
			
// 	// 	}
// 	// 	console.log(":LOAD EVERYTHING")
// 	// 	if($('input[name="category"]:checked').length==0){
// 	// 		var checked="";
// 	// 	}
// 	// 	else{
// 	// 		temp=[]
// 	// 		for(var i=0;i<$('input[name="category"]:checked').length;i++){
// 	// 		var name=$('input[name="category"]:checked')[i].value
// 	// 		temp.push(name)
// 	// 	}
// 	// 	checked=temp.join();
// 	// }
// 	// 	chrome.runtime.sendMessage({action: "onLeaving",
// 	// tbox_num:$('.taBox--textarea').length,
// 	// rubric_question:rubric_name,
// 	// rubric_item: $(".rubricItem--key-applied").html(),
// 	// rubric_point:$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html(),
// 	// rubric_text: $(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children(".rubricField-description").html(),
// 	// comment: $('.form--textArea').val(),
// 	// submission_num:sub_number,
// 	// assignment_name: ass_name,
// 	// grader_name:grader_name,
// 	// check_box_status:checked
// 	// });
//   );
	// else {
	// 	// tell chrome we are NOT on a grading page
	// 	chrome.runtime.sendMessage({action: "onOtherPage"});
	// }
});



function everyUnloading(){
		
	console.log("LEAVING");
	console.log("SEND PDF COMMENTS");

	//console.log($('.taBox--textarea')[0].innerHTML);
			var i=0;
			if($('.taBox--textarea').length>0){
			var pdf_text_list=[]
			while(i<$('.taBox--textarea').length){
				var text=$('.taBox--textarea')[i].innerHTML
				if(!being_clicked_in_pdf.has(text) && !already_on_pdf.has(text)){
				text=checkEqualTextPDF(text,full_sorted_comments)
				if(text!==undefined){
				pdf_text_list.push(text)
				}
				}
				i++;
			}
			
			being_clicked_in_pdf.clear();
			already_on_pdf.clear();
			console.log(pdf_text_list)
			if(pdf_text_list.length>0){
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
		
	}
	console.log(":LOAD EVERYTHING")
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
rubric_item: $(".rubricItem--key-applied").html(),
rubric_point:$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html(),
rubric_text: $(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children(".rubricField-description").html(),
comment: $('.form--textArea').val(),
submission_num:sub_number,
assignment_name: ass_name,
grader_name:grader_name,
check_box_status:checked
});
}




function shortenComment(comment){
	//Find the string length
	if(comment.length>=100){
		return comment.substring(0,100);
		}
	return comment;
	}


function makeTdWithLink(comment,blank_values,i){
	var len=100
	var row=document.createElement("td")
	row.class="comment_"+i;
	row.datablanks=blank_values
	var link=document.createElement("a")
	row.innerHTML = comment.substring(0,len);  
	link.innerHTML=comment.length>len?".....":""
	link.href="javascript:void(0)";
	link.onclick=function(){
		if(link.innerHTML.indexOf("...")>0){
		}else{
			link.innerHTML="HIDE"
			row.innerHTML=comment
		}
	}
	row.appendChild(link)
	return row
}



function makeCommentLink(comment){
	var len=100;
	var row=document.createElement("span")
	var link=document.createElement("a")
	link.innerHTML=comment.length>len?".....":"";
	link.href="javascript:void(0)";
	link.onclick=function(){
		if(link.innerHTML.indexOf("...")>=0){
			row.innerHTML=comment(len,comment.length)
		}else{
			link.innerHTML="HIDE"
		}
	}
	row.appendChild(link)
	return row
}



$('.form--textArea').change(function(){
	var rubric_item_score=$(".rubricItem--key-applied").siblings(".rubricItem--pointsAndDescription").children("button").html();

if(rubric_item_score==undefined){
		
		let text1=$('.form--textArea').val()
		if(text1!==""){
			Zdisabled=false
			$(".actionBar--action-next").attr('disabled',false);
			return
		}
	}

try{
var arr=$(".submissionGraderPoints").html().split(" ")
}
catch(error){
	return
}
arr.pop()
var total_score=arr.pop()
var res_total="+"+total_score

if(rubric_item_score !=="-0.0"){
	if(rubric_item_score.substring(0,1)!="-"){
		if(rubric_item_score==res_total){
			Zdisabled=false
			$(".actionBar--action-next").attr('disabled',false);
			return
		}
	}
	var text=$('.form--textArea').val()
	console.log(text)
	if(text=="" && $('.taBox--textarea').length==0){
		Zdisabled=true
	}else{
		Zdisabled=false
	}
}else{
	Zdisabled=false
}
if(Zdisabled){
	$(".actionBar--action-next").attr('disabled',true);
	}else{
		$(".actionBar--action-next").attr('disabled',false);
	}

});


// check if the current comments is 
function checkEqualTextPDF(comment,full_comments){
	for(let i=0;i<full_comments[full_comments.length-1].length;i++){
		if (full_comments[full_comments.length-1][i][5]==comment){
			return undefined
		}else if(comment.indexOf(full_comments[full_comments.length-1][i][5])>=0){
			//only accept addendum to original comments
			if(comment.indexOf(full_comments[full_comments.length-1][i][5])==0){
				return comment.substring(comment.indexOf(full_comments[full_comments.length-1][i][5])+full_comments[full_comments.length-1][i][5].length);
			}
		}else{
			continue
		}
	}
	return comment
}



document.addEventListener('keydown',switchZ,true);
function switchZ(event){
	var keycode=event.key;
	if(keycode=='z' &&Zdisabled){
		
		event.stopImmediatePropagation();
}else if(keycode=='z' &&!Zdisabled){
	if(!$('.form--textArea').is(':focus')  && !$('taBox--textarea').is(':focus')){
		var text=$('.form--textArea').val()
		everyUnloading()
		
	}
	// $(document).unbind();
	// $(document).bind()
	//document.removeEventListener('keydown',switchZ,true);
	//alert("FUCK")
	//everyUnloading()

// }
}
}




$(document).change(function(){
	
	var everything_on_pdf=new Set()
	console.log(Array.from(everything_on_pdf).length)

	for(var i=0;i<$('.taBox--textarea').length;i++){
		var text=$('.taBox--textarea')[i].innerHTML
		if(text!==""){
			everything_on_pdf.add(text)
		}
	}
	console.log(Array.from(everything_on_pdf).length)
	if(Array.from(everything_on_pdf).length==0 && $(".form--textArea").val().length==0){
		Zdisabled=true
		$(".actionBar--action-next").attr('disabled',true)
	}else{
		Zdisabled=false
		$(".actionBar--action-next").attr('disabled',false)
	}
	//more comments on the pdf not on the right
	if($('.anchor_on_right').length<$('.taBox--textarea').length){
		console.log($('.anchor_on_right').length)
		var set_on_right=new Set()
		for(var j=0;j<$('.anchor_on_right').length;j++){
			var right_text=$('.anchor_on_right')[j].innerHTML
			set_on_right.add(right_text)
		}
		let diff=new Set([...everything_on_pdf].filter(x => !set_on_right.has(x)));
		var text=Array.from(diff)[0]
		console.log(text)
		$('.pdf_comments_display').append("<span class='anchor_on_right'>"+text+"</span>"+"<br/>")

			// var text=$('.anchor_on_right')[j].innnerHTML;
			// if(!everything_on_pdf.has(text)){
			// 	$('.pdf_comments_display').append("<span class='anchor_on_right'>"+text+"</span>"+"<br/>")
			// }
		
	}else if($('.anchor_on_right').length>Array.from(everything_on_pdf).length){
		for(var k=0;k<$('.anchor_on_right').length;k++){
			var new_right_text=$('.anchor_on_right')[k].innerHTML
			if(!everything_on_pdf.has(new_right_text)){
				$('.anchor_on_right')[k].innerHTML="";
				 $('.anchor_on_right')[k].remove()
			}
		}
		}else if($('.anchor_on_right').length==Array.from(everything_on_pdf).length){
			var set_on_right=new Set()
		for(var j=0;j<$('.anchor_on_right').length;j++){
			var right_text=$('.anchor_on_right')[j].innerHTML
			set_on_right.add(right_text)
		}
		let diff_e_to_r=new Set([...everything_on_pdf].filter(x => !set_on_right.has(x)));
		
		if(diff_e_to_r.size!=0){
			let diff_r_to_e=new Set([...set_on_right].filter(x => !everything_on_pdf.has(x)));
			
			let text_to_update=Array.from(diff_r_to_e)[0]
			let text_from_pdf=Array.from(diff_e_to_r)[0]
			console.log(text_from_pdf)
			for(var k=0;k<$('.anchor_on_right').length;k++){
				var text=$('.anchor_on_right')[k].innerHTML
				if(text==text_to_update){
				$('.anchor_on_right')[k].innerHTML=text_from_pdf
				}
			}
			
		}

		}
})


// $(document).change(function(){
	
// 	if($('.taBox--displayText').length>0 ||$(".form--textArea").val()!==""){
// 		alert("FUCK")
// 		Zdisabled=false
// 		$(".actionBar--action-next").attr('disabled',false)
// 	}

// });


$(document).ready(function(){
	if($('.taBox--displayText').length>0){
		
		Zdisabled=false
		$(".actionBar--action-next").attr('disabled',false)
	}
});



