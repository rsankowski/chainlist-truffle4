App = {
     web3Provider: null,
     contracts: {},
     account: 0x0, //initialize the account variable with a default address 0x0
     loading: false,

     init: function() {
          return App.initWeb3();
     },


     initWeb3: function() {
       //connect to the ehtereum blockchain using web3
          if (typeof web3 !== 'undefined') {
            //reuse the provider of the web3 object injected by metamask
            App.web3Provider = web3.currentProvider;
          } else {
            //create new provider and plug it directrly into our local currentProvider
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
          }
          web3 = new Web3(App.web3Provider); //initialize web3 pbject with whatever provider we created before

          App.displayAccountInfo();

          return App.initContract();
     },

     displayAccountInfo: function () {
       web3.eth.getCoinbase(function(err, account){ //this is an asynchronous function
         if (err === null) {
           App.account = account;
           $('#account').text(account); //display this information inside a div wiht the id account
           web3.eth.getBalance(account, function(err, balance){ //this is an asynchronous function
             if (err === null) {
               $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH") // this displays the account balance inside a div with the id #accountBalance converted to ether
             }
           })
         }
       }); //this connection is not dependent on the smart contracts so it can connect in parallel while smart contracts are being deployed


     },


     initContract: function() {
          $.getJSON('ChainList.json', function(chainListArtifact) {//the json file will be sent via a callback
            //get the contract artifact file and use it to instantiate a truffle contract abstraction
            App.contracts.ChainList = TruffleContract(chainListArtifact); //the ChainList.json file must be put at the root of the host so it can load asynchronously
            //the root of the application is defined under test/bs-config.json
            // set the provider for our contracts
            App.contracts.ChainList.setProvider(App.web3Provider); //the provider was defined in the initWeb3 function
            //listen to listenToEvents
            App.listenToEvents();
            //retrieve article from the contract
            return App.reloadArticles();
          })
     },

     reloadArticles: function() {
       //avoid reentry
       if (App.loading) {
         return;
       }
       App.loading = true;

       //refresh account information because the balance might have changed
       App.displayAccountInfo();

       var chainListInstance; //a new local variable


       App.contracts.ChainList.deployed().then(function(instance) { // here we call an instance of a smart contract
         chainListInstance = instance;
         return instance.getArticlesForSale(); //this will return an array with the ids of the articles for sale; this is asunchronous so we can chain another function to it
       }).then(function(articleIds) {
         //retrieve article placeholder and clear it
         $('#articlesRow').empty();

         for (var i = 0; i < articleIds.length; i++) {
           var articleId = articleIds[i];
           chainListInstance.articles(articleId.toNumber()).then(function(article) {
             App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
           });
         }
         App.loading = false; //switch the state of the loading variable
       }).catch(function(err) {
         console.error(err.message);
         App.loading = false; //keep loading variable false
       });
     },

     displayArticle: function(id, seller, name, description, price) {
       var articlesRow = $('#articlesRow'); //we retrieve the articlesRow details using jQuery

       var etherPrice = web3.fromWei(price, "ether"); //converting the price that we get into toWei

       var articleTemplate = $('#articleTemplate'); //we get the articleTemplate element form the page
       articleTemplate.find('.panel-title').text(name); //display the name of the article
       articleTemplate.find('.article-description').text(description); //display the description of the article
       articleTemplate.find('.article-price').text(etherPrice + " ETH"); //display the price of the article
       //add metadata to the buy button that will be retrieved when the button is clicked
       articleTemplate.find('.btn-buy').attr('data-id', id); //the id of the article will be saved as id data attribute upon clikcing the button
       articleTemplate.find('.btn-buy').attr('data-value', etherPrice); //the price will be saves as etherPrice attribute when clicking the button

       //seller
       if (seller == App.account) {
         articleTemplate.find('.article-seller').text("You"); //display the seller
         articleTemplate.find('.btn-buy').hide(); //the buy button is hidden if the seller is looking at the article
       } else {
        //if the one looking at the article is not the seller
         articleTemplate.find('.article-seller').text(seller); //display the seller
         articleTemplate.find('.btn-buy').show();
       }

       //add new article to the list of articles
       articlesRow.append(articleTemplate.html());
     },

     sellArticle: function() {
       //retrieve the details from the article from the modat dialog where you insert the details
       var _article_name = $('#article_name').val(); //article name is the value of the article_name field
       var _description = $('#article_description').val();
       var _price = web3.toWei(parseFloat($('#article_price').val() || 0), "ether"); // parse the value typed in the model, of no value typed then the default value is 0

       if ((_article_name.trim() == '') || (_price == 0)) {
         //nothing to sell
         console.log("something false");
         return false;
       }

       App.contracts.ChainList.deployed().then(function(instance) {
         return instance.sellArticle(_article_name, _description, _price, {
           from: App.account,
           gas: 500000
         });
       }).then(function(result) {

         }).catch(function(err) {
         console.error(err);
       });
     },

     //listen to events triggered by the contract
     listenToEvents: function() {
       App.contracts.ChainList.deployed().then(function(instance) {
         instance.LogSellArticle({}, {}).watch(function(error, event) {
           if (!error) {
             $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
           } else {
             console.error(error);
           }
           App.reloadArticles();
         });

         instance.LogBuyArticle({}, {}).watch(function(error, event) {
           if (!error) {
             $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
           } else {
             console.error(error);
           }
           App.reloadArticles();
         });
       });
     },

     buyArticle: function() {
       event.preventDefault();

       // retrieve the article price
       var _articleId = $(event.target).data('id'); //event.target will return the data from the button clicked
       var _price = parseFloat($(event.target).data('value'));

       App.contracts.ChainList.deployed().then(function(instance){
         return instance.buyArticle(_articleId ,{
           from: App.account,
           value: web3.toWei(_price, "ether"),
           gas: 500000
         });
       }).catch(function(error) {
         console.error(error);
       });
     }
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
