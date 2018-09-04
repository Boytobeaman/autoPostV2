var url = require('url');
var wordpress = require("wordpress");
var _ = require('lodash');
var moment = require('moment');
var request = require('request');
var rp = require('request-promise');
var MongoClient = require('mongodb').MongoClient;
const getLinkStr = require('./getLinks');
require('dotenv').config();
var env = process.env;
var mongodb_url = env.mongodb_url;
let api_root_path = 'http://localhost:1338'

let api_header_obj = {}


let all_keywords = []
let keyword_path = '/keyword'

let all_cats = []
let cats_path = '/category'

let all_domains = []
let domain_path = '/domain'

let desc_path = '/description'
let url_path = '/url'
let all_urls=[]

var auth_options = {
  method: 'POST',
  url: env.auth_url,
  form: {
    'identifier': env.auth_username,
    'password': env.auth_password
  }
};

var CronJob = require('cron').CronJob;
new CronJob('00 * * * * *', function () {
  rp(auth_options)
    .then(function (response) {
      console.log(`Got jwt==================${JSON.parse(response).jwt}`)
      return JSON.parse(response).jwt
    })
    .then(function (jwt) {
      api_header_obj.Authorization = `Bearer ${jwt}`
      Promise
        .all([rp({
          method: 'GET',
          uri: api_root_path + keyword_path,
          headers: api_header_obj
        }), rp({
          method: 'GET',
            uri: `${api_root_path}${cats_path}?lan=en`,
          headers: api_header_obj
        }), rp({
          method: 'GET',
          uri: api_root_path + domain_path,
          headers: api_header_obj
        }), rp({
          method: 'GET',
          uri: api_root_path + url_path,
          headers: api_header_obj
        })])
        .then(function (results) {
          all_keywords = JSON.parse(results[0])
          all_cats = JSON.parse(results[1])
          all_domains = JSON.parse(results[2])
          all_urls = JSON.parse(results[3])
          MongoClient.connect(mongodb_url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("mynewstrapi");
            async function getDescriptions(total_promote_cat) {
              for (let cat of total_promote_cat) {
                const response = await dbo.collection("description").aggregate([{
                  $match: {
                    category: cat.name
                  }
                }, {
                  $sample: {
                    size: all_domains.length*5
                  }
                }])
                  .toArray()
                cat.descriptions = response

              }
              return total_promote_cat
            }
            const total_promote_cat_with_desc = getDescriptions(all_cats)
            total_promote_cat_with_desc.then((res) => {
              all_cats = res
              if (all_domains.length > 0) {
                for (let index = 0; index < all_domains.length; index++) {
                  const this_domain = all_domains[index];
                  let post_title;
                  if (this_domain.login_url && this_domain.login_username && this_domain.login_password && this_domain.auto_post) {
                    let published_keyword = this_domain.published_keyword
                    let un_published_keyword = _.differenceBy(all_keywords, published_keyword, "id")
                    if (un_published_keyword.length > 0) {
                      let selected_keyword_obj = _.sample(un_published_keyword)
                      post_title = selected_keyword_obj.name
                      //update relation for this domain and keyword
                      published_keyword.push(selected_keyword_obj)
                      let link_content = getLinkStr.links(this_domain.login_url, all_cats, all_urls);


                      link_content = `${post_title} ${link_content}`;
                      console.log(`to post for (${this_domain.login_url})`)
                      let post = {}
                      post.title = post_title;
                      post.content = link_content
                      post.status = "publish"
                      let subtract_minutes = _.random(0, 120)
                      post.date = moment().subtract(subtract_minutes, 'minutes').format();
                      let post_category
                      if (this_domain.postNewsCats && this_domain.postNewsCats.length > 0) {
                        post_category = [_.sample(this_domain.postNewsCats).catName]
                      } else {
                        post_category = ["plastic crates"]
                      }
                      post.termNames = {
                        "category": post_category,
                      }

                      var WP_client = wordpress.createClient({
                        url: this_domain.login_url,
                        username: this_domain.login_username,
                        password: this_domain.login_password
                      });
                      console.log(JSON.stringify(post))
                      // WP_client.newPost(post, function (err, id) {
                      //   if (err) {
                      //     console.log(err)
                      //     return
                      //   }
                      //   console.log(`new post id:${id} for website:${this_domain.login_url} time: ${new Date()}`)
                      //   rp({
                      //     method: 'PUT',
                      //     uri: api_root_path + domain_path + "/" + this_domain.id,
                      //     headers: api_header_obj,
                      //     body: {
                      //       published_keyword: published_keyword
                      //     },
                      //     json: true
                      //   })
                      //     .then(function (res) {
                      //       console.log(`link keyword (${selected_keyword_obj.name}) and domain (${this_domain.name}) success`)
                      //     })
                      //     .catch(function (err) {
                      //       console.log(err.message)
                      //     });
                      // })
                    } else {
                      console.log(`all keywords had been post for domain (${this_domain.name}),please add keywords!`)
                    }
                  } else {
                    console.log(`cannot login to this domain (${this_domain.name}),please setup login info!`)
                  }
                }
              }
            })
          })
          


          
        })
        .catch(function (err) {
          console.log(err.message)
        });
    })
    .catch(function (err) {
      console.log(err.message)
    })
}, null, true, 'Asia/Shanghai')





























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