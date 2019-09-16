//W16-A10 is the comment sheet name used
//A10 is the event sheet name used
//NOTICE: make headings first for the table(A1:L1 for comment sheet) then do the insertions!!
//otherwise, table range will be a mess
var comment_sheet_id = "1HdcveHzPgCNc1lCp_Lfb7MX3O51p3u5jKrnxOw-66bQ";
var event_sheet_id = "11mbvJusJtSQ4IjWPSwROlZdygijXDv0YWeI3LREfdbw";
var user_id;
var always_show;
var on_grading_page;
var store_rubric_item;
var last_row=1;//fetch the last row in the spreadsheets, used for the id field

function loadSpreadsheet() {
  console.log("loadding spreadsheet now.....")
  if (chrome.identity === undefined) {
    console.log("Please sign-in to Chrome from its top-right menu.");
    return;
  }
  console.log("getting token");
  console.log(chrome.identity);

  chrome.identity.getAuthToken({interactive: true}, function(token) {
    console.log("token request done");
    if (token) {
      console.log("got the token");
      // use that access token to set an http header when calling the Drive API.
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
            // request done, we got the data 
            console.log("got the data");
            console.log({comments: xhr.response.values});
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {comments: xhr.response.values}, function(response) {
                console.log("sent comments: " + response);
              });
            });
        }
      };

      xhr.open("GET", 
        "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + "/values/F19!A2:K10000",
        true);

      xhr.setRequestHeader('Authorization','Bearer ' + token);
      xhr.responseType = "json";

      xhr.send();

      xhr.onload = function (oEvent) {
        arrayBuffer = xhr.response; 
        console.log(arrayBuffer);
        if(arrayBuffer.values==null){
          last_row=2;
        }else{
        last_row=arrayBuffer.values.length+1;
        }
        console.log("last row is " + last_row);
    }



    } else {
      var message = "";
      if (chrome.runtime.lastError)
          message = chrome.runtime.lastError.message;
      console.log("Not signed into Chrome, network error or no permission.\n" + message);
    }

  });
}

