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
            $('#bookAuthor').html(obj.book.author);
            $('#bookPublisher').html(obj.book.publisher);
            $('#bookISBN').html(obj.book.isbn);
            $('#bookImage').attr('src', obj.book.image);
            
            $('#summaryInput').show(); //jquery for show/hide!
            $('#summaryTable').show();
            
            $('#SummaryTextArea').text(obj.summary.text);
            
            $('#search').val(''); //jquery clear input
        }
    });
}

function writeSummaryInput() {
    //var summary = $('SummaryTextArea').val(); // use jquery to fetch value
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
    // update summaries after!
}