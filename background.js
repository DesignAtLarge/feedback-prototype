var comment_sheet_id = "1-Xo0TcHNoSnbxtkGgiRcbnxcMip1R0PQFsrIOsiYevU";
var event_sheet_id = "1pSgzEcft13sB3Lee_zNMkYD_WcDIUqKnjyP12XtLjzc";
var user_id;
var always_show;

function loadSpreadsheet() {
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
        "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + "/values/A7!A2:I110",
        true);
      xhr.setRequestHeader('Authorization','Bearer ' + token);
      xhr.responseType = "json";

      xhr.send();



    } else {
      var message = "";
      if (chrome.runtime.lastError)
          message = chrome.runtime.lastError.message;
      console.log("Not signed into Chrome, network error or no permission.\n" + message);
    }

  });
}

function updateSheets(action, rubric_question, rubric_item, comment_info) {
  //console.log("updating sheets");
  // a comment was just inserted, update the google sheets to keep count & log this
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

        var row = parseInt(comment_info[0]) + 2;
        var cur_frequency = parseInt(comment_info[8]);
        console.log("comment was from row " + row);
        console.log("frequency was " + cur_frequency);

        xhr.open("PUT", 
          "https://sheets.googleapis.com/v4/spreadsheets/" + comment_sheet_id + "/values/A7!I" + row + "?valueInputOption=RAW",
          true);
        xhr.setRequestHeader('Authorization','Bearer ' + token);
        xhr.setRequestHeader("Content-type", "application/json");
        //xhr.responseType = "json";

        xhr.send('{' + 
          '"range": "A7!I' + row + '",' + 
          '"values": [[' + (cur_frequency + 1) + ']]' + 
        '}');
      }


      // send event log to event log sheet

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
          user_id = items.user_id;
          always_show = items.always_show;
        }
        console.log("user id: " + user_id);
        console.log("always show: " + always_show);

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
            "/values/A7!A2:G100000:append?valueInputOption=RAW",
          true);
        xhr2.setRequestHeader('Authorization','Bearer ' + token);
        xhr2.setRequestHeader("Content-type", "application/json");

        if (action == "comment") {
          xhr2.send('{' + 
            '"range": "A7!A2:G100000",' + 
            '"values": [[ "' + new Date().toString() + '", "comment", "' + comment_info[0] + '", "' + user_id + '", "' + 
                  rubric_question + '", "' + rubric_item + '", "' + always_show + 
            '" ]]' + 
          '}');
        } else if (action == "change setting") {
          xhr2.send('{' + 
            '"range": "A7!A2:G100000",' + 
            '"values": [[ "' + new Date().toString() + '", "change setting", "", "' + user_id + '", "", "", "' + always_show + 
            '" ]]' + 
          '}');
        } else if (action == "show suggestions" || action == "hide suggestions" || action == "focus") {
          xhr2.send('{' + 
            '"range": "A7!A2:G100000",' + 
            '"values": [[ "' + new Date().toString() + '", "' + action + '", "", "' + user_id + '", "' + 
                  rubric_question + '", "' + rubric_item + '", "' + always_show + 
            '" ]]' + 
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "loadSpreadsheet") {
    loadSpreadsheet();
    sendResponse("done");
  } else if (request.action == "logEvent") {
    updateSheets("comment", request.rubric_question, request.rubric_item, request.comment_info);
    sendResponse("event logged");
  } else if (request.action == "logShowSetting") {
    updateSheets("change setting");
    sendResponse("event logged");
  } else if (request.action == "logSuggestionSee") {
    updateSheets("show suggestions", request.rubric_question, request.rubric_item);
    sendResponse("event logged");
  } else if (request.action == "logSuggestionHide") {
    updateSheets("hide suggestions", request.rubric_question, request.rubric_item);
    sendResponse("event logged");
  } else if (request.action == "logFocus") {
    updateSheets("focus", request.rubric_question, request.rubric_item);
    sendResponse("event logged");
  }
});