z = {};
z.alert = function (text, callback) {
    alert(text);
};
z.confirm = function (text, callback) {
    var result = confirm(text);

    return result
};
z.getAddVat = function (v) {
    return v / 100 * 18;
};
z.getRemoveVat = function (v) {
    return v - z.removeVat(v);
};
z.addVat = function (v) {
    return v + z.getAddVat(v);
};
z.removeVat = function (v) {
    return v * 100 / 118;
};
z.percent = function (v, p) {
    return v / 100 * p;
};
z.zeroIfEmpty = function (v) {
    if (!v) {
        return 0;
    }

    return v;
};
z.parseFloat = function (v, d) {
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
z.toDecimalString = function (v) {
    var minus = false;
    if (ko.isObs(v)) {
        v = v();
    }
    v = z.parseFloat(v);
    v = v.toFixed(2);
    minus = v.indexOf("-") == 0;
    v = v.split("").reverse();

    if (minus) {
        v.splice(v.length - 1, 1);
    }

    var r = [v[0], v[1], v[2]];

    v.splice(0, 3);

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
z.toDs = z.toDecimalString;
z.toTimeFromMinutes = function (ms) {
    if (!ms) {
        return "00:00";
    }

    var h = parseInt(ms / 60);
    var m = ms % 60;

    if (h < 10) {
        h = "0" + h.toString();
    }

    if (m < 10) {
        m = "0" + m.toString();
    }

    return h + ":" + m;
};
z.toTfm = z.toTimeFromMinutes;
z.userSettings = function (value) {
    if (typeof value != "undefined" && typeof value != "function") {
        localStorage.userSettings = JSON.stringify(value);
        return value;
    }

    var settings = {};

    if (localStorage.userSettings) {
        try {
            settings = eval("(" + localStorage.userSettings + ")");
        } catch (ex) {
            settings = {};
        }
    }

    if (typeof value == "function") {
        z.userSettings(value(settings));
    }

    return settings;
};
z.filter = {};
z.filter.parseKeywords = function (keywords) {
    var keywordsArray = [];
    var separate = true;
    var keyword = "";

    for (var i = 0; i < keywords.length; i++) {
        if ((keywords.charAt(i) == " " && separate) || (keywords.charAt(i) == '"' && !separate)) {
            if (keyword) {
                keywordsArray.push(keyword.toLowerCase());
                keyword = "";
            }
            separate = true;
        } else if (keywords.charAt(i) == '"') {
            separate = false;
        } else {
            keyword += keywords.charAt(i);
        }
    }

    if (keyword) {
        keywordsArray.push(keyword.toLowerCase());
    }

    return keywordsArray;
};
z.filter.toRegExp = function (keywords) {
    return new RegExp(z.filter.parseKeywords(keywords).select("val=>RegExp.escape(val)").join("|"), "gi");
};
z.filter.markMatches = function (value, keywords) {
    if (!keywords) {
        return value;
    }

    return (value + "").replace(z.filter.toRegExp(keywords), "<span class='filterResult'>$&</span>");
};
z.filter.getCmp = function (source, keywords) {
    return ko.cmp(function () {
        return z.filter.markMatches(source(), keywords);
    });
};

var ajaxRequests = new Array();
var texts = new Object();

$.onServerError = function () {
    top.ajaxRequests.slice(0).forEach(function (it) {
        top.free(it);
    });

    var html = ["<div id='divError'>",
                    "<div class='box'>",
                        "<div class='invalid bold larger'>На сервере произошла ошибка.</div>",
                        "<div class='separator'></div>",
                        "<div>Сообщение об ошибке выслано администратору, приносим извинения за доставленное неудобство.</div>",
                        "<div class='separator'></div>",
                        "<div class='text-center'>",
                            "<input type='button' value='Закрыть' />",
                        "</div>",
                    "</div>",
                "</div>"].join("");

    var div = $("<div/>");

    div.html(html);
    var btn = div.find("input");

    btn.click(function () {
        top.free(div);
        div.remove();
    });

    top.busy(div);
    top.$("body").append(div);
};

$.rjson = function (options) {
    if (options.xdomain && typeof window.XDomainRequest != "undefined") {
        $.xdr(options);
    }

    var url = options.url;
    var data = options.data;
    var async = typeof options.async == "undefined" ? true : options.async;
    var strData = JSON.stringify(data);

    return $.ajax({
        type: "POST",
        url: url,
        data: strData,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        async: async,
        success: function (data) {
            if (typeof options.success == "function") {
                options.success(data);
            }
        },
        error: function (ex) {
            if (ex.statusText == "abort") {
                return;
            }

            if (typeof options.error == "function") {
                options.error(ex);
            }

            //$.onServerError();
        }
    });
};

$.xdr = function (options) {
    //if ($.browser.msie && window.XDomainRequest) {
    // Use Microsoft XDR
    var url = options.url;
    var type = typeof options.type == "undefined" ? "POST" : options.type;
    var contentType = typeof options.contentType == "undefined" ? "application/json; charset=utf-8" : options.contentType;
    var xdr = new XDomainRequest();
    var requestData = options.data;
    if (requestData && typeof requestData != "string" && contentType.contains("json")) {
        requestData = JSON.stringify(requestData);
    }
    xdr.open(type, url);
    xdr.onload = function () {
        var text = xdr.responseText;
        var JSON = $.parseJSON(text);
        if (JSON == null || typeof (JSON) == 'undefined') {
            text = data.firstChild.textContent;
            JSON = $.parseJSON(text);
        }
        if (options.success) {
            options.success(JSON, text);
        }
    };
    xdr.onerror = options.error;
    xdr.send(requestData);
    //}
};

var saveSetting = function (name, value, callback) {
    $.rjson({
        data: { Name: name, Value: JSON.stringify(value) },
        url: (window.host ? host.arp : "/") + "User/SaveSettings",
        success: function (result) {
            if (typeof callback == "function") {
                callback(result);
            }
        },
        error: function (ex) {
            alert(texts.r500);
        }
    });
};

jQuery.fn.numeric = function () {
    return this.each(function () {
        $(this).keydown(function (e) {
            var key = e.charCode || e.keyCode || 0;
            if ((key == 86 || key == 67) && e.ctrlKey)
                return true;
            // allow backspace, tab, delete, arrows, numbers and keypad numbers ONLY
            return !e.altKey && !e.shiftKey && !e.ctrlKey && (
                key == 8 || key == 9 || key == 46 ||
                key == 190 || key == 188 || key == 110 || key == 191 ||
                (key >= 37 && key <= 40) ||
                (key >= 48 && key <= 57) ||
                (key >= 96 && key <= 105));
        });

        $(this).unbind("blur.numeric");
        $(this).bind("blur.numeric", function () {
            var text = $(this).val();
            if (isEmpty(text + ""))
                return;

            var val = text.match(/\d+([^\d]\d+)?/);
            var precision = $(this).attr("precision");
            var min = $(this).attr("minimum");
            var max = $(this).attr("maximum");

            if (max < min) {
                throw "Maximum value of numeric can not be less than minimum value!";
            }

            if (val) {
                val = val[0];
            } else {
                val = "";
            }
            val = val.replace(/[^\d]/, ".");

            if (precision >= 0) {
                val = Math.round(val * Math.pow(10, precision)) / Math.pow(10, precision);
            }
            if (min && val < min) {
                val = min;
            }
            if (max && val > max) {
                val = max;
            }
            $(this).val(val);
        });
    })
};
jQuery.fn.valtext = function () {
    var index;
    var text;
    try {
        index = $(this).get(0).selectedIndex;
        text = $($(this).find("option").get(index)).text();
        return text;
    }
    catch (ex) {
        return "";
    }
};
jQuery.fn.checked = function (val) {
    if (typeof val != "undefined") {
        $(this).attr("checked", val);
    } else {
        val = $(this).attr("checked") ? true : false;
    }
    return val;
};
jQuery.fn.readonly = function (val) {
    if (typeof val != "undefined") {
        if (val) {
            $(this).attr("readonly", "readonly");
        } else {
            $(this).removeAttr("readonly");
        }
    } else {
        val = $(this).attr("readonly") ? true : false;
    }
    return val;
};
jQuery.fn.disabled = function (val) {
    if (typeof val != "undefined") {
        if (val) {
            $(this).attr("disabled", "disabled");
        } else {
            $(this).removeAttr("disabled");
        }
    } else {
        val = $(this).attr("disabled") ? true : false;
    }
    return val;
};

jQuery.fn.hideOnClick = function () {
    var me = $(this);
    me.hover(function () {
        me.data("hover", true);
    }, function () {
        me.data("hover", false);
    });

    $(document).click(function () {
        if (!me.data("hover")) {
            me.hide();
        }
    });
};
jQuery.fn.resizeTimer = function (fn) {
    var me = $(this);
    var oldSize = { w: me.width(), h: me.height() };

    setInterval(function () {
        var newSize = { w: me.outerWidth(), h: me.outerHeight() };

        if (oldSize.w != newSize.w || oldSize.h != newSize.h) {
            fn();
        }

        oldSize = newSize;
    }, 100);
};
jQuery.fn.resizeClick = function (fn) {
    var me = $(this);
    var oldSize = { w: me.width(), h: me.height() };

    $(document).click(function () {
        var newSize = { w: me.outerWidth(), h: me.outerHeight() };

        if (oldSize.w != newSize.w || oldSize.h != newSize.h) {
            fn();
        }

        oldSize = newSize;
    });
};

var busy = function (r) {
    free(r);
    setTimeout(function () {
        if (ajaxRequests.length > 0 && $("#divBusy").size() < 1) {
            $("<div/>").css({ opacity: "0.5" }).attr("id", "divBusy").appendTo("body");
        }
    }, 100);
    ajaxRequests.push(r);
};
var free = function (r) {
    var index = ajaxRequests.indexOf(r);
    if (index >= 0) {
        ajaxRequests.splice(index, 1);
        if (ajaxRequests.length < 1) {
            $("#divBusy").remove();
        }
    }
};

var initDatepicker = function (selector) {
    $(selector).each(function () {
        var s = $(this);

        s.datepicker("destroy");
        s.datepicker({
            onSelect: function (dateText, inst) {
                $(inst.input).change();
            },
            beforeShow: function () {
                s.setRange(s.val());
            }
        });

        s.change(function () {
            var txt = $(this);
            var val = txt.val();
            try {
                parseDate(val);

                s.setRange(val);
            } catch (ex) {
                txt.val("");
                txt.change();
            }
        });
        s.setRange = function (val) {
            var dateFrom, dateTo, from = s.attr("from"), to = s.attr("to");

            try { dateFrom = parseDate(from); }
            catch (e) { }
            try { dateTo = parseDate(to); }
            catch (e) { }

            if (dateTo) {
                s.datepicker("option", "maxDate", dateTo);
            }
            else if ($(to).length > 0) {
                s.datepicker("option", "maxDate", $(to).val());

                $(to).datepicker("option", "minDate", val ? val : dateFrom);
            }

            if (dateFrom) {
                s.datepicker("option", "minDate", dateFrom);
            }
            else if ($(from).length > 0) {
                s.datepicker("option", "minDate", $(from).val());

                $(from).datepicker("option", "maxDate", val ? val : dateTo);
            }
        };
        s.setRange(s.val());
    });
};

var convertJson = function (json) {
    var reg = new RegExp("[/]Date[(](\\d+)[)][/]", "g");
    json = json.replace(reg, " new Date($1)");
    return json;
};

var addTimeZone = function (date, offset) {
    // convert to msec
    // add local time zone offset 
    // get UTC time in msec
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    var result = new Date(utc + (3600000 * offset));

    // return time as a string
    return result;
}


var parseMvcDate = function (date) {
    var result = new Date(parseInt(date.substr(6)));
    if (typeof ApplicationTimeZoneOffset != "undefined") {
        result = addTimeZone(result, ApplicationTimeZoneOffset);
    }
    return result;
};

var isMvcDate = function (date) {
    var reg = new RegExp("[/]Date[(][-]?(\\d+)[)][/]", "g");
    return reg.test(date);
};

var isEmpty = function (str) {
    var result;
    result = typeof str == "undefined" || str == null || str == NaN || typeof str.length == "undefined" || str.length < 1;
    return result
};
var isNotEmpty = function (str) {
    return !isEmpty(str);
};
var parseBool = function (str) {
    var result;
    result = str === true || str === "true" || str === "True" || str === 1 || str === "1";
    return result;
}
var parseDate = function (str) {
    if (isMvcDate(str)) {
        return parseMvcDate(str);
    } else {
        return $.datepicker.parseDate($.datepicker._defaults.dateFormat, str);
    }
}

var timer = function (code, delay) {
    var me = this;
    me.code = code;
    me.delay = delay;
    me.id = null;

    run();

    me.run = function (code, delay) {
        if (me.id) {
            clearTimeout(me.id);
        }
        if (code) {
            me.code = code;
        }
        if (delay) {
            me.delay = delay;
        }
        run();
    };
    me.clear = function () {
        clearTimeout(me.id);
    }

    function run() {
        if (me.code && me.delay) {
            me.id = setTimeout(me.code, me.delay);
        }
    }
};

String.prototype.toUpperCaseFirst = function () {
    var s = this;
    if (s.length > 0) {
        s = s.charAt(0).toUpperCase() + s.substr(1);
    }
    return s;
};

String.prototype.toLowerCaseFirst = function () {
    var s = this;
    if (s.length > 0) {
        s = s.charAt(0).toLowerCase() + s.substr(1);
    }
    return s;
};

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) == 0;
    };
}

