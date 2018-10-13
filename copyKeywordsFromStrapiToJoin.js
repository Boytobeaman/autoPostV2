var url = require('url');
var async = require('async');
var request = require('request');
var rp = require('request-promise');
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
require('dotenv').config();
var env = process.env;
let api_root_path = env.api_root_path
let keyword_path = '/keyword'
let cats_path = '/category'
let api_header_obj = {}

var url = env.mongodb_url;
var auth_options = {
  method: 'POST',
  url: env.auth_url,
  form: {
    'identifier': env.auth_username,
    'password': env.auth_password
  }
};
rp(auth_options)
  .then(function (response) {
    console.log(`Got jwt======${JSON.parse(response).jwt}`)
    return JSON.parse(response).jwt
  })
  .then(function (jwt) {
    api_header_obj.Authorization = `Bearer ${jwt}`
    rp({
      method: 'GET',
      uri: `${api_root_path}${keyword_path}?_limit=1000`,
      headers: api_header_obj
    }).then(function (res) {
      let keyword_cat = "stacking crate"
      let all_cat_keyword = JSON.parse(res)
      all_cat_keyword = all_cat_keyword.filter(item => item.category.name === keyword_cat)
      all_cat_keyword.map(item=>{
        item.category = keyword_cat
        delete item._id
        delete item.linked_urls
        delete item.published_domains
        delete item.to_promote_url
      })
      MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        console.log("Database created!");
        var dbo = db.db("joinplastic");
        // count number of the documents matched
        
        dbo.collection("keywords").insertMany(all_cat_keyword, function (err, res) {
          if (err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
          db.close();
        });
      });
     
    })
    
  })


