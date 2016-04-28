$(function() {
    $( "#search" ).autocomplete({
        minLength: 3,
        delay: 800,
      //source: availableTags
        source: autoCompleteFromServer,
        select: function (event, ui) {
            //alert($(this).val());
            var isbn = ui.item.isbn;
            // navigate to book page passing the ISBN!
            getBookDetails(isbn);
        }
    });
});

//https://api.jqueryui.com/autocomplete/#option-source
function autoCompleteFromServer(request, response) {
    var searchTerm = request.term;
    console.log("Search Term : " + searchTerm);

    //response([{ label: 'BOB', value: '123'  }]);
    
    // send to the server and get a list of book titles back
    //http://127.0.0.1:1337/?q=freak
    
    $.ajax({
        //url: 'http://127.0.0.1:1337',
        url: 'http://wellreadserver.herokuapp.com',
        type: 'GET',
        data: 'q=' + searchTerm,
        success: function(data) {
            console.log("Search Response : " + data);
            
            var formattedData = [];
            
            var obj = JSON.parse(data);
            for(var id in obj) {
                var book = obj[id];
                
                // simple array of strings
                //formattedData.push(book.title);
                
                // array of objects
                var newBookObject = new Object();
                newBookObject.label = book.title;
                //newBookObject.value = book.isbn;
                newBookObject.isbn = book.isbn;
                formattedData.push(newBookObject);
            }
            
            response(formattedData);
        }
    });
}

function getBookDetails(isbn) { 
    $.ajax({
        url: 'http://127.0.0.1:1337/bookLookup/',
        //url: 'http://wellreadserver.herokuapp.com',
        type: 'GET',
        data: 'ISBN=' + isbn,
        success: function(data) {
            console.log("Search Response (ISBN) : " + data);
            
            // FIXME really need to properly clear all fields

            //var obj = JSON.parse(data);
            // FIXME think the change to the response headers has made this redundant?
            // well not redundant, but it actually breaks! doesn't parse, cos it's already JSON? 
            var obj = data; 
            
            // pass it straight to the page?
            $('#bookTitle').html(obj.book.title);
            
            var authorList = '';
            if(Array.isArray(obj.book.author)) {
                $.each(obj.book.author, function(key, val) {
                    //$('#bookAuthor').append(val + ', ');
                    // generally avoid append, because it causes problems for subsequent searches (without page refresh)
                    authorList += (val + ', ');
                });
                if(authorList.endsWith(', ')) {
                    authorList = authorList.substring(0, authorList.length - 2);
                }
            } else {
                // single author, non array
                authorList = obj.book.author;
            }
            $('#bookAuthor').html(authorList);
            
            $('#bookPublisher').html(obj.book.publisher);
            $('#bookISBN').html(obj.book.isbn);
            $('#bookImage').attr('src', obj.book.image);
            
            // jquery show hidden div!
            $('#bookBox').show();
            if(!loggedIn) {
                //$("#SummaryText :input").prop("disabled", true);
                $('#SummaryText').block({ 
                    message: '<h4>You need to Login</h4>', 
                    css: { border: '1px solid #000' }
                });
            }
            
            $('#summaryTable').html('');
            if(Array.isArray(obj.summaryList)) {
                var summaryRowsHtml = '';
                $.each(obj.summaryList, function(key, val) {
                    //$('.post-text').html(val); // FIXME should probably not be a class identifier!

                    //var html = createSummaryTableRow(val.text);
                    //$('#summaryTable').append(html);
                    summaryRowsHtml += createSummaryTableRow(val.id, val.text, val.votes);
                });
                $('#summaryTable').html(summaryRowsHtml);
            }
            
            $('#search').val(''); //jquery clear input
            $('#SummaryTextArea').val('');
            
            setGetParameter("ISBN", obj.book.isbn);
        }
    });
}

