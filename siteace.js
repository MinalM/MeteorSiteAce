Websites = new Mongo.Collection("websites");
Comments = new Mongo.Collection("comments");
// set up a schema controlling the allowable 
// structure of comment objects
Comments.attachSchema(new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  body:{
    type: String,
    label: "Comment",
    max: 1000  	
  },
  websiteid:{
  	type: String, 
  }, 
  owner:{
  	type: String, 
  }, 
  
}));

if (Meteor.isClient) {

	Router.configure({layoutTemplate:'ApplicationLayout', loadingTemplate: 'spinner'});

	Router.route('/', function () {
	  this.render('navbar',{to: "navbar"});
	  this.render('website_combo', {to: "main"});
	});

	Router.route('/details/:_id', function () {
	  this.render('navbar',{to: "navbar"});
	  this.render('website_detail', {
	  	to: "main",
	  	data: function(){
	  		return Websites.findOne({_id:this.params._id});
	  	}
	  });
	});

	/////
	// template helpers 
	/////

	Template.navbar.helpers({
	  settings: function() {
	    return {
	      position: "bottom",
	      limit: 5,
	      rules: [
	        {
	          collection: Websites,
	          field: "description",
	          template: Template.searchResult,
	          matchAll:true
	        },
	        {
	          collection: Websites,
	          field: "title",
	          template: Template.searchResult,
	          matchAll:true
	        },
	      ]
	    };
	  }
	});

	// helper function that returns all available websites
	Template.website_list.helpers({
		websites:function(){
			return Websites.find({},{sort:{"upVotes.count":-1}});
		}
	});

// helper function that returns all available websites
	Template.website_detail.helpers({
		getSite:function(id){
			return Websites.findOne({_id:id});
		}
	});

	Template.commentList.helpers({
	  // find all comments for current doc
	  comments:function(id){
	    return Comments.find({websiteid:id});
	  }
	})

	//////
	///accounts config
	//////
	Accounts.ui.config({passwordSignupFields: "USERNAME_AND_EMAIL"});
	/////
	// template events 
	/////

	Template.website_item.events({
		"click .js-upvote":function(event){
			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			console.log("Up voting website with id "+website_id);
			var site = Websites.findOne({_id:website_id});
			// if($.inArray(Meteor.user()._id, site.upVotes.userIds))
			// {
			// 	console.log(site.upVotes.userIds);
			// 	var userIdArray = site.upVotes.userIds.concat(Meteor.user()._id);
			// }
			// else{alert('User already upVoted this site');}
			// put the code in here to add a vote to a website!
			if(site.upVotes){
				Websites.update({_id:website_id},{$set: {"upVotes.count":site.upVotes.count + 1, totalVotes: site.totalVotes+1}});
			}
			else{
				var website ={  title: site.title, url: site.url, description: site.description,
								createdOn:site.createdOn,createdBy:site.createdBy,
								upVotes: {count:1, userIds:{}}, downVotes: {count:0, userIds:{}}, totalVotes:1};
				Websites.upsert({_id:website_id}, website);}
			return false;// prevent the button from reloading the page
		}, 
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			console.log("Down voting website with id "+website_id);

			// put the code in here to remove a vote from a website!
			var site = Websites.findOne({_id:website_id});
			if(site.downVotes){
				Websites.update({_id:website_id},{$set: {"downVotes.count":site.downVotes.count + 1, totalVotes: site.totalVotes-1}});
			}
			else{
				var website ={  title: site.title, url: site.url, description: site.description,
								createdOn:site.createdOn,createdBy:site.createdBy,
								upVotes: {count:0, userIds:{}}, downVotes: {count:1, userIds:{}},totalVotes:-1};
				Websites.upsert({_id:website_id}, website);}
			return false;// prevent the button from reloading the page
		}
	})
	Template.website_single_item.events({
		"load .js-onload": function(event){
			console.log("image on load called");
		}
	});
	Template.website_form.events({
		"click .js-toggle-website-form":function(event){
			$("#website_form").modal('show');
		}, 
		'focusout .js-url-focusout': function(e) {
		    console.log("focusout: " + e.target.value);
		    var method = 'Get';
		    var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22"+e.target.value+"%22%20and%20xpath%3D'%2F%2Ftitle%7C%2F%2Fmeta'&format=json&callback=";
		    console.log("url is " + url);
		    var options = {
		        headers: {"Content-Type": "application/json"}
		    }
		    $('#submit').hide();
		    $('#submitload').show();
		 	Meteor.call('APICall', method, url, options, function (error, result) {
		        if (error) {
		          console.log('CLIENT ERRR');
		          console.log(error);
		        } else {
		          var content = JSON.parse(result);
		          console.log(content.query);
		          console.log(content.query.results.meta.length);
		          var desc="";
		          if(content.query.results.length != 0){
			          for(var i=0; i< content.query.results.meta.length; i++)
			          {
			          	if(content.query.results.meta[i].name){
			          		if(content.query.results.meta[i].name=="description"){
			          			desc =content.query.results.meta[i].content;
			          		}
						}
			          }
			          var title = content.query.results.title;
			          var title_escape = encodeURIComponent(title);
			          var desc_escape = encodeURIComponent(desc);
			          console.log(decodeURIComponent(title));
			          console.log(decodeURIComponent(desc_escape));
			          $('#title').val($("<div/>").html(decodeURIComponent(title_escape)).text());
			          $('#description').val($("<div/>").html(decodeURIComponent(desc)).text());
			      }
		          $('#submitload').hide();
		          $('#submit').show();
	        	}
      		});
		},
		"submit .js-save-website-form":function(event){

			// here is an example of how to get the url out of the form:
			var url = event.target.url.value;
			console.log("The url they entered is: "+url);
			
			//  put your website saving code in here!	
			if(!Meteor.user())
				{alert('Not a signed in user');}
			if(event.target.url.value && event.target.description.value){
				Websites.insert({
    				title:event.target.title.value, 
		    		url:event.target.url.value, 
		    		description:event.target.description.value, 
		    		createdOn:new Date(),
		    		upVotes:{count:0, userIds:{}},
		    		downVotes:{count:0, userIds:{}},
		    		totalVotes: 0,
		    		createdBy:Meteor.user()._id
    			})
    			event.target.title.value = "";
    			event.target.url.value = "";
    			event.target.description.value = "";
    			$("#website_form").toggle('hide');
    			return true;
			}
			else{alert('Enter URL and Description')}
			return false;// stop the form submit from reloading the page

		}
	});
}