if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str) {
        return this.substr(this.length - str.length) == str;
    };
}

if (typeof String.prototype.trim != 'function') {
    String.prototype.trim = function () {
        var result = "" + this;
        while (result.startsWith(' ') && result.length > 1) {
            result = result.substr(1);
        }
        while (result.endsWith(' ') && result.length > 1) {
            result = result.substr(0, result.length - 1);
        }
        if (result == ' ') {
            result = '';
        }
        return result;
    };
}

if (typeof String.prototype.contains != 'function') {
    String.prototype.contains = function (it, ignoreCase) {
        var me = this;
        if (ignoreCase) {
            me = me.toLowerCase();
            it = it.toLowerCase();
        }
        return me.indexOf(it) != -1;
    };
}

if (typeof String.prototype.html != 'function') {
    String.prototype.html = function (it) { return this.replace(/\n/g, "<br/>"); };
}

var toJsName = function (value) {
    if (value === "ID") {
        return "id";
    }

    return value.toLowerCaseFirst();
};

var toServerName = function (value) {
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

var toJsObject = function (value) {
    var result = {};

    if (!(value instanceof Array) && typeof value != "object") {
        if (isMvcDate(value)) {
            parseDate(value).toSds();
        }

        return value;
    }

    for (var i in value) {
        var v = value[i]

        if (v == null || v == undefined) {
            v = "";
        } else if (v instanceof Array) {
            v = v.select("val=>toJsObject(val)");
        } else if (typeof v == "object") {
            v = toJsObject(v);
        } else if (isMvcDate(v)) {
            v = parseDate(v).toSds();
        }

        result[toJsName(i)] = v;
    }

    return result;
}

var toServerObject = function (value) {
    var result = {};

    if (value == null || value == undefined) {
        return "";
    }

    if (!(value instanceof Array) && typeof value != "object") {
        return value;
    }

    for (var i in value) {
        var v = value[i]

        if (v == null || v == undefined) {
            v = "";
        } else if (v instanceof Array) {
            v = v.select("val=>toServerObject(val)");
        } else if (typeof v == "object") {
            v = toServerObject(v);
        }

        result[toServerName(i)] = v;
    }

    return result;
};

Date.prototype.toShortDateString = function () {
    return $.datepicker.formatDate($.datepicker._defaults.dateFormat, this);
};
Date.prototype.toSds = Date.prototype.toShortDateString;

Date.prototype.dateDiff = function (dateEnd) {
    var result = {
        days: "",
        hours: "",
        minutes: "",
        diff: ""
    };
    dateBegin = this;
    if (typeof dateEnd == 'function') {
        dateEnd = dateEnd();
    }

    if (typeof dateEnd == 'string') {
        dateEnd = parseDate(dateEnd);
    }

    if (!dateBegin || !dateEnd) {
        return result;
    }

    var diffMiliseconds = dateEnd - dateBegin;
    result.days = parseInt(diffMiliseconds / 1000 / 3600 / 24);
    result.hours = parseInt(diffMiliseconds / 1000 / 3600);
    result.minutes = parseInt(diffMiliseconds / 1000 / 60);
    result.seconds = parseInt(diffMiliseconds / 1000);
    result.diff = diffMiliseconds;

    return result;
};

RegExp.escape = function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

if (typeof ko != "undefined") {
    ko.obs = ko.observable;
    ko.obsa = ko.observableArray;
    ko.apply = ko.applyBindings;
    ko.cmp = ko.computed;

    ko.dobs = function (v) {
        var r = ko.obs(v);

        r.text = ko.obs(z.toDecimalString(v));

        r.text.subscribe(function (v) {
            r.text(z.toDecimalString(v));
            r(z.parseFloat(v));
        });

        r.subscribe(function (v) {
            r.text(z.toDecimalString(v));
        });

        return r;
    };

    ko.toDobs = function (r) {
        if (r instanceof Array) {
            r.forEach(function (it, i) {
                ko.toDobs(it);
            });

            return;
        }

        if (arguments.length > 1) {
            for (var i = 0; i < arguments.length; i++) {
                ko.toDobs(arguments[i]);
            }

            return;
        }

        r.text = ko.cmp({
            read: function () {
                return z.toDs(r());
            },
            write: function (v) {
                r("");
                r(z.parseFloat(v));
            }
        });

        return r;
    };

    ko.get = function (value) {
        if (typeof value == "function") {
            return value();
        } else {
            return value;
        }
    };

    ko.isObs = function (value) {
        return typeof value == "function" && typeof value.subscribe == "function";
    }

    ko.bindingHandlers.datepicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();

            if (ko.isObservable(value)) {
                value = value();
            }

            element = $(element);
            if (allBindingsAccessor().attr && allBindingsAccessor().attr.id) {
                var id = allBindingsAccessor().attr.id;
                if (typeof id == "function")
                    id = id();
                element.attr("id", id);
            }
            initDatepicker(element);

            if (!value) {
                element.datepicker("disable");
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();

            if (ko.isObservable(value)) {
                value = value();
            }

            element = $(element);

            if (!value) {
                element.datepicker("disable");
            } else {
                element.datepicker("enable");
            }
        }
    };

    ko.bindingHandlers.clickToEdit = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var textEditor = function (span, input) {
                var value = valueAccessor();

                if (ko.isObservable(value)) {
                    value = value();
                }

                span = $(span);
                input = $(input);

                span.click(function () {
                    input.show();
                    span.hide();
                    input.focus();
                });

                input.blur(function () {
                    value = valueAccessor();

                    if (ko.isObservable(value)) {
                        value = value();
                    }

                    if (!value || !input.val()) {
                        return;
                    }

                    input.hide();
                    span.show();
                });

                input.change(function () {
                    value = valueAccessor();

                    if (ko.isObservable(value)) {
                        value = value();
                    }

                    if (!value || !input.val()) {
                        return;
                    }

                    input.hide();
                    span.show();
                });

                if (value) {
                    input.hide();
                } else {
                    span.hide();
                }
            };

            var span = $(element);
            var input = span.parents(":first").find("input:first, select:first, textarea:first");

            textEditor(span, input);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        }
    };

    ko.bindingHandlers.numeric = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value = value();
            }
            element = $(element);
            element.numeric();
            if (!value) {
                element.numeric("disable");
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value = value();
            }
            element = $(element);
            if (!value) {
                element.numeric("disable");
            } else {
                element.numeric("enable");
            }
        }
    };

    ko.bindingHandlers.timepicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value = value();
            }
            element = $(element);
            element.timepicker();
            if (!value) {
                element.timepicker("disable");
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value = value();
            }
            element = $(element);
            if (!value) {
                element.timepicker("disable");
            } else {
                element.timepicker("enable");
            }
        }
    };

    ko.bindingHandlers.colorpicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value = value();
            }
            element = $(element);
            element.colorPicker();
            element.val(value);
            element.change();
            //            if (!value) {
            //                element.colorPicker("disable");
            //            }
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value = value();
            }
            element = $(element);
            element.val(value);
            element.change();
        }
    };

    ko.bindingHandlers.validate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            element = $(element);

            element.validate({
                errorClass: "invalid",
                errorPlacement: function () { } //errorPlacement
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        }
    };

    ko.bindingHandlers.button = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            element = $(element);

            element.button();
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        }
    };

    ko.bindingHandlers.autocomplete = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            var bindings = allBindingsAccessor();
            var context = bindings.context ? typeof bindings.context == "function" ? bindings.context() : bindings.context : null;
            context = context ? context : viewModel;
            //            if (ko.isObservable(value)) {
            //                value = value();
            //            }

            var onselect = function (event, ui) {
                if (typeof bindings.onselect == "function" && bindings.onselect(event, ui) == false) {
                    return;
                }
                if (typeof bindings.value == "function") {
                    bindings.value(ui.item.value);
                }
                if (bindings.selected) {
                    var selected = bindings.selected;
                    if (ko.isObservable(selected)) {
                        selected = selected();
                    }
                    var source = selected.source ? selected.source : "id";
                    var target = selected.target;
                    var item = ui.item.source;
                    if (typeof source == "function") {
                        source = source();
                    }
                    if (typeof target == "function") {
                        target = target();
                    }
                    source = item[source];
                    if (typeof source == "function") {
                        source = source();
                    }
                    if (typeof context[target] == "function") {
                        context[target](source);
                    } else {
                        context[target] = source;
                    }
                }
            };

            element = $(element);
            element.autocomplete({
                source: function (arg1, arg2) { return value(arg1, arg2, context); },
                minLength: 0,
                select: onselect,
                change: function (event, ui) {
                    if (typeof bindings.onchange == "function" && bindings.onchange(event, ui, context) == false) {
                        return;
                    }
                    if (!ui.item || !ui.item.source) {
                        if (bindings.selected) {
                            var selected = bindings.selected;
                            if (typeof selected == "function") {
                                selected = selected();
                            }
                            var target = selected.target;
                            if (typeof target == "function") {
                                target = target();
                            }
                            if (typeof context[target] == "function") {
                                context[target]("");
                            } else {
                                context[target] = "";
                            }
                        }
                        if (typeof bindings.value == "function") {
                            bindings.value("");
                        } else {
                            $(element).val("");
                        }
                    } else {
                        onselect(event, ui);
                    }
                }
            });

            element.bind("autocompleteopen.ko", function (event, ui) {
                element.data("state", 1);
            });

            element.bind("autocompleteclose.ko", function (event, ui) {
                element.data("state", 0);
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        }
    };
}

