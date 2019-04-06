let importDescJsonToDB = require('./importDescJsonToDB')

let json_path = './outputDesc/plasticPartBin.json'
let cat = 'plastic parts bin'
importDescJsonToDB(json_path,cat)


// let outputKeywordsByCat = require('./outputKeywordsByCat')
// let cat = 'plastic parts bin'
// outputKeywordsByCat(cat)