if (Meteor.isServer) {
	// start up function that creates entries in the Websites databases.
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Websites.findOne()){
    	console.log("No websites yet. Creating starter data.");
    	  Websites.insert({
    		title:"Goldsmiths Computing Department", 
    		url:"http://www.gold.ac.uk/computing/", 
    		description:"This is where this course was developed.", 
    		createdOn:new Date()
    	});
    	 Websites.insert({
    		title:"University of London", 
    		url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route", 
    		description:"University of London International Programme.", 
    		createdOn:new Date()
    	});
    	 Websites.insert({
    		title:"Coursera", 
    		url:"http://www.coursera.org", 
    		description:"Universal access to the world’s best education.", 
    		createdOn:new Date()
    	});
    	Websites.insert({
    		title:"Google", 
    		url:"http://www.google.com", 
    		description:"Popular search engine.", 
    		createdOn:new Date()
    	});
    }
  });

Meteor.methods({
  // adding new comments
  addComment:function(comment){
    console.log("addComment method running!");
    if (this.userId){// we have a user
      comment.owner = Meteor.user().username;
        return Comments.insert(comment);
    }
    return;
  },
  APICall: function (method, url, options) {
    var result = HTTP.call(method, url, options);
	console.log(result.content); 
    return result.content;
  }

 });
}

