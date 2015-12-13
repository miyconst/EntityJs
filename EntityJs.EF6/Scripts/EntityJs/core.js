/*-- File version 0.0.0.29 from 2014.07.22 --*/
var ejs = {};

try {
    if (top.location.href) {
        ejs.top = top;
    } else {
        ejs.top = self;
    }
} catch (ex) {
    ejs.top = self;
}
if (!ejs.top.ejsSettings) {
    ejs.top.ejsSettings = {};
}

ejs.handleError = function (data) {
    alert(data.code);
};

ejs.onServerError = function () {
};

ejs.rjson = function (options) {
    var url = options.url;
    var data = options.data;
    var async = typeof options.async == "undefined" ? true : options.async;
    var strData = JSON.stringify(data);

    return $.ajax({
        type: "POST",
        url: url,
        data: strData,
        contentType: options.contentType || "application/json; charset=utf-8",
        dataType: options.dataType || "json",
        async: async,
        success: function (data) {
            data = ejs.toJsObject(data);

            if (data.code != 200) {
                ejs.handleError(data);
                return;
            }

            if (typeof options.success == "function") {
                options.success(data.result);
            }
        },
        error: function (ex) {
            if (typeof options.error == "function") {
                options.error(ex);
            }

            ejs.onServerError(ex);
        }
    });
};

ejs.createEvent = function () {
    var result = [];

    result.attach = function (func) {
        if (typeof func == "function") {
            result.push(func);
        }
    };

    result.detach = function (func) {
        var index = result.indexOf(func);

        if (index < 0) {
            return;
        }

        result.splice(index, 1);
    };

    result.raise = function (e) {
        var r = [];

        result.forEach(function (it, i) {
            r.push(it(e));
        });

        if (r.length < 2) {
            return r[0];
        }

        return r;
    };

    return result;
};

ejs.createProperty = function (value, name) {
    var result = function (newValue, restore) {
        if (arguments.length > 0) {
            if (ejs.isEmpty(newValue)) {
                newValue = "";
            }
            if (value === newValue) {
                return;
            }

            var e = { oldValue: value, newValue: newValue, restore: restore || false };
            value = newValue;
            result.change.raise(e);
        }

        return value;
    };

    result.originalValue = value;
    result.hasChanges = function () {
        return result.originalValue !== result();
    };
    result.restore = function () {
        result(result.originalValue, true);
    };

    result.name = name;
    result.change = ejs.createEvent();
    result.attach = result.change.attach;
    result.detach = result.change.detach;

    return result;
};

ejs.createSelectOptions = function (set, wheres, orders, take, skip, includes, whereMethod, orderMethod) {
    var options = {
        entitySetName: ejs.toServerName(set.settings.name),
        entityName: ejs.toServerName(set.settings.className),
        selectMode: ejs.toServerName(set.settings.mode),
        includes: includes ? [].concat(includes) : [],
        wheres: wheres ? wheres : [],
        whereMethod: whereMethod,
        orders: orders ? orders : [],
        orderMethod: orderMethod,
        take: take,
        skip: skip
    };

    return options;
};
ejs.cso = ejs.createSelectOptions;

ejs.createWhereParameter = function (property, value, condition, type, operand, action, subs) {
    var conditions = ["=", ">", "<", ">=", "<=", "!=", "like", "isNull", "isNotNull"];
    var conditionNames = ["Equals", "MoreThan", "LessThan", "EqualsOrMoreThan", "EqualsOrLessThan", "NotEquals", "Like", "IsNull", "IsNotNull"];
    var types = ["string", "date", "time", "number", "bool", "group"];
    var typeNames = ["String", "Date", "Time", "Number", "Bool", "Group"];
    var actions = ["none", ".", "+", "-", "&"];
    var actionNames = ["None", "Append", "Add", "Deduct", "Append"];

    if (condition) {
        var index = conditions.indexOf(condition);
        condition = conditionNames[index];
    } else {
        condition = conditionNames[0];
    }

    if (type) {
        var index = types.indexOf(type);
        type = typeNames[index];
    } else {
        type = typeNames[0];
    }

    if (action) {
        var index = actions.indexOf(action);
        action = actionNames[index];
    } else {
        action = actionNames[0];
    }

    var result = {
        Property: ejs.toServerName(property),
        Value: value,
        Values: value,
        DataType: type,
        Condition: condition,
        Operand: ejs.toServerName(operand || ""),
        Action: action,
        SubParameters: subs
    };

    return result;
};
ejs.cwp = ejs.createWhereParameter;

