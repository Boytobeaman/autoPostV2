
var rp = require('request-promise');
var fs = require('fs');

require('dotenv').config();
var env = process.env;
const tools = require('./tools')


let api_root_path = env.api_root_path
let output_folder = './outputKeywords'

let auth_url = '/auth/local'
let keyword_path = '/keyword'

let search_limit = 1000


let api_header_obj = {}

let keywords_category_id_mapping= require('./config/keywords_category_id_mapping.json')

function getCategoryByName(name){
  if(!name || !keywords_category_id_mapping[name]){
    return tools.randomProperty(keywords_category_id_mapping)
  }
  return keywords_category_id_mapping[name]
}

var auth_options = {
  method: 'POST',
  url: `${api_root_path}${auth_url}`,
  form: {
    'identifier': env.auth_username,
    'password': env.auth_password
  },
  json: true
};

module.exports = function(keyword_cat){
  if(!keyword_cat){
    return `no keyword_cat`
  }
  let search_url = `${api_root_path}${keyword_path}?_limit=${search_limit}`
  if(keyword_cat){
    search_url+=`&category=${getCategoryByName(keyword_cat)}`
  }
  rp(auth_options)
    .then(function (response) {
      console.log(`Got jwt==================${response.jwt}`)
      return response.jwt
    })
    .then(function(jwt){
      api_header_obj.Authorization = `Bearer ${jwt}`
      return rp({
        method: 'GET',
        uri: `${search_url}`,
        headers: api_header_obj,
        json: true
      })
      .then(function(res){
        return res
      })
      .catch(function(err){
        console.log(err)
      })
    })
    .then(function(res){
      let str = ''
      res.forEach(element => {
        str+=`${element.name}\n`
      });
      let data_str = new Date()
      let fileName = `${keyword_cat}-${tools.formatDateTime(data_str)}.txt`
      fs.writeFile(`${output_folder}/${fileName}`, str, function (err) {
        if (err) throw err;
        console.log(`Saved ${fileName} of ${res.length} keywords!`);
        return `Saved ${fileName}!`
    });
    })
    .catch(function(err){
      console.log(err)
      return err
    })
}
