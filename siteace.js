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

// if (Meteor.isClient) {

// }


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