ejs.createOrderParameter = function (property, desc, action) {
    if (property.contains("+")) {
        action = "Append";
        property = property.replace(/[+]/gi, ",");
    }
    var result = {
        Property: ejs.toServerName(property),
        Descending: desc ? true : false,
        Action: action || "None"
    };

    return result;
};
ejs.cop = ejs.createOrderParameter;

ejs.createIncludeParameter = function (set, collection, childParameter, property) {
    var result = {
        EntitySetName: ejs.toServerName(set.settings.name),
        EntityName: ejs.toServerName(set.settings.className),
        Property: ejs.toServerName(property),
        Collection: collection ? true : false,
        Child: childParameter || null
    };

    return result;
};
ejs.cip = ejs.createIncludeParameter;

ejs.toJsName = function (value) {
    if (value === "ID") {
        return "id";
    } else if (value.indexOf("ID") == 0) {
        value = "id" + value.substring(2);
        return value;
    } else {
        return value.toLowerCaseFirst();
    }
};
ejs.tjn = ejs.toJsName;

ejs.toServerName = function (value) {
    if (!value) {
        return value;
    }

    if (value === "id") {
        return "ID";
    }

    if (value.indexOf("id") == 0) {
        value = "ID" + value.substring(2);
        return value;
    } else {
        return value.toUpperCaseFirst();
    }
};
ejs.tsn = ejs.toServerName;

ejs.toJsObject = function (value) {
    if (typeof value == "string" || typeof value == "number") {
        return value;
    } else if (value instanceof Array) {
        return value.select("val=>ejs.toJsObject(val)");
    }

    var result = {};

    for (var i in value) {
        var v = value[i]

        if (v == null || v == undefined) {
            v = "";
        } else if (v instanceof Array) {
            v = v.select("val=>ejs.toJsObject(val)");
        } else if (typeof v == "object") {
            v = ejs.toJsObject(v);
        } else if (isMvcDate(v)) {
            v = parseDate(v).toSds();
        }

        result[ejs.toJsName(i)] = v;
    }

    return result;
};
ejs.tjo = ejs.toJsObject;

ejs.toServerObject = function (value) {
    if (typeof value == "string" || typeof value == "number") {
        return value;
    }

    var result = {};

    for (var i in value) {
        var v = value[i]

        if (v == null || v == undefined) {
            v = "";
        } else if (v.linqArray) {
            v = v.select("val=>ejs.toServerObject(val)");
        } else if (typeof v == "object") {
            v = ejs.toServerObject(v);
        }

        result[ejs.toServerName(i)] = v;
    }

    return result;
};
ejs.tso = ejs.toServerObject;

ejs.htmlEncode = function (value) {
    return $('<div/>').text(value).html();
};
ejs.henc = ejs.htmlEncode;

ejs.htmlDecode = function (value) {
    return $('<div/>').html(value).text();
};
ejs.hdec = ejs.htmlDecode;

ejs.saveSetting = function (name, value, callback) {
    $.rjson({
        data: { Name: name, Value: "(" + JSON.stringify(value) + ")" },
        url: ejs.arp() + "Data/SaveUserSettings",
        success: function (result) {
            ejs.cif(callback);
        },
        error: function (ex) {
            ejs.onServerError(ex);
        }
    });
};

ejs.callIfFunction = function (v, a, b, c, d, e, f, g) {
    if (typeof v == "function") {
        return v(a, b, c, d, e, f, g);
    }
    return v;
};
ejs.cif = ejs.callIfFunction;

ejs.getFunctionValue = function (v) {
    if (typeof v == "function") {
        return v();
    }
    return v;
}
ejs.gfv = ejs.getFunctionValue;

ejs.isEmpty = function (v, dv) {
    if (arguments.length == 2) {
        return ejs.isEmpty(v) ? dv : v;
    }

    return typeof v == "undefined" || v === null || (isNaN(v) && !v) || v === "" || v === undefined || v.toString() === "";
};

