var url = require('url');
var _ = require('lodash');
// to get customize links for other sites
// promotion category like folding/stacking/pallet box/moving dolly


var getRandomArrValue = function (arr) {
    try {
        return arr[Math.floor(Math.random() * arr.length)];
    } catch (error) {
        console.log(error)
    }
    
};

// get a disorganized arr compared to previous one
var disorganizeArr = function (arr) {
    try {
        return arr.sort(() => Math.random() - 0.5);
    } catch (error) {
        console.log(error)
    }
    
};


module.exports = {
    internal: function (address, whole_cat_obj) {
        try {
            var target_host = url.parse(address, true).host;
            var prefix = '';
            var suffix = 'We will try our best to serve you!<br>';
            var element = "";
            let total_promote_cat = whole_cat_obj;
            var newDisorderedArr = disorganizeArr(total_promote_cat.concat());
            for (let index = 0; index < newDisorderedArr.length; index++) {
                var websites = disorganizeArr(newDisorderedArr[index].urls.concat());
                var descriptions = disorganizeArr(newDisorderedArr[index].descriptions);
                if (descriptions.length <= 0) {
                    console.log(`no description for cat (${newDisorderedArr[index].name})`);
                } else {
                    var pick_description = descriptions.splice(_.random(0, descriptions.length - 1), 1)[0].description;
                    pick_description = pick_description.replace(/\.\.\.$/, ".");
                    websites.forEach(function (value) {
                        value = value.url
                        if (url.parse(value, true).host == target_host) {
                            if (newDisorderedArr[index].keyword.length === 0) {
                                console.log(`no keywords for cat (${newDisorderedArr[index].name}) while url=(${value})`);
                            } else {
                                let selectedKeywords = getRandomArrValue(newDisorderedArr[index].keyword).name
                                element += `${pick_description} <a href="${value}" target="_blank">${selectedKeywords}</a>,`
                            }
                        }
                    })
                }

            }
            return element != "" ? prefix + element + suffix : element;
        } catch (error) {
            console.log(error)
        }
        
    },
    outbound: function (address, whole_cat_obj,all_urls,post_title) {
        try {
            let total_promote_cat = whole_cat_obj;
            var target_host = url.parse(address, true).host;
            var prefix = ``;
            if(post_title){
                prefix = `<h2>${post_title}</h2>`;
            }
            var suffix = 'Welcome to our store!<br>';
            var element = "";
            var linkNumber = 1;
            var genLinkNumber = 0;
            var newDisorderedArr = disorganizeArr(total_promote_cat.concat());
            for (let index = 0; index < newDisorderedArr.length; index++) {
                var websites = disorganizeArr(newDisorderedArr[index].urls.concat());
                var descriptions = disorganizeArr(newDisorderedArr[index].descriptions);
                if (descriptions.length <= 0) {
                    console.log(`no description for cat (${newDisorderedArr[index].name})`)
                } else {
                    var pick_description = descriptions.splice(_.random(0, descriptions.length - 1), 1)[0].description;
                    pick_description = pick_description.replace(/\.\.\.$/, ".");
                    if (genLinkNumber < linkNumber) {
                        for (let websitesIndex = 0; websitesIndex < websites.length; websitesIndex++) {
                            if (url.parse(websites[websitesIndex].url, true).host != target_host) {
                                let this_url_obj = all_urls.filter(item => item.url === websites[websitesIndex].url)[0]
                                let this_url_to_promote_keyword = this_url_obj.to_promote_keyword;
                                let selectedKeywords;
                                if (this_url_to_promote_keyword.length > 0) {
                                    selectedKeywords = getRandomArrValue(this_url_to_promote_keyword).name
                                } else {
                                    if (newDisorderedArr[index].keyword.length === 0) {
                                        console.log(`no keywords for cat (${newDisorderedArr[index].name})`)
                                        break
                                    } else {
                                        selectedKeywords = getRandomArrValue(newDisorderedArr[index].keyword).name
                                    }
                                }

                                element += `${pick_description} <a href="${websites[websitesIndex].url}" target="_blank">${selectedKeywords}</a>,`
                                genLinkNumber++;
                                break
                            }
                        }
                    } else {
                        element = `${pick_description} + ${element}`
                    }
                }

            }
            return element != "" ? prefix + element + suffix : element;
        } catch (error) {
            console.log(error)
        }
        
    },
    links: function (address,whole_cat_obj,all_urls,post_title) {
        try {
            let internal_content = this.internal(address, whole_cat_obj);
            let outbound_content = this.outbound(address, whole_cat_obj, all_urls,post_title);
            return internal_content + outbound_content
        } catch (error) {
            console.log(error)
        }
        
    }
};