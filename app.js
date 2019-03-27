var url = require('url');
var wordpress = require("wordpress");
var _ = require('lodash');
var moment = require('moment');
const probe = require('probe-image-size');
var rp = require('request-promise');
var MongoClient = require('mongodb').MongoClient;
const getLinkStr = require('./getLinks');
require('dotenv').config();
const tools = require('./tools')
var env = process.env;
var mongodb_url = env.mongodb_url;
let api_root_path = env.api_root_path
let db_name = env.db_name

let search_limit = 1000
let filter_lan = 'english'

let api_header_obj = {}

let auth_url = '/auth/local'

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
  url: `${api_root_path}${auth_url}`,
  form: {
    'identifier': env.auth_username,
    'password': env.auth_password
  }
};

let product_api_domin = 'http://products.50d.top';
let product_api_url = '/commonproduct/'
let product_limit = 1000
var products_auth_options = {
  method: 'POST',
  url: `${product_api_domin}${auth_url}`,
  form: {
      'identifier': process.env.product_username,
      'password': process.env.product_pwd
  },
  json: true
};

let category_id_mapping={
  '5b8159cb9082b8306ce54260': 'folding crate',
  '5b8159b39082b8306ce5425f': 'nesting crate',
  '5b8159e49082b8306ce54261': 'stacking crate',
  '5b8159949082b8306ce5425e': 'plastic pallet box',
  '5c209b4659bec4163bb28ab8': 'storage bin',
  '5b94049adf72ba47fcaad4d9': 'plastic pallet',
  '5c235f0b1e1a161fd4adceaf': 'vegetable crate',
  '5c235a451e1a161fd4adcead': 'nestable storage tub'
}
function getCategoryById(id){
  if(!id || !category_id_mapping[id]){
    return tools.randomProperty(category_id_mapping)
  }
  return category_id_mapping[id]
}


var CronJob = require('cron').CronJob;
new CronJob('00 */3 * * * *', function () {
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
          uri: `${api_root_path}${keyword_path}?_limit=${search_limit}`,
          headers: api_header_obj
        }), rp({
          method: 'GET',
            uri: `${api_root_path}${cats_path}?lan=${filter_lan}`,
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

          rp(products_auth_options)
            .then(function (response) {
                  console.log(`Got product_jwt==================${response.jwt}`)
                  return response.jwt
            })
            .then(function (p_jwt) {
              // got random product
              console.log(`request for products list ....`)
              return rp({
                  method: 'GET',
                  uri: `${product_api_domin}${product_api_url}?_limit=${product_limit}`,
                  headers: {
                      Authorization: `Bearer ${p_jwt}`
                  },
                  json: true
                })
                .then(function (response) {
                  return response
                })
                .catch(function (err) {
                  console.log(err.message)
                })
            .then(function(products){
              console.log(`got products list (${products.length})`)
              let all_products = products
              MongoClient.connect(mongodb_url, function (err, db) {
                if (err) throw err;
                var dbo = db.db(db_name);
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
                  console.log(` --------------- loop domains start ---------------`)
                  if (all_domains.length > 0) {
                    for (let index = 0; index < all_domains.length; index++) {
                      const this_domain = all_domains[index];
                      let post_title;
                      if (this_domain.auto_post && this_domain.login_url && this_domain.login_username && this_domain.login_password && this_domain.auto_post) {
                        let published_keyword = this_domain.published_keyword
                        let un_published_keyword = _.differenceBy(all_keywords, published_keyword, "id")
                        if (un_published_keyword.length > 0) {
                          // arrange data for post
                          let selected_keyword_obj = _.sample(un_published_keyword)
                          post_title = selected_keyword_obj.name
                          published_keyword.push(selected_keyword_obj)
                          let link_content = getLinkStr.links(this_domain.login_url, all_cats, all_urls,post_title);
                          link_content = `<strong>${post_title}</strong> ${link_content}`;
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

                          // arrange data for image
                          let category_id = selected_keyword_obj.category._id
                          
                          let product_cat = getCategoryById(category_id)
                          let WP_client = wordpress.createClient({
                            url: this_domain.login_url,
                            username: this_domain.login_username,
                            password: this_domain.login_password
                          });

                          let random_product = _.sample(all_products.filter(item=>item.category === product_cat))
                          if(random_product.images && random_product.images.length>0){
                            let random_img_url = _.sample(random_product.images).url
                            probe(random_img_url).
                              then(result => {
                                console.log(`got image info like mime ${result.mime} for (${this_domain.login_url})`); // =>
                                return result
                              })
                              .then(function(result){
                                console.log(`prepare for upload image data for (${this_domain.login_url})`)
                                let data = {}
                                data.name = `${post_title.replace(/ +/g,"-")}.${result.url.split('.').pop()}`
                                data.type = result.mime
                                data.width = result.width
                                data.height = result.height
                                data.alt = post_title
                                let url = result.url
                                rp({url, encoding: null })
                                  .then(function (buffer) {
                                    data.bits = buffer
                                    // post image
                                    console.log(`uploading image ... for (${this_domain.login_url})`)
                                    WP_client.uploadFile( data, function(error, file){
                                      if(error){
                                        console.log(`Error!!!!(${this_domain.login_url})`, error)
                                        return
                                      }
                                      post.thumbnail = file.attachment_id
                                      console.log(`---SUCCESS--- post image for domain(${this_domain.login_url}) (${post_title})`)
                                      // post article and bind feature image
                                      // console.log(JSON.stringify(post))
                                      WP_client.newPost( post, function(err, res){
                                        if(err){
                                          console.log(`Error!!!!(${this_domain.login_url})`, error)
                                          return
                                        }
                                        console.log(`---SUCCESS--- new post id:${res} for domain:${this_domain.login_url} --- binded with image (${file.attachment_id}) (${file.file}) time: ${new Date()}`)
                                        //update relation for this domain and keyword
                                        rp({
                                          method: 'PUT',
                                          uri: api_root_path + domain_path + "/" + this_domain.id,
                                          headers: api_header_obj,
                                          body: {
                                            published_keyword: published_keyword
                                          },
                                          json: true
                                        })
                                          .then(function (res) {
                                            console.log(`link keyword (${selected_keyword_obj.name}) and domain (${this_domain.name}) success`)
                                          })
                                          .catch(function (err) {
                                            console.log(err.message)
                                          });
                                      })
                                      
                                    })
                                  })
                                  .catch(function (err) {
                                    console.log(`probe: get image info err`)
                                  });
                              })
                              .catch(function (err) {
                                console.log(err.message)
                              });
                          }
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
