var url = require('url');

require('dotenv').config();
var env = process.env;
let api_root_path = 'http://localhost:1338'

var url = env.mongodb_url;

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  console.log("Database created!");
  var dbo = db.db("joinplastic");
  // count number of the documents matched
  dbo.collection("descriptions").find({},
    {
      projection: { description: 1, _id: 0 }
    }).toArray(function (err, result) {
      if (err) throw err;
      console.log(result)
      var db_mynewstrapi = db.db("mynewstrapi");
      if (result.length > 0) {
        db_mynewstrapi.collection("description").insertMany(result)
      }
      db.close();
    });
});




























// let proviteInfo = require("./toPostWebsiteInfo");
// let toPostWebsite = proviteInfo.toPostWebsiteInfo;
// // to get customize links for other sites
// // promotion category like folding/stacking/pallet box/moving dolly
// var total_promote_cat = [];

// var foldingcrates_OBJ = require('./keywords/foldingcrates');
// total_promote_cat.push(foldingcrates_OBJ)

// var stackingcrates_OBJ = require('./keywords/stackingcrates');
// total_promote_cat.push(stackingcrates_OBJ)

// var palletbox_OBJ = require('./keywords/palletbox');
// total_promote_cat.push(palletbox_OBJ)

// var movingcrates_OBJ = require('./keywords/movingcrates');
// total_promote_cat.push(movingcrates_OBJ)

// var movingdolly_OBJ = require('./keywords/movingdolly');
// total_promote_cat.push(movingdolly_OBJ)


// const getLinkStr = require('./getLinks');

// var MongoClient = require('mongodb').MongoClient;
// var mongodb_url = proviteInfo.mongodb_url;

// MongoClient.connect(mongodb_url, function (err, db) {
//     if (err) throw err;
//     var dbo = db.db("joinplastic");
//     var CronJob = require('cron').CronJob;
//     new CronJob('00 */60 */9 * * *', function () {
//         console.log('You will see this message every ');
//         toPostWebsite.forEach(website=>{
//             async function getDescriptions(total_promote_cat) {
//                 for (let cat of total_promote_cat) {
//                     const response = await dbo.collection("descriptions").aggregate([{
//                         $match: {
//                             category: cat.description_category
//                         }
//                     }, {
//                         $sample: {
//                             size: 30
//                         }
//                     }])
//                         .toArray()
//                     cat.descriptions = response

//                 }
//                 return total_promote_cat


//             }
//             const total_promote_cat_with_desc = getDescriptions(total_promote_cat)
//             total_promote_cat_with_desc.then((res) => {

//                 const output = getLinkStr.links(website.login.url, res)
//                 console.log(output.title)
//                 console.log(output.content)


//                 let post = Object.assign({}, output)

//                 post.status = "publish"
//                 post.termNames = {
//                     "category": [_.sample(website.category)],
//                 }

//                 var WP_client = wordpress.createClient({
//                     url: website.login.url,
//                     username: website.login.username,
//                     password: website.login.password
//                 });
//                 WP_client.newPost(post, function (err, id) {
//                     if (err) {
//                         console.log(err)
//                         return
//                     }
//                     console.log(`new post id:${id} for website:${website.login.url} time: ${new Date()}`)
//                 })

//             })
//         })


//     }, null, true, 'Asia/Shanghai');

// });