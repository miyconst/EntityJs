/*-- File version 0.0.0.8 from 2013.10.30 --*/
var parseBool = function (str) {
    var result;
    result = str === true || str === "true" || str === "True" || str === 1 || str === "1";
    return result;
}

var isMvcDate = function (date) {
    if (typeof date != "string" || !date.startsWith("/"))
        return false;
    var reg = new RegExp("[/]Date[(][-]?(\\d+([+-]\\d+([:]\\d+)?)?)[)][/]", "gi");
    return reg.test(date);
};

var addTimeZone = function (date, offset) {
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    var result = new Date(utc + (3600000 * offset));
    return result;
};

var parseMvcDate = function (date) {
    var result = new Date(parseInt(date.substr(6)));
    if (typeof ApplicationTimeZoneOffset != "undefined") {
        result = addTimeZone(result, ApplicationTimeZoneOffset);
    }
    return result;
};

var parseDate = function (str, format) {
    format = format || $.datepicker._defaults.dateFormat;

    if (isMvcDate(str)) {
        return parseMvcDate(str);
    } else {
        return $.datepicker.parseDate(format, str);
    }
};

var parseDateTime = function (str) {
    var values = str.split(" ");
    var date = parseDate(values[0]);
    var times = values[1].split(":");

    date.setHours(times[0]);
    date.setMinutes(times[1]);

    if (times[2]) {
        date.setSeconds(times[2]);
    }

    return date;
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

Date.prototype.toShortDateString = function (format) {
    format = format || $.datepicker._defaults.dateFormat;
    return $.datepicker.formatDate(format, this);
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

    var endTz = dateEnd.getTimezoneOffset();
    var beginTz = dateBegin.getTimezoneOffset();

    var diffMiliseconds = dateEnd - dateBegin;
    diffMiliseconds -= (endTz - beginTz) * 60 * 1000;

    result.days = parseInt(diffMiliseconds / 1000 / 3600 / 24);
    result.hours = parseInt(diffMiliseconds / 1000 / 3600);
    result.minutes = parseInt(diffMiliseconds / 1000 / 60);
    result.seconds = parseInt(diffMiliseconds / 1000);
    result.diff = diffMiliseconds;

    return result;
};

Date.prototype.toShortTimeString = function (withSeconds) {
    var h = this.getHours();
    var m = this.getMinutes();
    var s = this.getSeconds();
    if (h < 10) {
        h = "0" + h.toString();
    }
    if (m < 10) {
        m = "0" + m.toString();
    }
    if (s < 10) {
        s = "0" + s.toString();
    }
    if (withSeconds) {
        return h + ":" + m + ":" + s;
    }
    return h + ":" + m;
};
Date.prototype.toSts = Date.prototype.toShortTimeString;

RegExp.escape = function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

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
        contentType: options.contentType || "application/json; charset=utf-8",
        dataType: options.dataType || "json",
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
        }
    });
};