function getTopBooks(number) { 
    $.ajax({
        url: 'http://127.0.0.1:1337/topSummaries/',
        //url: 'http://wellreadserver.herokuapp.com',
        type: 'GET',
        data: 'number=' + number,
        success: function(data) {
            console.log("Top Books Response : " + data);
            var listHtml = "<ul>";
            $.each(data, function(key, val) {
                listHtml += "<li>" + val.title + " : " + val.author + " : summaries = " + val.summary_count + "</li>";
            });
            listHtml += "</ul>";
            $('#topBooks').html(listHtml);
        }
    });
}

function createSummaryTableRow(summaryID, summaryText, votes) {
    //<input type="hidden" name="_id_" value="34547563">
    return "<tr><td class='votecell'><div class='vote'><input type='hidden' name='_id_' value=" + summaryID + "><a id='voteUp' class='vote-up-off'></a><span itemprop='upvoteCount' class='vote-count-post '>" + votes + "</span><a id='voteDown' class='vote-down-off'></a></div></td><td class='postcell'>" + summaryText + "</td></tr>";
    // <a class='star-off'></a> disabled for now, no need for it - might eventually become 'my favourites'
}

// won't be applied for future items added to the page dynamically!
//$("#voteUp").click(function() {
//    alert("Vote Up!");
//});
$(document).on("click", '#summaryTable', function(e) {
//$("#summaryTable").on( "click", function() {
    var summaryID = e.target.parentNode.children[0].value;
    var vote; // 1 = up, -1 = down
    if(e.target.id == "voteUp") {
        //alert("Vote Up! ID : " + summaryID);
        vote = 1;
        // e.target.previousSibling.value
        // slighty hacky way of getting hold of the hidden input value (ID)
    } else if(e.target.id == "voteDown") {
        //alert("Vote Down! ID : " + summaryID);
        vote = -1;
    }
    // FIXME apply the vote, via a new POST call
    if(vote == 1 || vote == -1) {
        $.ajax({
            url: 'http://127.0.0.1:1337/voteSummary/',
            //url: 'http://wellreadserver.herokuapp.com',
            type: 'POST',
            data: 'oAuthID=' + oAuthID_memory + '&summaryID=' + summaryID + '&vote=' + vote,
            success: function(data) {
                // we don't end up in here, no response!
            },
            complete: function(data) {
                refreshPage();
            }
        });
    }
    // FIXME you can only vote once! (could just implement this on the server side for now)
});

/*
function writeSummaryInput() {
    var summary = document.forms["SummaryText"]["SummaryTextArea"].value;
    console.log("About to POST data : " + summary);
    $.ajax({
        url: 'http://127.0.0.1:1337',
        type: 'POST',
        data: 'summary=' + summary + '&isbn=' + $('#bookISBN').text(),
        success: function(data) {
            console.log("POST Summary Response : " + data);
            var obj = JSON.parse(data);
        }
    });
}
*/

// FIXME lots of work needed here, really shouldn't be necessary to go to server
// and even if we do, we don't need the whole page, just the summaries? break that service up!
function refreshPage() {
    getBookDetails($('#bookISBN').text());
}

// new way of writing/posting summaries
$(document).on('submit', '#SummaryText', function(e) {
    var summary = $('#SummaryTextArea').val(); // use jquery to fetch value
    console.log("About to POST summary : " + summary + " for user : " + oAuthID_memory);
    $.ajax({
        url: 'http://127.0.0.1:1337/writeSummary/',
        //url: 'http://wellreadserver.herokuapp.com',
        type: 'POST',
        data: 'oAuthID=' + oAuthID_memory + '&summary=' + summary + '&isbn=' + $('#bookISBN').text(),
        success: function(data) {
            // we don't end up in here, no response!
            //var obj = JSON.parse(data);
        },
        complete: function(data) {
            // cheating a bit, but a full refresh? DB won't necessarily have updated in time!
            refreshPage();
        }
    });
    e.preventDefault(); // don't navigate away!
    
    // update page/summaries
    //$('#summaryTable').append(createSummaryTableRow(null, summary)); // problematical if we dont have the ID of the row!
    
    $('#SummaryTextArea').val('');
});