function updateSheets(action, submission_num,rubric_question, rubric_item, comment_info, comment,tbox_num,assignment_name,grader_name,check_box_status) {
  store_rubric_item=rubric_item;
  console.log(typeof(store_rubric_item));
  console.log("store_rubric_item is "+store_rubric_item);
  console.log("updating sheets now... for question "+rubric_question+"for item "+rubric_item);
  console.log("comment_info is "+comment_info);
  // a comment was just inserted, update the google sheets to keep count & log this
  
  if(action=="onLeaving"){
    user_id=grader_name;
  }
  
  chrome.identity.getAuthToken({interactive: true}, function(token) {
    if (token) {
      console.log("got the token");
      // use that access token to set an http header when calling the Drive API.

      if (action == "comment") {
        // send request to update frequency count in the comments google sheet

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
              // request done, we sent the data 
              console.log("Updated frequency count")
          } else if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(xhr.responseText);
          }
        };

        var row = parseInt(comment_info[0]);
        var cur_frequency = parseInt(comment_info[8]);
        console.log("comment was from row " + row);
        console.log("frequency was " + cur_frequency);

        xhr.open("PUT", 
          "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + "/values/F19!I" + row + "?valueInputOption=RAW",
          true);
        xhr.setRequestHeader('Authorization','Bearer ' + token);
        xhr.setRequestHeader("Content-type", "application/json");
        //xhr.responseType = "json";

        xhr.send('{' + 
          '"range": "F19!I' + row + '",' + 
          '"values": [[' + (cur_frequency + 1) + ']]' + 
        '}');
      }


      // send event log to event log sheet

      chrome.storage.local.get(null, function(items) {

        if (!items.user_id && user_id==undefined) {
          console.log("undefied user id");
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
          user_id = items.user_id;
          always_show = items.always_show;
        }
        console.log("user id: " + user_id);
        console.log("always show: " + always_show);

        if (rubric_item != undefined) {
          rubric_item = rubric_item.replace(/"/g, '\\"').replace(/'/g, "\\'");
          console.log("rubric_item after change: "+rubric_item);
        }

        var xhr2 = new XMLHttpRequest();
        xhr2.onreadystatechange = function () {
          if(xhr2.readyState === XMLHttpRequest.DONE && xhr2.status == 200) {
              // request done, we sent the data 
              console.log("Updated event log")
          } else if (xhr2.readyState === XMLHttpRequest.DONE) {
            console.log(xhr2.responseText);
          }
        };

        xhr2.open("POST", 
          "https://sheets.googleapis.com/v4/spreadsheets/" + event_sheet_id + 
            "/values/A10!A2:H100000:append?valueInputOption=RAW",
          true);
        xhr2.setRequestHeader('Authorization','Bearer ' + token);
        xhr2.setRequestHeader("Content-type", "application/json");

        if (action == "comment") {
          xhr2.send('{' + 
            '"range": "A10!A2:H100000",' + 
            '"values": [[ "' + new Date().toString() + '", "comment", "' + comment_info[0] + '", "' + user_id + '", "' + 
                  rubric_question + '", "' + rubric_item + '", "' + always_show + '", "' + comment + '", "'+submission_num+
                  '","" ]]' + 
          '}');
        } else if (action == "change setting") {
          xhr2.send('{' + 
            '"range": "A10!A2:H100000",' + 
            '"values": [[ "' + new Date().toString() + '", "change setting", "", "' + user_id + '", "", "", "' + always_show + 
            '", "","'+submission_num+'","" ]]' + 
          '}');
        } else if (action == "show suggestions" || action == "hide suggestions" || action == "focus") {
          xhr2.send('{' + 
            '"range": "A10!A2:H100000",' + 
            '"values": [[ "' + new Date().toString() + '", "' + action + '", "", "' + user_id + '", "' + 
                  rubric_question + '", "' + rubric_item + '", "' + always_show +'", "","'+submission_num+'","" ]]'+
          '}');
        } else if (action == "gradescope focus") {
          xhr2.send('{' + 
            '"range": "A10!A2:H100000",' + 
            '"values": [[ "' + new Date().toString() + '", "' + action + '", "", "' + user_id + '", "' + 
                  rubric_question + '", "", "' + always_show +'", "","'+submission_num+'","" ]]' + 
          '}');
        }else if (action == "pdf focus") {
          xhr2.send('{' + 
            '"range": "A10!A2:H100000",' + 
            '"values": [[ "' + new Date().toString() + '", "' + action + '", "", "' + user_id + '", "' + 
                  rubric_question + '", "", "' + always_show + '", "","'+submission_num+'","" ]]'  + 
          '}');
        }else if(action=="onLeaving"){
          xhr2.send('{' + 
          '"range": "A10!A2:H100000",' + 
          '"values": [[ "' + new Date().toString() + '", "' + action + '", "", "' + user_id + '", "' + 
                rubric_question + '", "' + rubric_item + '", "'  + always_show +'", "'+comment+'", "' +submission_num+  '", "'+tbox_num+'", "'+assignment_name+'", "'
                +check_box_status+'", "' +grader_name+'","" ]]'  + 
        '}');
        }

        if(action=="onLeaving"){
          xhr2.open("POST", 
          "https://sheets.googleapis.com/v4/spreadsheets/" + event_sheet_id + 
            "/values/id_name!A2:H100000:append?valueInputOption=RAW",
          true);
        xhr2.setRequestHeader('Authorization','Bearer ' + token);
        xhr2.setRequestHeader("Content-type", "application/json");

        xhr2.send('{' + 
        '"range": "id_name!A2:H100000",' + 
        '"values": [[ "' + user_id + '", "' + grader_name+'","" ]]'  + 
        '}');
        }
        });

      



    } else {
      var message = "";
      if (chrome.runtime.lastError)
          message = chrome.runtime.lastError.message;
      console.log("Not signed into Chrome, network error or no permission.\n" + message);
    }

  });
}

