require("cloud/app.js");
// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:

var Hongbao = AV.Object.extend('Hongbao')
var Support = AV.Object.extend('Support')

var testCreateHongbao = {
    "phoneNo": "123",
    "openId": "id123"
}

var CONVERT_TABLE = [
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
    [80, 100, 100]
]
var GOAL_AMOUNT = 1000;
var MAX_SUPPORT_COUNT = 25;
var SPECIAL_SUPPORT_AMOUNT = 100;

function generateSupportSequence() {
    var supportSequence = [];
    var firstBlood = Math.floor(Math.random() * 3);
    var total = 0;

    for (var i = 0; i < MAX_SUPPORT_COUNT; i++) {
        var newAmount = -1;
        if (i === firstBlood) {
            newAmount = SPECIAL_SUPPORT_AMOUNT;
        } else {
            var convertLevel = i % 4;
            convertLevel = (convertLevel >= 2) ? (convertLevel - 2) : (convertLevel + 2)
            newAmount = CONVERT_TABLE[convertLevel][Math.floor(Math.random() * 3)]
            if (i < 3 && (newAmount === 100)) {
                newAmount -= 10;
            }
        }
        total += newAmount
        if (total >= 1000) {
            supportSequence.push(newAmount - (total - GOAL_AMOUNT));
            break;
        }
        supportSequence.push(newAmount);
    }
    return supportSequence;
}

AV.Cloud.define("getHongbaoByCode", function (request, response) {
    var code = request.params.code
    //TODO https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
    // Error if hongbao not exists
})

AV.Cloud.define("createHongbao", function (request, response) {
    // Check if phone exists
    var phoneNo = request.params.phoneNo;
    var openId = request.params.openId;
    if (!phoneNo || !openId) {
        response.error('invalid params,' + phoneNo + ',' + openId);
        return;
    }

    var query = new AV.Query(Hongbao);
    query.equalTo('openId', openId);
    query.first().then(function (hongbao) {
        return (hongbao) ?
            AV.Promise.as(hongbao) :
            new Hongbao({
                phoneNo: phoneNo,
                openId: openId,
                supports: generateSupportSequence()
            }).save();
    }).then(function (hongbao) {
        response.success(hongbao);
    }, function (err) {
        response.error(err);
    })
});

var testSupportHongbao = {
    "supporterId": "123",
    "targetId": "id123"
}

AV.Cloud.define("updatePhoneNo", function (request, response) {
    var phoneNo = request.params.phoneNo,
        hongbaoId = request.params.hongbaoId;

    new AV.Query(Hongbao).get(hongbaoId)
        .then(function (hongbao) {
            hongbao.set('phoneNo', phoneNo)
            return hongbao.save()
        }).then(function (hongbao) {
            response.success(hongbao)
        }, function (err) {
            response.error(err)
        })

})

AV.Cloud.define("supportHongbao", function (request, response) {
    var supporterId = request.params.supporterId,
        hongbaoId = request.params.targetId,
        alreadySupported = false;

    // TODO Check all params
    // TODO change amount

    // TODO get all supports of this Hongbao
    // TODO check if this user supported the hongbao, if not create a support, or response error

    var query = new AV.Query(Support)
    query.equalTo('target', new Hongbao({id: hongbaoId}))
    //query.equalTo('supporter', new Hongbao({id: supporterId}))
    query.find().then(function (supporters) {
        if (supporters) {
            supporters.forEach(function (support) {
                if (support.id === supporterId) {
                    alreadySupported = true
                }
            })
            if (alreadySupported) {
                response.error('already supported')
            } else {
                new Support({
                    target: new Hongbao({id: hongbaoId}),
                    supporter: new Hongbao({id: supporterId})
                }).save().then(function () {

                    })
            }
        } else {

        }
    })

    new Support({
        supporter: new Hongbao({id: supporterId}),
        target: new Hongbao({id: hongbaoId}),
        amount: 30
    }).save().then(function (support) {
            response.success(support);
        }, function (err) {
            response.error(err);
        })
})