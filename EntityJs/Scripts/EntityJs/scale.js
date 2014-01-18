/*-- File version 0.0.0.04 from 2012.12.11 --*/
ejs.scale = function (params) {
    var me = this;
    var settings = {
        container: null,
        values: [],
        start: 0,
        end: 10,
        range: 1,
        type: "number",
        autoRefresh: false,
        refreshOnDrag: false
    };
    var currentValues = [];
    var currentStepWidth = 0;
    var value = null;
    var valueIndex = -1;

    me.events = {
        changed: ejs.createEvent()
    };

    var ctor = function () {
        $.extend(settings, params);
        me.settings = settings;
        me.container = $(me.settings.container);
        me.refresh();

        if (me.settings.value) {
            me.value(me.settings.value);
        }
    };

    me.value = function () {
        if (arguments.length > 0) {
            var newValue = arguments[0];
            //var index = currentValues.indexOf(newValue) || currentValues.first("val=>val.value=='" + newValue + "'");
            var index = currentValues.findIndex(function (it) { return it == newValue || it.value == newValue; });

            me.index(index);
        }

        return value;
    };

    me.index = function () {
        if (arguments.length > 0) {
            var newIndex = arguments[0];
            var newValue = currentValues[newIndex];
            var oldValue = value;
            var oldIndex = valueIndex;

            value = newValue;
            valueIndex = newIndex;
            refreshPosition();
            me.events.changed.raise({ oldValue: oldValue, newValue: newValue, newIndex: newIndex, oldIndex: oldIndex, range: me.settings.range });
        }

        return valueIndex;
    };

    me.refresh = function () {
        currentValues = getValues();
        currentStepWidth = getStepWidth(currentValues);
        value = currentValues[0];
        valueIndex = 0;

        refreshKo();
        render();
    };

    me.start = function () {
        if (arguments.length > 0) {
            me.settings.start = arguments[0];
            if (me.ko) {
                me.ko.start(me.settings.start);
            }
            autoRefresh();
        }

        return me.settings.start;
    };

    me.end = function () {
        if (arguments.length > 0) {
            me.settings.end = arguments[0];
            if (me.ko) {
                me.ko.end(me.settings.end);
            }
            autoRefresh();
        }

        return me.settings.end;
    };

    me.range = function () {
        if (arguments.length > 0) {
            me.settings.range = arguments[0];
            if (me.ko) {
                me.ko.end(me.settings.range);
            }
            autoRefresh();
        }

        return me.settings.range;
    };

    me.toKo = function () {
        if (me.ko) {
            return me.ko;
        }

        me.ko = {
            start: ko.obs(""),
            end: ko.obs(""),
            value: ko.obs(""),
            valueIndex: ko.obs("")
        };

        me.events.changed.attach(function (e) {
            me.ko.value(value);
            me.ko.valueIndex(valueIndex);
        });

        refreshKo();

        return me.ko;
    };

    function refreshKo() {
        if (!me.ko) {
            return;
        }

        me.ko.start(me.settings.start);
        me.ko.end(me.settings.end);
        me.ko.value(value);
        me.ko.valueIndex(valueIndex);
    }

    function autoRefresh() {
        if (!me.settings.autoRefresh) {
            return;
        }

        me.refresh();
    }

    function refreshPosition() {
        var w = currentStepWidth;
        me.container.find(".ejsScaleCaret").css("left", valueIndex * w + "px");
    }

    function render() {
        var values = currentValues;
        var w = currentStepWidth;
        var html = [];

        html.push(renderMarks(values));
        html.push(renderScroll(values));

        me.container.html(html.join(""));

        me.container.find(".ejsScaleCaret").draggable({
            grid: [w, w],
            containment: "parent",
            drag: function (event, ui) {
                if (!settings.refreshOnDrag) {
                    return;
                }

                var left = ui.position.left;
                var index = left / w;

                me.index(index);
            },
            stop: function (event, ui) {
                if (settings.refreshOnDrag) {
                    return;
                }

                var left = ui.position.left;
                var index = left / w;

                me.index(index);
            }
        });

        me.container.find(".ejsScaleCell").each(function (n) {
            var cell = $(this);
            cell.click(function () {
                if (me.index() >= n) {
                    me.index(n);
                } else if (me.index() + me.range() <= n) {
                    me.index(n - me.range() + 1);
                }
            });
        });

        var p = (me.container.width() - currentStepWidth * currentValues.length) / 2;
        me.container.css({
            paddingLeft: p + "px",
            paddingRight: p + "px"
        });
    }

    function renderScroll(values) {
        var w = currentStepWidth;
        var html = ["<div class='ejsScaleScroll'>"];
        for (var i = 0; i < values.length; i++) {
            html.push("<span class='ejsScaleCell' style='width:", w, "px' ></span>");
        }
        html.push("<div class='ejsScaleCaret' style='width: ", w * me.settings.range, "px;'></div>");
        return html.join("");
    }

    function getStepWidth(values) {
        return parseInt(me.container.width() / values.length);
    }

    function renderMarks(values) {
        var w = currentStepWidth;
        var html = ["<div class='ejsScaleMarks'>"];

        values.forEach(function (it, i) {
            html.push("<span class='ejsScaleMark' style='width: ", w, "px;'>", it.title || it, "</span>");
        });

        html.push("</div>");
        return html.join("");
    }

    function getValues() {
        if (typeof me.settings.values == "function") {
            return me.settings.values();
        }

        var values = me.settings.values;

        if (!values.length) {
            values = [];
            switch (me.settings.type) {
                case "date":
                    var start = ejs.gfv(me.settings.start);
                    var end = ejs.gfv(me.settings.end);

                    start = parseDate(start);
                    end = parseDate(end);

                    if (start > end) {
                        var m = start;
                        start = end;
                        end = m;
                    }

                    while (start <= end) {
                        values.push({ value: start, title: start.toSds() });
                        start.setDate(start.getDate() + 1);
                    }

                    break;
                default:
                    var start = parseInt(ejs.gfv(me.settings.start));
                    var end = parseInt(ejs.gfv(me.settings.end));

                    if (start > end) {
                        var m = start;
                        start = end;
                        end = m;
                    }

                    while (start <= end) {
                        values.push(start);
                        start++;
                    }

                    break;
            }
        }
        return values;
    }

    ctor();
};