function saveNewComment() {
  chrome.storage.local.get(null, function(items) {
    if (items.saved != undefined && !items.saved) {

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
        user_id = items.user_id;
        always_show = items.always_show;
      }
      console.log("user id: " + user_id);
      console.log("always show: " + always_show);


      var values = '"values": [';
      // these have not been saved yet
      // save them

      // split comment text by newlines
      var comments = items.comment_text.split("\n");
      console.log("comments:");
      console.log(comments);
      var rubric_number = items.comments_rubric_number;
      var inserted_comments = items.comments_inserted;
      var ass_num= items.assignment_num;
      var sub_num= items.submission_num;
      var rubric_item=items.rubric_item;
      console.log("inserted commentS:");
      console.log(inserted_comments);

      // for each comment, append it to spreadsheet:
      for (var i = 0; i < comments.length; i++) {
        var already_there = false;

        var comment = comments[i];
        // ignore empty lines
        if (comment != "") {
          // delete -'s at the start of lines
          if (comment[0] == "-") {
            if (comment[1] == " ") {
              comment = comment.substr(2);
            } else {
              comment = comment.substr(1);
            }
          }
          console.log("comment:")
          console.log(comment);

          // check if comment == any of the inserted comments
          for (var comment_id in inserted_comments) {
            console.log("comparing:")
            console.log(comment);
            console.log(inserted_comments[comment_id]);
            if (comment == inserted_comments[comment_id]) {
              console.log("equal!");
              inserted_comments[comment_id] = "";
              already_there = true;
            }
          }
          if (already_there) continue;

          var comment_length = comment.length;
          // rubric question number (b) = items.rubric_number
          // if comment = one of the inserted comments, original id (e) = that inserted comment's id
          //    then remove that comment from inserted comments
          // comments (f) = comment
          // length (g) = comment.split(" ").length
          // category (h) = 0
          // frequency (i) = 1
          // frequency orig (j) = 1
          values += '[ "'+parseInt(last_row+1)+'", "' + rubric_number + '", "'+ ass_num+'", "'+rubric_item+'","'+sub_num+'", "' + 
              comment + '", "' + comment_length + '", "1", "1", "1", "", "' + user_id + '"' + 
            ' ],'
          last_row++;
        }
      }

      // if any comments left in inserted comments, just append them and figure it out manually
      //    be sure to include original comment id
      for (var comment_id in inserted_comments) {
        if (inserted_comments[comment_id] != "") {
          values += '[ "", "' + rubric_number + '", "", "'+rubric_item+","+ comment_id + '", "' + 
              inserted_comments[comment_id] + '", "' + inserted_comments[comment_id].length + 
              '", "1", "1", "1", "", "' + user_id + '"' + 
            ' ],'
        }
      }
      values = values.slice(0, values.length-1) + ']';
      if (values != '"values": ]') {
        appendCommentsToSheet(values);
      }
      // set saved to true so they don't get saved again
      chrome.storage.local.set({saved: true});

    }
  });
}

function appendCommentsToSheet(values) {
  console.log(values);
  
  // save to spreadsheet
  chrome.identity.getAuthToken({interactive: true}, function(token) {
    if (token) {
      console.log("got the token");
      // use that access token to set an http header when calling the Drive API.
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
            // request done, we sent the data 
            console.log("Added new comments")
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log(xhr.responseText);
        }
      };

      xhr.open("POST", 
        "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + 
          "/values/F19!A2:L10000:append?valueInputOption=RAW",
        true);
      xhr.setRequestHeader('Authorization','Bearer ' + token);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send('{' + 
        '"range": "F19!A2:L10000",' + 
        values + 
      '}');
    }
  });
}



function appendComments_pdf(pdf_list,rubric_question,rubric_item,submission_num,assignment_name,grader_name){
  console.log("do the append for the list from pdf");
  console.log(pdf_list);
  var values='"values": [';
  for(var i=0;i<pdf_list.length;i++){
    var comment = pdf_list[i];
    // ignore empty lines
    if (comment != "") {
      // delete -'s at the start of lines
      if (comment[0] == "-") {
        if (comment[1] == " ") {
          comment = comment.substr(2);
        } else {
          comment = comment.substr(1);
        }
      }
      console.log("comment:")
      console.log(comment);
      var comment_length = comment.length;
      values += '[ "'+parseInt(last_row+1)+'", "'+ rubric_question + '", "'+ assignment_name+'", "'+rubric_item+'","'+submission_num+'", "' + 
      comment + '", "' + comment_length + '", "1", "1", "1", "true", "' + grader_name + '"' + 
    ' ],'
  last_row++;

  }
}
values = values.slice(0, values.length-1) + ']';
if (values != '"values": ]') {
  chrome.identity.getAuthToken({interactive: true}, function(token) {
    if (token) {
      console.log("got the token");
      // use that access token to set an http header when calling the Drive API.
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
            // request done, we sent the data 
            console.log("Added new comments from PDF")
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log(xhr.responseText);
        }
      };

      xhr.open("POST", 
        "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + 
          "/values/F19!A2:L10000:append?valueInputOption=RAW",
        true);
      xhr.setRequestHeader('Authorization','Bearer ' + token);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send('{' + 
        '"range": "F19!A2:L10000",' + 
        values + 
      '}');
    }
  });
}

}


