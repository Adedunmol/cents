

// a and b are javascript Date objects
function dateDiffInDays(date1, date2) {
    //Get 1 day in milliseconds
    var oneDay_ms = 1000 * 60 * 60 * 24;

    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;
   
    // Convert back to days and return
    return Math.round(difference_ms/oneDay_ms);
}


function findSecondsDifference ( date1, date2 ) { 
    var oneSecond_ms = 1000;

    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;
      
    // Convert back to days and return
    return Math.round(difference_ms/oneSecond_ms); 
}


module.exports = { dateDiffInDays, findSecondsDifference }