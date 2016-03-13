// No server call test file!

$(function() {
    var availableTags = [
        "Freakonomics",
        "SuperFreakonomics"
    ];
    
    $( "#search" ).autocomplete({
        minLength: 3,
        delay: 800,
        source: availableTags,
        select: function (event, ui) {
            var isbn = 1234;
            getBookDetails(isbn);
        }
    });
});

function getBookDetails(isbn) {
    $('#bookTitle').html('Freakonomics');
    $('#bookAuthor').html('Joe Bloggs');
    $('#bookPublisher').html('Publisher X');
    $('#bookISBN').html(isbn);
    $('#bookImage').attr('src', 'images/51f6u5F2sdL.jpg');
    
    //$('#search').val(''); // won't work - ui autocomplete won't have written back to the box yet
    
    $('#summaryInput').show();
    $('#summaryTableDiv').show();
    var summaryTableHTML = createSummaryTableRow('998','Some summary text! One line.');
    summaryTableHTML += createSummaryTableRow('999','Some summary text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text, some summary test text!');
    $('#summaryTable').html(summaryTableHTML);
    //$('#SummaryTextArea').val('');
}

function createSummaryTableRow(summaryID, summaryText) {
    return "<tr><td class='votecell'><div class='vote'><input type='hidden' name='_id_' value=" + summaryID + "><a id='voteUp' class='vote-up-off'></a><h3 id='voteCount'>0</h3><a id='voteDown' class='vote-down-off'></a><a class='star-off'></a></div></td><td class='postcell'>" + summaryText + "</td></tr>";
}