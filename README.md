# bamazon

The bamazon app deploys a mySql database to allow a user to play around with buying goods from the 5h Edition of Dungeons and Dragons.

To see the app in action, watch this: https://youtu.be/pZ4axnuDoD4.

The bamazon app uses the inquirer node package to prompt users for how they would like to interact with the data. The options are:

1. View Everything - shows the entire table of data
2. Search - allows a text search of items in the table
3. Browse by category - loads a list of all the items in the table by the chosen category
4. Log in as a Dealer - allows the user to log in and access management function (NOT DEPLOYED)

Using inquirer, the user walks through the selection and purchasing decision in an intuitive manner. If there isn't enough inventory available, the user is told as much. If the purchase is made, the total amount is displayed and the user is allowed to confirm or reject the purchase. After a purchase decision has been finalized, the app cycles back to the main menu.
