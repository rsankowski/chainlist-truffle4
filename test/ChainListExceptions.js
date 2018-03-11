// load contract to be tested
var ChainList = artifacts.require("./ChainList.sol");

//test suite
contract("ChainList", function(accounts) {
  //define vars
  var chainListInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articleName = "article 1";
  var articleDescription = "Description for article 1";
  var articlePrice = 10;

  //these test cases check the requirements in the buyArticle Smart contract
  //no article for sale yet
  it("should throw an exception if you buy an article when there is no article for sale yet", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
    return chainListInstance.buyArticle(1, { //we now need to add the article id we call the buyArticle fucntion before there is an article to sell
      from: buyer,
      value: web3.toWei(articlePrice, "ether")
    });
  }).then(assert.fail) // we assert here that trying to buy an article without one being sold will fail
  .catch(function(error) {
    assert(true);
  }).then(function() {
    return chainListInstance.getNumberOfArticles(); //this will return us the contract state to see that nothing has chainged
  }).then(function(data) {
    assert.equal(data.toNumber(), 0, "number of articles must be 0"); //these are chai assertions
  });
  });

  //buy an article that does not exist
  it("should throw an exception if you try to buy an article that does not exist", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"),{from: seller});
    }).then(function(receipt) {
      return chainListInstance.buyArticle(2,
        {from: seller,
          value: web3.toWei(articlePrice, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return chainListInstance.articles(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article ID must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));

    });
  });

  //buying an article that youre selling
  it("should throw an exception if you try to buy an article that you're selling", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;

      return chainListInstance.buyArticle(1, {from: seller, value: web3.toWei(articlePrice, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return chainListInstance.articles(1); //we check the state of the first article to make sure that data is the same as it was before
      assert.equal(data[0].toNumber(), 1, "article ID must be 1"); //these are chai assertions
      assert.equal(data[1], seller, "seller must be " + seller); //these are chai assertions
      assert.equal(data[2], 0x0, "buyer must be empty"); //these are chai assertions
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });

  //incorrect value
  it("should throw an exception if you try to buy an article for a value different from its price", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice + 1, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return chainListInstance.articles(1); //we call the articles() getter to make sure the state of the article has not changed
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article ID must be 1"); //these are chai assertions
      assert.equal(data[1], seller, "seller must be " + seller); //these are chai assertions
      assert.equal(data[2], 0x0, "buyer must be empty"); //these are chai assertions
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });

  //article already sold
  it("should throw an exception if you try to buy an article that has already been sold", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice, "ether")});
    }).then(function() {
      return chainListInstance.buyArticle(1, {from: web3.eth.accounts[0], value: web3.toWei(articlePrice, "ether")}); //the buy functio is called twice
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return chainListInstance.articles(1); //this will return us the contract state to see that nothing has chainged
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article ID must be 1"); //these are chai assertions
      assert.equal(data[1], seller, "seller must be " + seller); //these are chai assertions
      assert.equal(data[2], buyer, "buyer must be " + buyer); //these are chai assertions
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });

});
