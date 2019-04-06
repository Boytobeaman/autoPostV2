var self = {
  randomProperty: function (obj) {
    var keys = Object.keys(obj)
    return obj[keys[ keys.length * Math.random() << 0]];
  },
  formatDateTime: function (dateTime) {
    var date = new Date(dateTime);
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();

    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return month + '-' + day + '-' + year + "-" + h + "-" + m + "-" + s;
  },
  clearnStr: function(str){
    return str.replace(/\.{2,}/g,'.')
  }
}


module.exports = self;