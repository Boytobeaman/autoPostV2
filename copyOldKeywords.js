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
let filter_lan = 'english'

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
    console.log(`Got jwt==================${JSON.parse(response).jwt}`)
    return JSON.parse(response).jwt
  })
  .then(function (jwt) {
    api_header_obj.Authorization = `Bearer ${jwt}`
    rp({
      method: 'GET',
      uri: `${api_root_path}${cats_path}?lan=${filter_lan}`,
      headers: api_header_obj
    }).then(function (cats) {
      let all_cats = JSON.parse(cats)

      MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        console.log("Database created!");
        var dbo = db.db("joinplastic");
        // count number of the documents matched

        let keyword_cat = "pallet"

        dbo.collection("keywords").find({ "category":  keyword_cat},
          {
            projection: { updatedAt: 0, create_time: 0, _id: 0 }
          }).toArray(function (err, result) {
            if (err) throw err;
            console.log(result)
            db.close();
            let finished_number = 0;
            if (result.length > 0) {
              let cat_obj = _.find(all_cats, { "name": keyword_cat})
              function insert(keyword_obj, callback) {
                rp({
                  method: 'POST',
                  uri: api_root_path + keyword_path,
                  headers: api_header_obj,
                  body: {
                    name: keyword_obj.keyword,
                    isGood: keyword_obj.isGood,
                    isEasy: keyword_obj.isEasy,
                    owner: keyword_obj.owner,
                    ali_rank: keyword_obj.ali_rank,
                    category: cat_obj,
                  },
                  json: true
                })
                  .then(function (res) {
                    finished_number+=1;
                    console.log(`insert ${finished_number} of ${result.length}`)
                    callback(null,[res])
                  })
                  .catch(function (err) {
                    console.log(err.message)
                    finished_number += 1;
                    console.log(`err!!! insert ${finished_number} of ${result.length}`)
                    callback(null, [err])
                  });
              }
              async.mapLimit(result, 30, function (keyword_obj, callback) {
                insert(keyword_obj, callback);
              }, function (err, result) {
                if (err) {
                  console.log(err)
                  return
                }
                console.log(`all keyword of cat (${keyword_cat}) finished!`)
                return
              })
            }
          });
      });
    })
    
  })
  .catch(function (err) {
    console.log(err.message)
  })


