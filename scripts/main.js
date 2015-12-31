$(function() {
    /*
    var availableTags = [
        "Freakonomics",
        "SuperFreakonomics"
    ];
    */
    
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
        url: 'http://127.0.0.1:1337',
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
        url: 'http://127.0.0.1:1337',
        type: 'GET',
        data: 'ISBN=' + isbn,
        success: function(data) {
            console.log("Search Response (ISBN) : " + data);
            
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
        
            if(Array.isArray(obj.summaryList)) {
                var summaryRowsHtml = '';
                $.each(obj.summaryList, function(key, val) {
                    //$('.post-text').html(val); // FIXME should probably not be a class identifier!

                    //var html = createSummaryTableRow(val.text);
                    //$('#summaryTable').append(html);
                    summaryRowsHtml += createSummaryTableRow(val.text);
                });
                $('#summaryTable').html(summaryRowsHtml);
            }
            
            $('#search').val(''); //jquery clear input
            $('#SummaryTextArea').val('');
        }
    });
}

function createSummaryTableRow(summaryText) {
    return "<tr><td class='votecell'><div class='vote'><a class='vote-up-off'></a><span itemprop='upvoteCount' class='vote-count-post '>0</span><a class='vote-down-off'></a><a class='star-off'></a></div></td><td class='postcell'><div class='post-text' itemprop='text'/>" + summaryText + "</td></tr>";
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

// new way of writing/posting summaries
$(document).on('submit', '#SummaryText', function(e) {
    var summary = $('#SummaryTextArea').val(); // use jquery to fetch value
    console.log("About to POST data (NEW) : " + summary);
     $.ajax({
        url: 'http://127.0.0.1:1337',
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
    $('#summaryTable').append(createSummaryTableRow(summary));
    $('#SummaryTextArea').val('');
});