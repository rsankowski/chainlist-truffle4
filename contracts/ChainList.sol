pragma solidity ^0.4.18;

import "./Ownable.sol";

contract ChainList is Ownable {
//custom types
  struct Article {
    uint id;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }

  //state variables
  mapping (uint => Article) public articles;
  uint articleCounter;

  //events
  event LogSellArticle(
    uint indexed _id, // this needs to be added so the log returns the id of an article
    address indexed _seller, //this argument is indexed meaning it is possible to filter events based on the address on the client side; indexed arguments are like keys
    string _name,
    uint256 _price
    );

  event LogBuyArticle(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
    );


/*  // constructor - a constructor is a public function, has the same name as the contract, has no return value, it may have arguments or not
  // a constructor creates an article that has the same seller as the account that deploys the contract
  function ChainList() public {
    sellArticle("Default article", "This is an article set by default", 1000000000000000000);
  } the constructor is only needed if you're not able to create an article from the frontend

*/

  //deactivate the contract
  function kill() public onlyOwner {
    //only allow the contract owner
    require(msg.sender == owner);

    selfdestruct(owner);
  }

  //sell article
  function sellArticle(string _name, string _description, uint256 _price) public {
    // a new articles
    articleCounter++;

    //store this article
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price);


    LogSellArticle(articleCounter, msg.sender, _name, _price); //the prefix "_" indicates that a variable comes from function parameters
  }

  //fetch the number of articles in the contract
  function getNumberOfArticles() public view returns (uint) {
    return articleCounter;
  }

  //fetch and return all article IDs for articles still for sale
  function getArticlesForSale() public view returns (uint[]) { //this is a public view function and returns an array of uint; since its a view function calling it will be free
    //prepare output array
    uint[] memory articleIds = new uint[](articleCounter); // articleCounter defines the maximum size of the array; local arrays must be declared with a fixed size; the memory qualifier needs to be added since the default is to store it in storage and thats more expensive than storing it in memory

    uint numberOfArticlesForSale = 0;//define a local variable

    //iterate over articles
    for (uint i = 1; i <= articleCounter; i++) {
      //keep the ID if the article is still for sale
      if(articles[i].buyer == 0x0) {
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;
      }
    }

    //copy articleIds array into a smaller for sale array
    uint[] memory forSale = new uint[](numberOfArticlesForSale);
    for (uint j = 0; j < numberOfArticlesForSale; j++) {
      forSale[j] = articleIds[j];
    }
    return forSale;
  }

  //buy an Article
  function buyArticle(uint _id) payable public { //function is payable meaning it can receive ether
    //we make sure that there is an article for sale
    require(articleCounter > 0); //this is being added since the seller doesnt exist in this function any more

    //check that article exists
    require(_id > 0 && _id <= articleCounter); //theres no id ==0

    //retrieve the article from the mapping
    Article storage article = articles[_id]; //this is to retrieve the article information for the require statements below; you have to explicitly state the storage property otherwise the compiler will return a warning

    //we check that the article has not been sold yet
    require(article.buyer == 0x0);

    //we dont allow the seller to buy his own Article
    require(msg.sender != article.seller);

    //we check that the value sent corresponds to the price of the Article
    require(msg.value == article.price);

    //keep buyer's information
    article.buyer = msg.sender; // it is good practice to update the state of the system before sending money even if it means that the state has to be corrected id the transaction fails

    //the buyer can pay the seller
    article.seller.transfer(msg.value); // the payment is conducted

    //trigger the event
    LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
  }
}
