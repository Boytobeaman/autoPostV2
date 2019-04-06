const tools = require('./tools')
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
require('dotenv').config();
var env = process.env;
var mongodb_url = env.mongodb_url;


module.exports = function(json_path,cat){
  if(!json_path || !cat){
    console.error(`no json file path or category`)
  }
  let json_obj = require(json_path)
  if(json_obj.answer && json_obj.answer.results && json_obj.answer.results.keyword_results){
    let keyword_results = json_obj.answer.results.keyword_results
    let all_desc_results = []
    keyword_results.forEach(element => {
      all_desc_results= all_desc_results.concat(element.results_organic)
    });
    all_desc_results = all_desc_results.map(item=>{
      let obj = {}
      obj.description = tools.clearnStr(item.description)
      obj.category = cat
      return obj
    })
    MongoClient.connect(mongodb_url, function (err, db) {
      if (err) throw err;
      console.log("Database created!");
      let result = all_desc_results
      var the_db = db.db(env.db_name);
      if (result.length > 0) {
        var chunk_result = _.chunk(result, 5000)
        function insert(i) {
          if (i>=chunk_result.length) {
            db.close();
            return 'success'
          }
          the_db.collection("description").insertMany(chunk_result[i], function (err, res) {
            if (err) throw err;
            console.log("Number of documents inserted: " + res.insertedCount);
            insert(++i)
          })
        }
        insert(0)
      }
    });
  }
}