ejs.isTime = function (time) {
    if (typeof time != "string") {
        return false;
    }
    return /^\d\d?[:]\d\d?$/gi.test(time);
};

ejs.parseFloat = function (v, d) {
    if (ko.isObs(v)) {
        v = v();
    }
    if (!v) {
        return 0;
    }

    if (typeof d == "undefined") {
        d = 2;
    }

    v = v.toString().replace(new RegExp("[^\\d.,-]", "gi"), "");
    v = v.replace(new RegExp("[,]", "gi"), ".");

    if (!v) {
        return 0;
    }

    v = parseFloat(v).toFixed(d);

    return parseFloat(v);
};

ejs.toDecimalString = function (v, p) {
    var minus = false;
    if (ko.isObs(v)) {
        v = v();
    }
    if (typeof p == "undefined") {
        p = 2;
    }
    v = ejs.parseFloat(v);

    if (isNaN(v)) {
        return "";
    }

    v = v.toFixed(p);
    minus = v.indexOf("-") == 0;
    v = v.split("").reverse();

    if (minus) {
        v.splice(v.length - 1, 1);
    }

    var r = [];

    if (p > 0) {
        for (var i = 0; i <= p; i++) {
            r.push(v[i]);
        }
        v.splice(0, p + 1);
    }

    for (var i = 0; i < v.length; i++) {
        if (i > 0 && i % 3 == 0) {
            r.push(" ");
        }

        r.push(v[i]);
    }

    if (minus) {
        r.push("-");
    }

    r = r.reverse();

    return r.join("");
};
ejs.toDs = ejs.toDecimalString;

ejs.toPlural = function (v) {
    if (v.indexOf("y") == v.length - 1) {
        return v.replace(new RegExp("y$", "g"), "ies");
    }
    if (v.lastIndexOf("s") == v.length - 1) {
        return v + "es";
    }
    return v + "s";
};

ejs.toSingular = function (v) {
    v = v.replace(new RegExp("ies$", "g"), "y");
    v = v.replace(new RegExp("s$", "g"), "");
    v = v.replace(new RegExp("ses$", "g"), "s");
    return v;
};

ejs.onbeforeunload = function (e, a) {
    if (ejs.top.ejsSettings.allowDataLoss) {
        return;
    }

    var messages = ejs.top.onbeforeunloadEvent.raise();
    if (messages && messages instanceof Array) {
        return messages.first("val=>val");
    } else if (messages) {
        return messages;
    }
};

ejs.getApplicationRootPath = function () {
    if (window.ApplicationRootPath) {
        return window.ApplicationRootPath;
    }
    if (window.host && window.host.ApplicationRootPath) {
        return window.host.ApplicationRootPath
    }
    if (window.host && window.host.arp) {
        return window.host.arp
    }
    return "/";
};
ejs.arp = ejs.getApplicationRootPath;

ejs.getFileUploadPath = function (n, id) {
    var r = ejs.arp() + "Data/UploadFile/" + n;
    if (id) {
        r += "?FileID=" + id;
    }
    return r;
};
ejs.fup = ejs.getFileUploadPath;

ejs.getFileDownloadPath = function (n, id) {
    var r = ejs.arp() + "Data/DownloadFile/" + n + "?FileID=" + id;
    return r;
};
ejs.fdp = ejs.getFileDownloadPath;

ejs.getEmptyPagePath = function (id) {
    return ejs.arp() + "Data/Empty/" + (id || ejs.gun());
};
ejs.gepp = ejs.getEmptyPagePath;

ejs.openWindow = function (callback) {
    var id = ejs.gun();
    var url = ejs.gepp(id);
    window['childWindowLoaded' + id] = callback;
    var w = window.open(url, "_blank");
};

ejs.getTemplate = function (t) {
    if (t.indexOf("#") == 0) {
        return $(t).html();
    }
    return t;
};

ejs.uniqueNumber = 0;
ejs.getUniqueNumber = function () {
    ejs.uniqueNumber++;
    return ejs.uniqueNumber;
};
ejs.gun = ejs.getUniqueNumber;