function appendStuentSubmission(sub_number,student_name_list){
  var res_string;
  if(student_name_list.length==1){
    res_string=student_name_list[0];
  }else{
    res_string=student_name_list.join();
  }
  console.log(res_string);
  value=
  chrome.identity.getAuthToken({interactive: true}, function(token) {
    if (token) {
      console.log("got the token");
      // use that access token to set an http header when calling the Drive API.
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
            // request done, we sent the data 
            console.log("Added new comments from PDF")
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log(xhr.responseText);
        }
      };

      xhr.open("POST", 
        "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + 
          "/values/submission!A2:L10000:append?valueInputOption=RAW",
        true);
      xhr.setRequestHeader('Authorization','Bearer ' + token);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send('{' + 
        '"range": "submission!A2:L10000",' + 
        '"values": [[ "' + sub_number + '", "' + res_string+'","" ]]'  + 
'}');
    }
  });
}



// keyboard shortcut to modify always show setting
chrome.commands.onCommand.addListener(function(command) {
  if (command == "toggle-suggestion-view") {

    // get current always show setting
    chrome.storage.local.get(null, function(items) {
      always_show = items.always_show;
      
      // now change it
      always_show = !always_show;
      chrome.storage.local.set({always_show: always_show});
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, "always show changed", function(response) {
          console.log("sent always show message: " + response);
        });
      });
      console.log("always show: " + always_show);
    });
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == "complete") {
    if (on_grading_page) {
      // get the text they entered for this submission and send it to spreadsheet
      saveNewComment();
      
    }
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "loadSpreadsheet") {
    
    loadSpreadsheet();
    sendResponse("done");
  } else if (request.action == "logEvent") {
    updateSheets("comment", request.submission_num,request.rubric_question, request.rubric_item, request.comment_info, request.comment);
    sendResponse("event logged");
  } else if (request.action == "logShowSetting") {
    updateSheets("change setting");
    sendResponse("event logged");
  } else if (request.action == "logSuggestionSee") {
    updateSheets("show suggestions", request.submission_num,request.rubric_question, request.rubric_item);
    sendResponse("event logged");
  } else if (request.action == "logSuggestionHide") {
    updateSheets("hide suggestions", request.submission_num,request.rubric_question, request.rubric_item);
    sendResponse("event logged");
  } else if (request.action == "logFocus") {
  
    updateSheets("focus", request.submission_num,request.rubric_question, request.rubric_item);
    sendResponse("event logged");
  } else if (request.action == "logGradescopeFocus") {
    updateSheets("gradescope focus", request.submission_num,request.rubric_question);
    sendResponse("event logged");
  } else if (request.action == "onGradingPage") {
    on_grading_page = true;
  } else if (request.action == "onLeaving") {
    //NOTICE: SINCE WE ARE ALWAYS USING GRADING PAGE, ongrading is useless
    //on_grading_page = false;
    updateSheets("onLeaving", request.submission_num,request.rubric_question,request.rubric_item,undefined,request.comment,request.tbox_num,request.assignment_name,request.grader_name,request.check_box_status);
  }else if (request.action == "logPDFFocus") {
    updateSheets("pdf focus", request.submission_num,request.rubric_question);
    sendResponse("event logged");
  }else if(request.action=="sendPDFbox"){
    appendComments_pdf(request.pdf_list,request.rubric_question,request.rubric_item,request.submission_num,request.assignment_name,request.grader_name);
    sendResponse("event logged");
  }else if(request.action=="sendStudentSubmission"){
    appendStuentSubmission(request.sub_number,request.student_name_list);
    sendResponse("event logged");
  }
});