
//this is the js file for adding the sbadge for student view in gradescope
var dialog_url;
dialog_url = chrome.extension.getURL("dialog.png");
//var htmlobj= $("div[data-react-class]")[0].outerHTML;
var attrobj= jQuery.parseJSON($("div[data-react-class]").attr('data-react-props'));
console.log(attrobj);
var q_dict={}
var attrArray = attrobj['inorder_leaf_question_ids']

//console.log(typeof(attrArray[0]))
//console.log($("a[role='tab']").length);

var q_array=$("a[role='tab']")
//console.log($(q_array[0]).attr('href'));
var i =0;
while(i<attrArray.length){
    var key= attrArray[i];
    q_dict[key]=$(q_array[i]).attr('href');
    i++;
}

//console.log(q_dict[2039234]);
//find related index after create the dict

var q_submissions=attrobj['question_submissions'];
var to_match=[];
$(q_submissions).each(function(){
    console.log($(this)[0]['evaluations']);
    if($(this)[0]['evaluations'].length!=0){
        to_match.push(q_dict[$(this)[0]['question_id']]);
    }
});

//add badge to the part 

console.log(to_match);
//add innerHTML to the link text
var j=0;
while(j<to_match.length){
    // for adding in the link itself
    original=$('a[href='+'"'+to_match[j]+'"'+']').html();
    $('a[href='+'"'+to_match[j]+'"'+']').text(original+" (YOU HAVE A COMMENT)");

    //add the badge around siblings
    $('a[href='+'"'+to_match[j]+'"'+']').next().prepend($('<img>',{style:'width:20px;height:20px',src:dialog_url}));
    j++;
}