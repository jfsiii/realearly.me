var http = require('http')
, options = { 
    host: 'twitter.com'
}
, segments = {
    innovator: {
        desired_id: 1e7
      , actual_id: 10000002
    }
  , early_adopter: {
        desired_id: 6.4e7
      , actual_id: null
  }
  , early_majority: {
        desired_id: 2e8
      , actual_id: null
  }
  , late_majority: {
        desired_id: 3.36e8
      , actual_id: null
  }
  , laggard: {
        desired_id: 3.9e8
      , actual_id: null
  }

}
// TODO: pull from persistence
, dates = {
      15000000: 'Wed Jun 04 01:41:33 +0000 2008'
    , 16000000: 'Tue Aug 26 17:53:44 +0000 2008'
    , 20000000: 'Tue Feb 03 20:15:58 +0000 2009'
    , 21000000: 'Mon Feb 16 16:34:25 +0000 2009'
    , 23000000: 'Thu Mar 05 23:50:23 +0000 2009'
    , 2000001: 'Fri Mar 23 11:22:41 +0000 2007'
    , 24000000: 'Thu Mar 12 18:29:15 +0000 2009'
    , 18000000: 'Tue Dec 09 19:41:37 +0000 2008'
    , 22000001: 'Thu Feb 26 11:36:11 +0000 2009'
    , 19000001: 'Wed Jan 14 22:47:01 +0000 2009'
    , 6000002: 'Sun May 13 01:52:08 +0000 2007'
    , 7000002: 'Thu Jun 21 17:19:51 +0000 2007'
    , 17000001: 'Mon Oct 27 15:10:45 +0000 2008'
    , 14000002: 'Tue Feb 26 12:48:22 +0000 2008'
    , 12000002: 'Tue Jan 08 21:03:37 +0000 2008'
    , 11000012: 'Sun Dec 09 19:26:43 +0000 2007'
    , 10000012: 'Tue Nov 06 14:57:32 +0000 2007'
    , 9000012: 'Thu Sep 20 16:58:16 +0000 2007'

    ,  10000002: 'Tue Nov 06 14:57:02 +0000 2007'
    ,  25000000: 'Wed Mar 18 01:25:40 +0000 2009'
    ,  50000000: 'Tue Jun 23 15:06:21 +0000 2009'
    ,  64000000: 'Sat Aug 08 17:00:59 +0000 2009'
    ,  75000000: 'Thu Sep 17 12:31:44 +0000 2009'
    , 100000000: 'Mon Dec 28 17:19:24 +0000 2009'
    , 125000000: 'Sun Mar 21 09:49:30 +0000 2010'
    , 150000000: 'Sun May 30 20:10:08 +0000 2010'
    , 175000000: 'Thu Aug 05 10:49:47 +0000 2010'
    , 200000001: 'Fri Oct 08 06:17:30 +0000 2010'    
    , 225000000: 'Fri Dec 10 11:54:54 +0000 2010'
    , 250000001: 'Thu Feb 10 06:04:19 +0000 2011'
    , 275000000: 'Thu Mar 31 12:50:50 +0000 2011'
    , 300000000: 'Tue May 17 01:20:00 +0000 2011'
    , 325000000: 'Mon Jun 27 15:35:26 +0000 2011'
    , 336000000: 'Fri Jul 15 15:54:16 +0000 2011'
    , 350000000: 'Sun Aug 07 01:50:56 +0000 2011'
    , 375000000: 'Sat Sep 17 10:04:45 +0000 2011'
    , 390000000: 'Thu Oct 13 09:34:21 +0000 2011'
}
;

var calls_left = RATE_LIMIT;
function get(segment)
{
    if (! calls_left || dates[segment.actual_id]) return;

    var get = arguments.callee;
    if (! segment.actual_id) segment.actual_id = segment.desired_id
    options.path = '/users/show.json?user_id=' + segment.actual_id
    console.log('get date for', segment.actual_id, 'call', options.path);
    http
        .get(options, function (response) {
            calls_left = parseInt(response.headers['x-ratelimit-remaining'], 10);
            console.log(calls_left, 'calls left');
            var json = '';
            response.on('data', function (data) { json += data });
            response.on('end', function () { 
                var twitter = JSON.parse(json);
                if (twitter && twitter.created_at) {
                    console.log(segment.actual_id, 'on', twitter.created_at);
                    // TODO: store via persistence
                    dates[segment.actual_id] = twitter.created_at;
                } else {
                    console.log('OH NOES! try', segment.actual_id += 1);
                    get(segment);
                }
            })
        })
        .on('error', function(e) {
            console.log("Got error: " + e.message);
            console.log('segment', segment.actual_id);
            console.log('call on', segment.actual_id+=1);
            get(segment);
        })
    ;
}

for (var step = 1000000, current = step, max = 25000000, ids = []; current < max; current+=step) {

    if (! dates[current]) ids.push(current)
}

//for (var desc in segments) get(segments[desc])

ids.forEach(function (id){
    console.log(id);
    get({desired_id: id})
})