$.xdr = function (options) {
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
            if (ejs.isEmpty(text + ""))
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
            if (min && val * 1 < min * 1) {
                val = min;
            }
            if (max && val * 1 > max * 1) {
                val = max;
            }
            $(this).val(val);
            $(this).change();
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
jQuery.fn.rating = function (settings) {
    return $(this).each(function () {
        if (settings == "value") {
            return this.rating.value(arguments[0]);
        } else if (settings == "refresh") {
            this.rating.refresh();
        }

        if (this.rating) {
            return;
        } else {
            this.rating = true;
        }

        var options = {
            value: 0,
            size: 5,
            step: 4,
            emptyChar: "☆",
            fullChar: "★",
            charWidth: 20,
            enable: true,
            padding: 1,
            emptyColor: "black",
            fullColor: "red",
            hoverColor: "green",
            activeColor: "yellow"
        };

        $.extend(options, settings);

        var txt = $(this);
        var uid = (new Date).getTime();
        var spnID = "spnRating" + uid;
        var spnContainer = $("<span class='rating-container' id='" + spnID + "'/>");
        var html = [];
        var setValue = function (v) {
            spnContainer.find(".rating-char").each(function (n) {
                var spn = $(this);
                var i = (n + 1) * options.step;

                if (i < v) {
                    spn.find(".rating-full").css("width", options.charWidth + "px");
                } else if (i - v < options.step) {
                    var s = options.step - (i - v);
                    var wf = options.charWidth / options.step * s;
                    spn.find(".rating-full").css("width", wf + "px");
                } else {
                    spn.find(".rating-full").css("width", "0px");
                }
            });
        };
        var renderStyle = function () {
            var id = "stlRating" + uid;
            var style = ["<style type='text/css' id='", id, "'>",
                "#", spnID, ".rating-container { white-space:nowrap; display:inline-block; overflow:hidden; font-family:SimSun; font-size:", options.charWidth, "px; width:", ((options.charWidth + options.padding * 2) * options.size), "px; }",
                " #", spnID, ".rating-container span { display:inline-block; overflow:hidden; vertical-align:middle; }",
                " #", spnID, ".rating-container .rating-char { padding:0px ", options.padding, "px; }",
                " #", spnID, ".rating-container span.rating-full { position:relative; left:-", options.charWidth, "px; color:", options.fullColor, "; }",
                " #", spnID, ".rating-container span.rating-empty { color:", options.emptyColor, "; }",
                " #", spnID, ".rating-container span.rating-char { width:", options.charWidth, "px; text-align:center; cursor:pointer; }",
                " #", spnID, ".rating-container.rating-enable:hover span.rating-full { color:", options.hoverColor, "; }",
                " #", spnID, ".rating-container.rating-enable:active span.rating-full { color:", options.activeColor, "; }",
                "</style>"
            ];

            $("#" + id).remove();
            $("head").append(style.join(""));
        };
        var checkValue = function (v) {
            if (v < 0) {
                return 0;
            } else if (v > options.size * options.step) {
                return options.size * options.step;
            }

            return v;
        };
        var getClickValue = function (e) {
            var w = options.charWidth + options.padding * 2;
            var x = e.pageX - spnContainer.offset().left + options.padding * 2;
            var v = parseInt(x / w * options.step);

            if (v * w < x) {
                v++;
            }

            return v;
        };
        var rating = {};

        rating.value = function () {
            if (arguments.length) {
                var v = checkValue(arguments[0]);
                options.value = v;
                setValue(v);
                txt.val(v);
                txt.change();

                if (typeof options.change == "function") {
                    options.change(rating, options.value);
                }
            }

            return options.value;
        };

        rating.refresh = function () {
            rating.value(txt.val());
        };

        for (var i = 0; i < options.size; i++) {
            html.push("<span class='rating-char'>");
            html.push("<span class='rating-empty'>", options.emptyChar, "</span>");
            html.push("<span class='rating-full'>", options.fullChar, "</span>");
            html.push("</span>");
        }

        spnContainer.html(html.join(""));
        txt.after(spnContainer);

        options.value = txt.val();

        setValue(options.value);

        spnContainer.hover(function () {
        }, function () {
            setValue(options.value);
        });

        spnContainer.mousemove(function (e) {
            if (!options.enable) {
                return;
            }

            var v = getClickValue(e);
            setValue(v);
        });

        spnContainer.click(function (e) {
            if (!options.enable) {
                return;
            }

            var v = getClickValue(e);
            rating.value(v);
        });

        txt.change(function () {
            var v = txt.val();

            if (v != options.value) {
                rating.value(v);
            }
        });

        if (options.enable) {
            spnContainer.addClass("rating-enable");
        }

        renderStyle();

        txt.hide();
        txt.get(0).rating = rating;
    });
};

jQuery.fn.hideOnClick = function () {
    var me = $(this);
    me.hover(function () {
        me.data("hover", true);
    }, function () {
        me.data("hover", false);
    });

    $(document).click(function () {
        if (!me.is(":visible") || me.is(":animated")) {
            return;
        }

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

if (jQuery.fn.datepicker) {
    jQuery.fn.datepicker.initDatepicker = function (selector, options) {
        options = options || {};
        var originOnSelect = options.onSelect;
        var originBeforeShow = options.beforeShow;

        $(selector).each(function () {
            var s = $(this);
            options.onSelect = originOnSelect || function (dateText, inst) {
                $(inst.input).trigger("change");
            };
            options.beforeShow = originBeforeShow || function () {
                $("#ui-datepicker-div").data("input", s);
                s.setRange(s.val());
            };

            s.datepicker("destroy");
            s.datepicker(options);

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
                try { val = parseDate(val); }
                catch (e) { }

                if (dateTo) {
                    s.datepicker("option", "maxDate", dateTo);
                } else if ($(to).length > 0) {
                    var toElem = $(to);
                    try { dateTo = parseDate(toElem.val()); }
                    catch (e) { }

                    s.datepicker("option", "maxDate", dateTo);
                    toElem.datepicker("option", "minDate", val ? val : dateFrom);

                    //toElem.unbind("change.minmax");
                    //toElem.bind("change.minmax", function () { s.change(); });
                }

                if (dateFrom) {
                    s.datepicker("option", "minDate", dateFrom);
                } else if ($(from).length > 0) {
                    var fromElem = $(from);
                    try { dateFrom = parseDate(fromElem.val()); }
                    catch (e) { }

                    s.datepicker("option", "minDate", dateFrom);
                    fromElem.datepicker("option", "maxDate", val ? val : dateTo);

                    //fromElem.unbind("change.minmax");
                    //fromElem.bind("change.minmax", function () { s.change(); });
                }
            };
            s.setRange(s.val());
        });
    };

    $.datepicker._generateMonthYearHeader_original = $.datepicker._generateMonthYearHeader;

    $.datepicker._generateMonthYearHeader = function (inst, dm, dy, mnd, mxd, s, mn, mns) {
        var header = $($.datepicker._generateMonthYearHeader_original(inst, dm, dy, mnd, mxd, s, mn, mns));
        var years = header.find('.ui-datepicker-year');

        // reverse the years
        years.html(Array.prototype.reverse.apply(years.children()));

        // return our new html
        return $('<div />').append(header).html();
    }
}

$.userSettings = function (value) {
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
        $.userSettings(value(settings));
    }

    return settings;
};