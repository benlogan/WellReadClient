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
        //url: 'http://127.0.0.1:1337',
        url: 'http://wellreadserver.herokuapp.com',
        type: 'GET',
        data: 'ISBN=' + isbn,
        success: function(data) {
            console.log("Search Response (ISBN) : " + data);
            
            // FIXME really need to properly clear all fields

            var obj = JSON.parse(data);
            
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
            
            $('#summaryInput').show(); //jquery for show/hide!
            $('#summaryTableDiv').show();
        
            $('#summaryTable').html('');
            if(Array.isArray(obj.summaryList)) {
                var summaryRowsHtml = '';
                $.each(obj.summaryList, function(key, val) {
                    //$('.post-text').html(val); // FIXME should probably not be a class identifier!

                    //var html = createSummaryTableRow(val.text);
                    //$('#summaryTable').append(html);
                    summaryRowsHtml += createSummaryTableRow(val.id, val.text);
                });
                $('#summaryTable').html(summaryRowsHtml);
            }
            
            $('#search').val(''); //jquery clear input
            $('#SummaryTextArea').val('');
        }
    });
}

function createSummaryTableRow(summaryID, summaryText) {
    //<input type="hidden" name="_id_" value="34547563">
    return "<tr><td class='votecell'><div class='vote'><input type='hidden' name='_id_' value=" + summaryID + "><a id='voteUp' class='vote-up-off'></a><span itemprop='upvoteCount' class='vote-count-post '>0</span><a id='voteDown' class='vote-down-off'></a><a class='star-off'></a></div></td><td class='postcell'>" + summaryText + "</td></tr>";
}

// won't be applied for future items added to the page dynamically!
//$("#voteUp").click(function() {
//    alert("Vote Up!");
//});
$(document).on("click", '#summaryTable', function(e) {
//$("#summaryTable").on( "click", function() {
    if(e.target.id == "voteUp") {
        alert("Vote Up! ID : " + e.target.parentNode.children[0].value); 
        // e.target.previousSibling.value
        // slighty hacky way of getting hold of the hidden input value (ID)
    } else if(e.target.id == "voteDown") {
        alert("Vote Down! ID : " + e.target.parentNode.children[0].value);
    }
    // FIXME apply the vote, via a new post call
    // going to need auth soon, so that we can enforce only voting once!
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

// new way of writing/posting summaries
$(document).on('submit', '#SummaryText', function(e) {
    var id = 999; // FIXME doesn't exist in DB yet!!
    var summary = $('#SummaryTextArea').val(); // use jquery to fetch value
    console.log("About to POST data (NEW) : " + summary);
     $.ajax({
        //url: 'http://127.0.0.1:1337',
        url: 'http://wellreadserver.herokuapp.com',
        type: 'POST',
        data: 'summary=' + summary + '&isbn=' + $('#bookISBN').text(),
        success: function(data) {
            console.log("POST Summary Response : " + data);
            //var obj = JSON.parse(data);
        }
    });
    e.preventDefault(); // don't navigate away!
    
    // FIXME update page/summaries after!
    //getBookDetails($('#bookISBN').text()); // cheating a bit, but a full refresh? DB won't necessarily have updated in time!
    $('#summaryTable').append(createSummaryTableRow(id, summary));
    $('#SummaryTextArea').val('');
});