ejs.entityToString = function (e, fields, last) {
    fields = fields || [];
    fields = [].concat(fields);
    fields = fields.concat(["fullName", "name", "shortName", "title", "caption", "number", "contractNumber", "date", "time"]);
    if (last) {
        fields = fields.concat(last);
    }
    fields = fields.concat(fields.select("val=>ejs.tsn(val)"));

    for (var i = 0; i < fields.length; i++) {
        var p = e[fields[i]];
        if (ejs.isEmpty(p)) {
            continue;
        } else if (typeof p == "function") {
            p = p();
            if (ejs.isEmpty(p)) {
                continue;
            }
            return p;
        } else {
            return p;
        }
    }

    var id = e.id;
    if (typeof id == "function") {
        return id();
    } else {
        return id;
    }
};
ejs.ets = ejs.entityToString;

ejs.confirm = function (title, text, callback) {
    if (confirm(text)) {
        callback();
    }
};
ejs.confirmRemove = ejs.confirm;

ejs.alert = function (title, text, callback) {
    if (typeof text == "undefined") {
        text = title;
    }
    alert(text);
    ejs.cif(callback);
};

ejs.getValue = function (entity, property) {
    if (!entity) {
        return "";
    }

    var p = property.split(".");
    var e = ejs.gfv(entity);

    e = ejs.gfv(e[p[0]]);
    p.splice(0, 1);

    if (p.length) {
        return ejs.getValue(e, p.join("."));
    }
    return e;
};

ejs.ajaxRequests = [];
ejs.busy = function (r) {
    ejs.free(r);
    setTimeout(function () {
        if (ejs.ajaxRequests.length > 0 && $("#divBusy").size() < 1) {
            $("<div/>").css({ opacity: "0.5" }).attr("id", "divBusy").appendTo("body");
        }
    }, 100);
    ejs.ajaxRequests.push(r);
};
ejs.free = function (r) {
    var index = ejs.ajaxRequests.indexOf(r);
    if (index >= 0) {
        ejs.ajaxRequests.splice(index, 1);
        if (ejs.ajaxRequests.length < 1) {
            $("#divBusy").remove();
        }
    }
};
ejs.isBusy = function () {
    return ejs.ajaxRequests.any();
};

ejs.ie7 = function () { return window.navigator.appVersion.indexOf("MSIE 7") >= 0; };
ejs.ie8 = function () { return window.navigator.appVersion.indexOf("MSIE 8") >= 0; };
ejs.ie9 = function () { return window.navigator.appVersion.indexOf("MSIE 9") >= 0; };
ejs.isMobileAgent = function () {
    var agents = ["Android", "webOS", "iPhone", "iPad", "iPod", "BlackBerry", "Windows Phone"];
    for (var i = 0; i < agents.length; i++) {
        if (window.navigator.userAgent.indexOf(agents[i]) >= 0) {
            return true;
        }
    }

    return false;
}

ejs.strings = {};
ejs.getString = function (v, k) {
    var strings = ejs.strings;
    if (k) {
        strings = strings[k];
    }
    return strings[v] || v;
};
ejs.gs = ejs.getString;

ejs.formatter = function (params) {
    var me = this;
    var settings = {
        clear: "",
        format: ".*",
        template: "$&"
    };

    function ctor() {
        $.extend(settings, params);
    }

    me.apply = function (v) {
        if (ejs.isEmpty(v)) {
            v = "";
        } else {
            v = v.toString();
        }

        v = me.clear(v);
        v = me.format(v);
        v = me.transform(v);

        return v;
    };

    me.clear = function (v) {
        v = v.replace(new RegExp(settings.clear, "gi"), "");
        return v;
    };

    me.transform = function (v) {
        return v;
    };

    me.format = function (v) {
        v = v.replace(new RegExp(settings.format, "gi"), settings.template);
        return v;
    };

    ctor();
};

ejs.i18n = {};
ejs.i18n.declineCount = function (val, one, two, five) {
    var t = parseInt((val % 100 > 20) ? val % 10 : val % 20);

    switch (t) {
        case 1:
            return one;

        case 2:
        case 3:
        case 4:
            return two;

        default:
            return five;
    }
};

if (!ejs.top.onbeforeunloadEvent) {
    ejs.top.onbeforeunloadEvent = ejs.createEvent();

    if ($) {
        $(ejs.top).bind("beforeunload", ejs.onbeforeunload);
    } else {
        ejs.top.onbeforeunload = ejs.onbeforeunload;
    }
}