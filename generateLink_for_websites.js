var url = require('url');
var _ = require('lodash');
var rp = require('request-promise');
var mysql = require('mysql');
const getLinkStr = require('./getLinks');
require('dotenv').config();
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

let domain_path = '/domain'

let url_path = '/url'
let all_urls=[]

// things you need to change
// 左右是为产品加上内链
//* post_domain (要发产品的域名)
//* post_cat (这个域名的这个分类的链接)
//* table_name (在phpMyAdmin 里面的存放某类产品的 表名)

//best-boxes.com
// let post_domain = `5c2358d62619eb1bd3f27c88`

//vegcrates.com
let post_domain = `5b87f56f28c4340ac80bc5f5`
let post_cat = `https://www.vegcrates.com/product-category/euro-containers/`
let post_internal_link_num = 4
//backlinks will insert into this table
let table_name = `vegcrates_com_stackingcrate_`

// things you need to care about (post_domain,post_cat,table_name)

var con = mysql.createConnection({
  host: "106.15.204.243",
  user: "root",
  password: "ABCsujie168168",
  database: "nodedb"
});


var auth_options = {
  method: 'POST',
  url: `${api_root_path}${auth_url}`,
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
    Promise
      .all([rp({
        method: 'GET',
          uri: `${api_root_path}${cats_path}?lan=${filter_lan}`,
          headers: api_header_obj
      })])
      .then(function (results) {
        all_cats = JSON.parse(results[0])

        function generate_internal_link(){
          all_cats = _.shuffle(all_cats)
          let internal_linked_num = 0
          let internal_link_str = `You may also interested in `
          for (let i = 0; i < all_cats.length; i++) {
            let this_cat = all_cats[i]
            let this_cat_urls = this_cat.urls
            let matched_url_obj = _.find(this_cat_urls,{"domain":post_domain})
            if(matched_url_obj && matched_url_obj.url != post_cat && internal_linked_num< post_internal_link_num ){
              if(this_cat.keyword.length == 0){
                console.log(`no keyword for cat (${this_cat.name})`)
                continue
              }
              internal_link_str += `<a href="${matched_url_obj.url}" target="_blank">${_.sample(this_cat.keyword).name}</a>,`
              internal_linked_num += 1
            }
          }
          internal_link_str = internal_link_str.slice(0, -1)
          return internal_link_str
        }
        con.connect(function (err) {
          if (err) throw err;
          console.log("Mysql Connected!");
          
          let sql = `SELECT * FROM ${table_name}`
          con.query(sql, function (err, result) {
              if (err) throw err;
              if(result && result.length>0){
                let insertNumber = 0;
                for (let j = 0; j < result.length; j++) {
                  let backlinks = generate_internal_link()
                  let insert_sql = `UPDATE ${table_name} SET backlinks='${backlinks}' WHERE id=${result[j].id}`
                  con.query(insert_sql, function (err, result) {
                    if (err) throw err;
                    insertNumber++
                    console.log("Number of records inserted: " + insertNumber);
                    return result.affectedRows
                  });
                }
              }
            });
        })

      })
      .catch(function (err) {
        console.log(err.message)
      });
  })
  .catch(function (err) {
    console.log(err.message)
  })