if (!window.i18n) {
    i18n = {};
}

i18n.declineCount = function (val, one, two, five) {
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

if ($.datepicker) {
    jQuery(function ($) {
        $.datepicker.regional['ru'] = {
            closeText: 'Закрыть',
            prevText: '&#x3c;Пред',
            nextText: 'След&#x3e;',
            currentText: 'Сегодня',
            monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            dayNames: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
            dayNamesShort: ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'сбт'],
            dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            weekHeader: 'Нед',
            dateFormat: 'dd.mm.yy',
            firstDay: 1,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: '',
            changeYear: true,
            yearRange: "1900:" + ((new Date()).getFullYear() + 5)
        };
        $.datepicker.setDefaults($.datepicker.regional['ru']);
    });
}

$(function () {
    initDatepicker($(".adate"));
});

function hexBlock(hex, index) {
    hex = cutHex(hex);
    var length = hex.length >= 6 ? 2 : 1;
    var pos = hex.length - length - index * length;
    var result = hex.substring(pos, pos + length);
    result = result.length == 1 ? result + result : result;
    return result;
}
function hexToR(h) { return parseInt(hexBlock(h, 2), 16); }
function hexToG(h) { return parseInt(hexBlock(h, 1), 16); }
function hexToB(h) { return parseInt(hexBlock(h, 0), 16); }
function cutHex(h) { return (h.toString().charAt(0) == "#") ? h.substring(1, h.length) : h; }

function hexToRgb(h) {
    return $.format("rgb({0}, {1}, {2})", hexToR(h), hexToG(h), hexToB(h));
}

function hexToRgba(h, alpha) {
    alpha = typeof alpha == "undefined" || isEmpty(alpha + "") ? (parseInt(hexBlock(h, 3), 16) / 255).toFixed(2) : alpha;
    alpha = isEmpty(alpha + "") ? "1" : alpha;
    return $.format("rgba({0}, {1}, {2}, {3})", hexToR(h), hexToG(h), hexToB(h), alpha);
}