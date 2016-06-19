$(function() {
    $( "#search" ).autocomplete({
        minLength: 3,
        delay: 500,
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
        //url: 'http://127.0.0.1:1337/bookSearch/',
        url: 'http://wellreadserver.herokuapp.com/bookSearch/',
        type: 'GET',
        data: 'q=' + searchTerm,
        success: function(data) {
            //console.log("Search Response : " + data);
            
            var formattedData = [];
            
            if(Array.isArray(data)) {
                for(var i = 0; i < data.length; i++) {
                    var newBookObject = new Object();
                    newBookObject.label = data[i].title;
                    newBookObject.isbn = data[i].isbn;
                    formattedData.push(newBookObject);
                }
            }
            
            response(formattedData);
        }
    });
}

function getBookDetails(isbn) {
    $('#topBooks').hide();
    $.ajax({
        //url: 'http://127.0.0.1:1337/bookLookup/',
        url: 'http://wellreadserver.herokuapp.com/bookLookup/',
        type: 'GET',
        data: 'ISBN=' + isbn,
        success: function(data) {
            //console.log("Search Response (ISBN) : " + data);
            
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
            $('#bookImageLink').attr('href', obj.book.urlAmazon);
            
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
                    summaryRowsHtml += createSummaryTableRow(val.id, val.datetime, val.text, val.name, val.votes);
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
        //url: 'http://127.0.0.1:1337/topSummaries/',
        url: 'http://wellreadserver.herokuapp.com/topSummaries/',
        type: 'GET',
        data: 'number=' + number,
        success: function(data) {
            //console.log("Top Books Response : " + data);
            var listHtml = "<ul>";
            $.each(data, function(key, val) {
                listHtml += "<li><a href=?ISBN=" + val.isbn + ">" + val.title + "</a>, " + val.author + "</li>";
            });
            listHtml += "</ul>";
            $('#topBooks').append(listHtml);
        }
    });
}

// actually two rows! one for the author name
function createSummaryTableRow(summaryID, summaryTime, summaryText, summaryAuthor, votes) {
    //<input type="hidden" name="_id_" value="34547563">
    if(summaryTime) {
        summaryTime = new Date(summaryTime).toLocaleString('en-GB', { hour12: false });
    }
    return "<tr><td class='votecell'><div class='vote'><input type='hidden' name='_id_' value=" + summaryID + "><a id='voteUp' class='vote-up-off'></a><span itemprop='upvoteCount' class='vote-count-post '>" + votes + "</span><a id='voteDown' class='vote-down-off'></a></div></td><td class='postcell'>" + summaryText + "</td><td class='summaryAuthor'>" + summaryAuthor + " " + summaryTime + "</td></tr>";
    //<tr class='summaryAuthorRow'><td></td><td class='summaryAuthor'>" + summaryAuthor + " (" + summaryTime + ")</td></tr>"; // used to be a seperate row, but this complicates sorting!
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
        //console.log("Vote Up! ID : " + summaryID);
        vote = 1;
        // e.target.previousSibling.value
        // slighty hacky way of getting hold of the hidden input value (ID)
    } else if(e.target.id == "voteDown") {
        //console.log("Vote Down! ID : " + summaryID);
        vote = -1;
    }
    if((vote == 1 || vote == -1) && !sessionStorage.getItem(summaryID)) {
        sessionStorage.setItem(summaryID, vote);
        
        // don't wait for server and page refresh - update the numbers on client
        var voteCount = e.target.parentNode.getElementsByClassName('vote-count-post').item(0);
        //var voteCount = e.target.parentNode.getElementById('voteCount');
        var newVoteCount = +voteCount.textContent + vote;
        voteCount.textContent = newVoteCount;
        // this works well, but doesn't currently handle reordering the list!
        sortTable('summaryTable');
        
        $.ajax({
            //url: 'http://127.0.0.1:1337/voteSummary/',
            url: 'http://wellreadserver.herokuapp.com/voteSummary/',
            type: 'POST',
            data: 'oAuthID=' + oAuthID_memory + '&summaryID=' + summaryID + '&vote=' + vote,
            success: function(data) {
                // we don't end up in here, no response!
            },
            complete: function(data) {
                console.log("Vote POST complete - refreshing page!");
                //refreshPage();
            }
        });
    } else if(sessionStorage.getItem(summaryID)) {
        alert('You\'ve already voted on this item!');
    }
});

// http://stackoverflow.com/questions/7558182/sort-a-table-fast-by-its-first-column-with-javascript-or-jquery
function sortTable(tableElementId) {
    var tbl = document.getElementById(tableElementId).tBodies[0];
    var store = [];
    for(var i=0, len=tbl.rows.length; i<len; i++) {
        var row = tbl.rows[i];
        
        var sortnr = parseFloat(row.cells[0].getElementsByClassName('vote-count-post').item(0).textContent);
        //var sortnr = parseFloat(row.cells[0].textContent || row.cells[0].innerText);
        
        if(!isNaN(sortnr)) store.push([sortnr, row]);
    }
    store.sort(function(x,y) {
        return y[0] - x[0]; // we want descending...
        //return x[0] - y[0];
    });
    for(var i=0, len=store.length; i<len; i++) {
        tbl.appendChild(store[i][1]);
    }
    store = null;
}

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
    summary = encodeURIComponent(summary);
    
    if(!summary) {
        alert('Please enter some text...');
        e.preventDefault(); // don't navigate away!
        return;
    }
    
    console.log("About to POST summary : " + summary + " for user : " + oAuthID_memory + " where ISBN : " + $('#bookISBN').text());
    $.ajax({
        //url: 'http://127.0.0.1:1337/writeSummary/',
        url: 'http://wellreadserver.herokuapp.com/writeSummary/',
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