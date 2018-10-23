var inquirer = require("inquirer");
var request = require("request");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "bamazon"
});

var queryResults = {
  array: [],
  results: []
};

var getChoice = [
  {
    type: "list",
    choices: queryResults.array,
    message: "What would you like to buy?",
    name: "item"
  }
];

var howMany = [
  {
    message: "How many would you like?",
    name: "number"
  }
];

var getStarted = [
  {
    type: "list",
    name: "start",
    choices: [
      "Look at everything",
      "Search for a product",
      "Browse for a product",
      "Log in as a dealer",
      "Quit"
    ],
    message: "What would you like to do?"
  }
];

var search = [
  {
    type: "input",
    name: "search",
    message: "What are you looking for?"
  }
];

var browse = [
  {
    type: "list",
    name: "browse",
    message: "Choose a department.",
    choices: [
      "'Adventuring Gear'",
      "'Armor'",
      "'Mounts and Vehicles'",
      "'Tools'",
      "'Weapon'"
    ]
  }
];

///////////////////////////////////////////////////////////////////
///////////// Functions                         //////////////////
/////////////////////////////////////////////////////////////////

async function start() {
  await clearQuery();

  console.log(`\n\n\n\t\tWelcome to the Bamazon Adventuring Store!\n`),
    inquirer.prompt(getStarted).then(obj => distribute(obj));
}

function distribute(obj) {
  if (obj.start === "Search for a product") {
    inquirer.prompt(search).then(obj => {
      queryProduct(obj.search);
    });
  } else if (obj.start === "Browse for a product") {
    inquirer.prompt(browse).then(obj => {
      queryBrowse(obj.browse);
    });
  } else if (obj.start === "Log in as a dealer") {
    console.log("code for logging in as a dealer goes here");
    start();
  } else if (obj.start === "Look at everything") {
    queryEverything();
  } else {
    connection.end();
    console.log("\n\t\t\tThanks for stopping by. Have a great day!\n\n");
  }
}

function handleError(err) {
  if (err) throw err;
}

function checkConnection() {
  connection.connect(err => {
    handleError(err);
    console.log(`connected as ${connection.threadId}`);
  });
}

function queryEverything() {
  var query = connection.query(
    "SELECT department_name, id, product_name, price FROM items ORDER BY department_name ASC, product_name ASC",
    (err, res) => {
      handleError(err);
      console.table(res);
    }
  );
  setTimeout(start, 500);
}

function returnOptions(item) {
  console.log(`Here's the item to search for: ${item} `);
  console.log(item);

  var query = connection.query(
    `SELECT * FROM items where product_name like '%${item}%'`,
    (err, res) => {
      handleError(err);
      buildQueryResults(res);
    }
  );
}

function queryInsert(obj) {
  var query = connection.query(
    "INSERT INTO items SET ?",
    {
      product_name: obj.name,
      department_name: obj.equipment_category,
      price: getMSRP(obj),
      stock_quantity: getQuantity(obj)
    },
    (err, res) => {
      handleError(err);
    }
  );
}

function buildQueryResults(res) {
  return new Promise(function(resolve, reject) {
    for (const key in res) {
      if (res.hasOwnProperty(key)) {
        const element = res[key];
        //console.log(element);
        queryResults.array.push(
          `${element.id} ${element.product_name}\t\tPrice: ${Math.floor(
            element.price
          )} gp`
        );
        queryResults.results.push(element);
      }
    }
    resolve(queryResults);
    reject(handleError);
  });
}

function purchaseDecision() {
  return new Promise(function(resolve, reject) {
    //console.log(`queryResult.array = ${queryResults.array}`);
    resolve(
      inquirer.prompt(getChoice).then(obj1 => {
        inquirer.prompt(howMany).then(obj => {
          makePurchase(getItem(obj1), obj);
        });
      })
    );
  });
}

async function queryProduct(item) {
  let query = connection.query(
    `SELECT * FROM items where product_name like '%${item}%'`,
    (err, res) => {
      getErDone(err, res);
    }
  );
}

async function getErDone(err, res) {
  handleError(err);
  await clearQuery();
  await buildQueryResults(res);
  purchaseDecision();
  //console.log(clear);
  //console.log(queryResults.array.length);
  //console.log(build);
  //console.log(purchase);
}

function clearQuery() {
  return new Promise(function(resolve, reject) {
    if (queryResults.array.length !== 0) {
      for (let i = 0; i < queryResults.array.length; i++) {
        //console.log(queryResults.array.length);
        queryResults.array.pop();
        queryResults.results.pop();
      }
    }
    if (queryResults.array.length === 0) {
      //console.log("clearQuery is finally all done.");
    }
    resolve(queryResults);
    reject(handleError);
  });
}

function queryBrowse(item) {
  return new Promise(function(resolve, reject) {
    var query = connection.query(
      `SELECT * FROM items where department_name = ${item}`,
      (err, res) => {
        getErDone(err, res);
      }
    );
  });
}

function getItem(obj) {
  var target = queryResults.array.indexOf(obj.item);
  //console.log(queryResults.array);
  //console.log(queryResults.results[target]);
  //console.log(queryResults.results[target].price);
  return queryResults.results[target];
}

function makePurchase(item, quantity) {
  //console.log(item);
  if (parseInt(item.stock_quantity) < parseInt(quantity.number)) {
    console.log(
      `There are not enough units of ${
        item.product_name
      } to satisfy your order of ${quantity.number} units.`
    );
    if (parseInt(item.stock_quantity) !== 0) {
      console.log(
        `Would you like to purchase the remaining ${
          item.stock_quantity
        } units we have remaining?`
      );
      inquirer
        .prompt([{ type: "list", name: "decision", choices: ["Yes", "No"] }])
        .then(obj => executeOrder(obj));
    } else {
      console.log(
        `We currently have 0 units in stock of ${
          item.product_name
        }. Please check back later to see if we have any to offer. We're so sorry for the inconvenience.`
      );
      clearQuery();
      setTimeout(start, 3000);
    }
  } else {
    var sum = parseInt(quantity.number) * parseInt(item.price);
    // console.log(`quantity is ${quantity.number}; parseInt(quantity) is ${parseInt(quantity.number)}; item.price //is ${item.price}; parseInt(item.price) is ${parseInt(item.price)}`
    // );
    console.log(
      `The purchase will cost ${sum} gp.\nDo you still want to make the purchase?`
    );
    inquirer
      .prompt([{ type: "list", name: "decision", choices: ["Yes", "No"] }])
      .then(obj => executeOrder(item, quantity.number, obj));
  }
}

function executeOrder(item, quantity, obj) {
  if (obj.decision === "Yes") {
    var sum = parseInt(item.stock_quantity) - parseInt(quantity);

    var query = connection.query(
      "UPDATE items SET ? where ?",
      [
        {
          stock_quantity: sum
        },
        {
          id: item.id
        }
      ],
      (err, res) => {
        handleError(err);
      }
    );

    console.log(
      `Your order of ${quantity} ${
        item.product_name
      } has successfully gone through. Your account will be debited ${quantity *
        item.price} gp.`
    );
    clearQuery();
    setTimeout(start, 3000);
  } else {
    console.log("Order cancelled. Returning to the main menu.");
    clearQuery();
    setTimeout(start, 3000);
  }
}

/////////////////////////////////////////////////////////////////////
/////////// Run the program                         ////////////////
///////////////////////////////////////////////////////////////////

let clear = clearQuery();
clear.then(start);
