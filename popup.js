var user_id;
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

});
