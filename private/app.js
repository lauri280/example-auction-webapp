const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();

app.set("port", 3000);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
    res.sendFile("./public/index.html")
});

app.listen(app.get("port"), () => {
    console.log("Listening on port " + app.get("port"));
});

// getting data from API
let content = [];

setInterval(function() {
    request("http://uptime-auction-api.azurewebsites.net/api/Auction", { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        content = body;
    });
}, 1000);

setInterval(function() {
    app.post('/data', (req, res) =>  {
        res.json(content);
    });
}, 1000);

// finds a product from the saved products that maches the given id
function getProductById(products, id) {
    let returnedProduct = products.find(elem => {
        if (elem.productId == id) {

            return elem;
        }
    });

    if (returnedProduct == undefined) {
        console.log("No products found with that id");
    }
    
    return returnedProduct;
}

// getting bid data and saving the logs
let bidData;

app.post('/bid', function(req, res) {
    bidData = req.body;
    let id = bidData.productId;

    writeLogFile(getProductById(content, id), bidData, logPath);
    res.end("yes");
});


let logPath = "./private/logs/";

// writes a log file using bid data gotten from the front-end interface
function writeLogFile(productData, bidData, path) {
    let logDataPath = path + bidData.productId + ".txt";

    fs.access(logDataPath, fs.F_OK, (err) => {
        if (err) {
            if (err.code == "ENOENT") {
                console.log("File not found, creating...");

                addProductToFile(productData, logDataPath);
                addBidToFile(bidData, logDataPath);

                return
            } else {
                console.error(err)
                return
            }
        } else {
            addBidToFile(bidData, logDataPath);
        }
    });
}

// writes product data into the log file
function addProductToFile(productData, path) {
    let fileName = path;
    let fileContent = 
`id: ${productData.productId}
name: ${productData.productName}
description: ${productData.productDescription}
category: ${productData.productCategory}
end date: ${productData.biddingEndDate}\n
bids:\n`

    fs.writeFile(fileName, fileContent, function(err) {
        if (err) {
            console.log("There has been an error while writing product data to file");
            return console.log(err);
        }

        console.log(`${productData.productId}.txt created successfully`);
    });
}

// creates an entry in an existing log file about a bid
function addBidToFile(bidData, path) {
    let fileName = path;
    let fileContent = 
`\nname: ${bidData.bidName}
date: ${bidData.bidDate}
bid amount: ${bidData.bidAmount}
-------------`;

    fs.appendFile(fileName, fileContent, function(err) {
        if (err) {
            console.log(`There has been an error while writing bid data to ${bidData.productId}.txt`);
            return console.log(err);
        }

        console.log(`Bid info added to ${bidData.productId}.txt successfully!`);
    });
}