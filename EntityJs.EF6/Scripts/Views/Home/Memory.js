var koModel = {};

var mo = function (options) {
    var me = this;
    var name = "";

    me.name = function () {
        if (arguments.length > 0) {
            name = arguments[0];
        }

        return name;
    };

    me.alert = function () {
        alert(me.name());
    };
};

$(function () {

    koModel.array = ko.obsa([]);

    koModel.refresh = function () {
        koModel.array((new Array(1000)).select(function (it, i) {
            var o = {
                a: ko.obs("1"),
                i: ko.obs(i)
            };
            var r = ko.obs(o);
            koModel[i] = r;
            return r;
        }));
    };

    ko.apply(koModel);

    /*koModel.index = ko.obs(0);

    var html = (new Array(10000)).select(function (it, i) {
        return "<span data-bind='html: $root.index() + " + i + "'></span> ";
    }).join("");

    $("body").html(html);

    ko.apply(koModel);*/

    /*var mos = (new Array(10000)).select(function () {
        var r = new mo();
        return r;
    });*/
});