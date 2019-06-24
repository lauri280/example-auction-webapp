
// --- Event handlers ---
$(document).on('click', 'input[name^="chkbox-"]', function() {

    displayProducts(products);
    getSelectedCategories();
});

$(document).on('click', '#reset-categories', function() {
    $('input:checked', $('#category-menu')).each(function () {
        $(this).prop('checked', false);
    });

    displayProducts(products);
});

$(document).on('click', '.bid-button' , function() {
    let productName = $(this).siblings(".product-name").text();
    selectedItemId = $(this).parent().attr("id");

    $("#bid-window-content-input").prepend(`<h2 class="bid-window-name">${productName}</h2>`);
    $("#bid-window").css("display", "block");
});

$(document).on('click', '.close', function() {
    $("#bid-window").css("display", "none");
    $(".bid-window-name").remove();
    $("#input-full-name, #input-bid").val("");

});

$(document).on('click', '#bid-window', function(event) {;
    if (event.target == this) {
        $("#bid-window").css("display", "none");
        $(".bid-window-name").remove();
        $("#input-full-name, #input-bid").val("");
    }
});

$(document).on('click', ".confirm-bid-button", function() {
    if (($("#input-full-name").val() != "") && ($("#input-bid").val() != "")) {
        let name = $("#input-full-name").val();
        let bidAmount = $("#input-bid").val();
        let bidDate = new Date().toISOString();
        let bidData = {"productId": selectedItemId,"bidName": name,"bidDate": bidDate,"bidAmount": bidAmount};
        
        jsonBidData = JSON.stringify(bidData);
        console.log(jsonBidData);

        $.post("/bid", bidData, function(data) {
            if (data == "done") {
                console.log("Bid sent successfully");
            }
        });
    }
});



let products = "";
let selectedItemId = "";

// getting product data from the server
$.post("/data", function(data) {
    products = data;

    displayCategories(products);
    displayProducts(products);
});


function displayProducts(products) {
    $("#content").empty();

    let categories = getSelectedCategories();
    
    products.forEach(elem => {
        if ((categories.includes(elem.productCategory) || categories.length == 0) 
        && isBiddingPossible(elem.biddingEndDate) == true) {
            $("#content").append(createProductElem(elem));
        }
    });
}


function displayCategories(products) {
    $("#category-menu").empty();
    let productCategories = [];

    products.forEach(elem => {
        if (!(productCategories.includes(elem.productCategory))) {
            productCategories.push(elem.productCategory);
            $("#category-menu").append(createCategoryMenuElem(elem.productCategory));
        }
    });
}

function isBiddingPossible(bidEndDate) {
    if ((parseISOString(bidEndDate) - new Date()) < 0) {
        return false;
    } else {
        return true;
    }
}

// returns the time left to bid in a formatted way to display on the product card
function returnTimeLeftText(bidEndDate) {
    let timeLeft = parseISOString(bidEndDate) - new Date();

    let daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (timeLeft < 0) {
        return "Bidding has ended";
    } else if (timeLeft < 1000 * 60) {
        return "Time left: < 1 minute";
    } else if (daysLeft == 0 && hoursLeft != 0) {
        return `Time left: ${hoursLeft} hours, ${minutesLeft} minute(s)`;
    } else if (hoursLeft == 0) {
        return `Time left: ${minutesLeft} minute(s)`;
    } else {
        return `Time left: ${daysLeft} days, ${hoursLeft} hours`;
    }
}

// takes a date in ISO format and returns a Date() object
function parseISOString(isoDate) {
    let t = isoDate.split(/\D+/);

    return new Date(Date.UTC(t[0], --t[1], t[2], t[3], t[4], t[5], t[6]));
}


// creates a product card HTML element
function createProductElem(product) {

    return `<div class="item" id="${product.productId}">
                <h4 class="product-name">${product.productName}</h4>
                <p class=category-label>${product.productCategory}</p>
                <p>${product.productDescription}</p>
                <p class="time-left">${returnTimeLeftText(product.biddingEndDate)}</p>
                <button type="button" class="bid-button">Make a bid</button>
            </div>`
}

// takes a string and returns it without spaces and uppercase letters
function toVariableName(name) {

    return name.split(" ").join("").toLowerCase();
}

// takes a category as a string and returns an HTML element
function createCategoryMenuElem(category) {

    return `<div class="category-menu-item">
                <input type="checkbox" name="chkbox-${toVariableName(category)}" id="${toVariableName(category)}">
                <label for=chkbox-${toVariableName(category)} id="label-${toVariableName(category)}">${category}</label><br>
            </div>`
}

function getSelectedCategories() {
    let selectedCategories = [];

    $('input:checked', $('#category-menu')).each(function () {
        selectedCategories.push($(`#label-${$(this).attr("id")}`).text());
    });

    return selectedCategories;
}
