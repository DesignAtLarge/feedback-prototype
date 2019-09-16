var user_id;
var always_show;
var feedback_sheet_id = "196vCHcg9O1mR9jYQLeo-jF1PAkbK0VRAHdSlf4ngEZM";
var feedback;

function sendTAFeedback() {
  feedback = $("#ta_comments").val();
  feedback = feedback.replace(/"/g, '\\"').replace(/'/g, "\\'");
  //console.log(feedback);

  chrome.identity.getAuthToken({interactive: true}, function(token) {
    if (token) {

      var xhr2 = new XMLHttpRequest();
      xhr2.onreadystatechange = function () {
        if(xhr2.readyState === XMLHttpRequest.DONE && xhr2.status == 200) {
            // request done, we sent the data 
            window.close();
        } else if (xhr2.readyState === XMLHttpRequest.DONE) {
          console.log(xhr2.responseText);
        }
      };

      xhr2.open("POST", 
        "https://sheets.googleapis.com/v4/spreadsheets/" + feedback_sheet_id + 
          "/values/A1:A100000:append?valueInputOption=RAW",
        true);
      xhr2.setRequestHeader('Authorization','Bearer ' + token);
      xhr2.setRequestHeader("Content-type", "application/json");


      xhr2.send('{' + 
        '"range": "A1:A100000",' + 
        '"values": [[ "' + feedback + '" ]]' + 
      '}');

    } else {
      var message = "";
      if (chrome.runtime.lastError)
          message = chrome.runtime.lastError.message;
      console.log("Not signed into Chrome, network error or no permission.\n" + message);
    }

  });

}



document.addEventListener('DOMContentLoaded', function() {

  $("#send_button").click(sendTAFeedback);

  // check box if always_show == true
  chrome.storage.local.get(null, function(items) {
    if (!items.user_id) {
      user_id = Math.random().toString(36) + new Date().getTime();
      always_show = (Math.random() < 0.5);
      console.log("always show: " + always_show);
      chrome.storage.local.set({user_id: user_id, always_show: always_show});
    } else if (items.always_show == undefined) {
      user_id = items.user_id;
      always_show = false;
      console.log("always show: " + always_show);
      chrome.storage.local.set({always_show: false});
    } else {
      user_id = items.user_id;
      always_show = items.always_show;
    }
    console.log("always show: " + always_show);
    if (always_show) {
      $("#always_show_checkbox").prop( "checked", true );
    }
  });

  $("#always_show_checkbox").change(function() {
    if(this.checked) {
      always_show = true;
    } else {
      always_show = false;
    }
    chrome.storage.local.set({always_show: always_show});
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, "always show changed", function(response) {
        console.log("sent always show message: " + response);
      });
    });
    console.log("always show: " + always_show);
  });

});
