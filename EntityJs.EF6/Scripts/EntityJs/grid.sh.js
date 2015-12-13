/*-- File version 0.0.0.10 from 2012.10.29 --*/
ejs.grid = function (options) {
    var me = this
    var container = null;
    var settings = {
        styleID: "stlEjsGrid",
        tableID: "tblEjsGrid" + (new Date).getMilliseconds(),
        koTemplateID: "",
        padding: 20,
        border: 1,
        columns: [],
        source: ko.obsa([]),
        sortable: false,
        disallowSort: [],
        sortMethod: null,
        autoSort: false
    };
    var scrollTimer = null;
    var columnsMenu;

    me.events = {
        columnsSaving: ejs.createEvent(),
        columnsSaved: ejs.createEvent()
    };

    var ctor = function () {
        container = $(options.container);
        $.extend(settings, options);

        me.settings = settings;
        me.orderBy.order = order;
        me.saveSettings.save = saveColumns;

        if (settings.autoSort && settings.source && settings.source.subscribe) {
            settings.source.subscribe(function () {
                orderBy.order();
            });
        }

        render();
    };

    me.orderBy = {
        name: ko.obs(""),
        path: ko.obs(""),
        desc: ko.obs(false),
        inProgress: ko.obs(false)
    };

    me.saveSettings = {
        inProgress: ko.obs(false),
        save: null
    };

    me.sorted = ko.cmp(function () {
        if (!settings.sortable || me.orderBy.inProgress() || settings.sortMethod) {
            return settings.source();
        }

        var path = orderBy.path();

        if (isEmpty(path)) {
            return settings.source();
        }

        return settings.source().orderBy(function (it) {
            var value;
            var temp = it;
            var parts = path.split(".");
            for (var i = 0; i < parts.length; i++) {
                var p = toJsName(parts[i]);

                if (typeof temp[p] == "function") {
                    value = temp[p]();
                } else if (typeof it[p] != "undefined") {
                    value = temp[p];
                } else {
                    value = "";
                }
                temp = value;
            }

            var formaters = [{
                reg: "^[-]?\\d+$",
                fn: parseInt
            }, {
                reg: "^[-]?\\d+[.]?\\d*$",
                fn: parseFloat
            }, {
                reg: "^\\d\\d[.]\\d\\d[.]\\d\\d\\d\\d$",
                fn: parseDate
            }, {
                reg: ".*",
                fn: function (v) { return v.toString().toLowerCase(); }
            }];

            for (var i = 0; i < formaters.length; i++) {
                var reg = new RegExp(formaters[i].reg, "gi");

                if (reg.test(value)) {
                    value = formaters[i].fn(value);
                    break;
                }
            }

            return value;
        }, me.orderBy.desc());
    });

    me.refresh = function () {
        setColumns(getColumns());
        setHeaderPosition();
    };

    me.getColumns = function () {
        return getColumns();
    };

    me.setColumns = function (value) {
        setColumns(value);
    };

    me.order = function () {
        me.orderBy.order();
    };

    me.refreshHeaderFooter = function () {
        setHeaderPosition(0);
    };

    function saveColumns() {
        var val = me.getColumns();
        var e = {
            name: options.settingsName,
            value: val,
            cancel: false
        };

        me.events.columnsSaving.raise(e);
        if (e.cancel) {
            return;
        }
        me.saveSettings.inProgress(true);
        ejs.saveSetting(e.name, e.value, function () {
            me.saveSettings.inProgress(false);
            me.events.columnsSaved.raise(e);
        });
    }

    function order() {
        if (!settings.sortable || me.orderBy.inProgress()) {
            return;
        }

        var colname = ejs.toJsName(me.orderBy.name());
        var path = me.orderBy.path();

        if (ejs.isEmpty(path)) {
            path = "id";
        }

        me.orderBy.inProgress(true);

        var tableHeader = container.find("thead:first");

        var div = tableHeader.find("span.col[colname=" + me.orderBy.name() + "]");

        tableHeader.find("span.col[colname]").removeClass("desc").removeClass("asc");

        if (!me.orderBy.desc()) {
            div.addClass("asc");
        } else {
            div.addClass("desc");
        }

        if (settings.sortMethod) {
            settings.sortMethod(path, me.orderBy.desc());
            me.orderBy.inProgress(false);
            return;
        }

        me.orderBy.inProgress(false);
    }

    function render() {
        columnsMenu = ["<ul class='ejsgrid-menu'><li class='button'><a href='javascript:' class='icon small delete'></a></li>"];

        if ($("#" + settings.styleID).size() < 1) {
            var style = "<style id='" + settings.styleID + "' type='text/css'></style>";
            $("head").append(style);
        }

        var ths = container.find("thead tr:first th").toArray();

        ths.forEach(function (it, i) {
            var th = $(it);
            var w = th.width();
            var colname = th.attr("colname");
            var coltitle = th.attr("title");
            var orderName = th.attr("orderBy") || th.attr("sortpath");
            var text = th.text();

            text = coltitle || text;
            orderName = orderName || colname;

            var chbID = "chb_" + settings.tableID + "_" + colname;

            if (colname != "Save") {
                columnsMenu.push("<li class='item'><div><input type='checkbox' value='", colname, "' id='", chbID, "' /><label for='", chbID, "'>", text, "</span></div></li>");
            }
        });

        ths.forEach(function (it, i) {
            var th = $(it);
            var span = th.find("span.th");
            var colname = th.attr("colname");
            var orderName = th.attr("orderBy") || th.attr("sortpath");

            span.attr("colname", colname);
            span.attr("orderBy", orderName);
            span.html("<span class='text'>" + span.html() + "</span>");

            if (settings.sortable && !settings.disallowSort.contains(colname)) {
                if (orderName != "false") {
                    span.addClass("orderable");
                    span.click(function () {
                        var oldName = me.orderBy.name();
                        var newName = colname;
                        var newOrder = orderName;

                        if (ejs.isEmpty(newOrder)) {
                            newOrder = newName;
                        }

                        if (oldName != newName) {
                            me.orderBy.name(newName);
                            me.orderBy.path(newOrder);
                            me.orderBy.desc(false);
                        } else {
                            var desc = !me.orderBy.desc();
                            me.orderBy.desc(desc);
                        }
                        me.orderBy.order();
                    });
                }
            }

            span.removeAttr("style");
            span.resizable({
                handles: "e",
                start: function (event, ui) {
                },
                stop: function (event, ui) {
                    setWidth(span, ui.size.width);
                    span.css({
                        height: "auto",
                        maxHeight: "100px"
                    });
                    makeStyle();
                    span.removeAttr("style");
                    setHeaderPosition();
                },
                resize: function (event, ui) {
                },
                helper: "ejs-resizable-helper"
            });

            span.draggable({
                revert: "invalid",
                helper: "clone",
                cursor: "move",
                start: function (event, ui) {
                    ui.helper.addClass("drag");
                },
                drag: function (event, ui) {
                },
                stop: function (event, ui) {
                }
            });

            span.droppable({
                addClasses: false,
                accept: "span.th",
                activeClass: "active",
                hoverClass: "hover",
                tolerance: "pointer",
                drop: function (event, ui) {
                    var helper = ui.helper;
                    var newTd = span.parents("th:first").get(0);
                    var oldTd = helper.parents("th:first").get(0);
                    var newIndex = newTd.cellIndex;
                    var oldIndex = oldTd.cellIndex;

                    if (oldIndex == newIndex) {
                        return;
                    }

                    sort($("#" + settings.tableID), oldIndex, newIndex);
                    sort($("#" + settings.headerTableID), oldIndex, newIndex);
                    sortTemplate(oldIndex, newIndex);
                }
            });
        });

        columnsMenu.push("</ul>");
        columnsMenu = $(columnsMenu.join(""));
        columnsMenu.find("input[type=checkbox]").change(function () {
            var chb = $(this);
            var td = container.find("thead tr:first th[colname=" + chb.val() + "]");

            if (td.size() < 1) {
                return;
            }

            td.get(0).visible = chb.checked();
            makeStyle();
            setHeaderPosition();
        });

        columnsMenu.find("a.delete").click(function () {
            columnsMenu.hide();
        });

        columnsMenu.attr("id", settings.tableID + "Menu");
        columnsMenu.hideOnClick();

        container.find("thead:first").bind("contextmenu", function (e) {
            e.preventDefault();

            var d = document;
            var x = e.pageX ? e.pageX : e.clientX + d.scrollLeft;
            var y = e.pageY ? e.pageY : e.clientY + d.scrollTop;

            columnsMenu.css({ top: y, left: x });
            columnsMenu.slideDown(200);
            columnsMenu.find("input:first").focus();

            return false;
        });

        settings.menu = columnsMenu;

        $("body").append(columnsMenu);
        settings.header = container.find("thead:first");

        setColumns(settings.columns);

        var parent = container.parent();
        parent.scroll(function () {
            setHeaderPosition(500);
        });
        setHeaderPosition();
    };

    function setHeaderPosition(delay) {
        var parent = container.parent();
        var oldScroll = parent.data("scroll");
        var parentScrollTop = parent.scrollTop();
        var tableFooter = container.find("tfoot td.pager");
        var tableHeader = settings.header.find("th");

        var parentH = parseInt(parent.height());
        var containerH = parseInt(container.height());
        var footerH = parseInt(tableFooter.outerHeight());
        var headerH = parseInt(tableHeader.outerHeight());
        var parentW = parseInt(parent.width());
        var containerW = parseInt(container.width());

        var footerBottom = 0;

        if (containerH > parentH) {
            footerBottom = containerH - parentH - parentScrollTop;// - options.padding;
            if (parentW < containerW) {
                footerBottom += 15;
            }
            if (footerBottom <= 0) {
                footerBottom = 1;
            }
        }

        parent.data("scroll", parentScrollTop);
        if (oldScroll != parentScrollTop) {
            tableHeader.css({ top: "0px" });
            tableFooter.css({ bottom: "0px", visibility: "hidden" });
        }
        clearTimeout(scrollTimer);

        if (delay) {
            scrollTimer = setTimeout(function () {
                tableHeader.css({ top: parentScrollTop + "px" });
                tableFooter.css({ bottom: footerBottom + "px", visibility: "visible" });
            }, 500);
        } else {
            tableHeader.css({ top: parentScrollTop + "px" });
            tableFooter.css({ bottom: footerBottom + "px", visibility: "visible" });
        }
    }

    function getColumns() {
        var tableHeader = me.settings.header;
        var columns = [];

        tableHeader.find("th[colname]").each(function (n) {
            var td = $(this);
            var span = td.find("span.th");
            var colname = td.attr("colname");
            var orderBy = td.attr("orderBy");
            columns.push({
                colname: colname,
                orderBy: orderBy,
                index: n,
                width: span.width(),
                visible: td.get(0).visible === false ? false : true,
                order: colname == me.orderBy.name() ? true : false,
                desc: me.orderBy.desc()
            });
        });

        return columns;
    }

    function setColumns(columns) {
        if (!columns || !columns.length) {
            makeStyle();
            return;
        }

        makeStyle(columns);

        var tableHeader = me.settings.header;
        var columnsMenu = me.settings.menu;
        var tds = tableHeader.find("th").toArray().select(function (it, i) {
            var td = $(it);
            var span = td.find("span.th");
            var colname = td.attr("colname");
            var c = columns.first("val=>val.colname=='" + colname + "'");
            var chb = columnsMenu.find("input[value=" + colname + "]:first");
            var r = {
                td: td,
                span: span,
                colname: colname,
                c: c,
                chb: chb
            };
            return r;
        }).orderByDesc(function (it, i) {
            it.index = it.c ? it.c.index : -1;
            return it.index;
        });

        tds.forEach(function (it, i) {
            var td = it.td;
            var span = it.span;
            var colname = it.colname;
            var c = it.c;
            var chb = it.chb;
            var visible = true;

            if (c) {
                visible = c.visible === false ? false : true;
            } else {
                visible = td.get(0);
            }

            chb.checked(visible);
            td.get(0).visible = visible;

            var oldIndex = td.get(0).cellIndex;
            var newIndex = 0;
            sort($("#" + settings.tableID), oldIndex, newIndex);
            sortTemplate(oldIndex, newIndex);

            if (c && c.order) {
                me.orderBy.name(c.colname);
                me.orderBy.path(c.orderBy);
                me.orderBy.desc(c.desc);
            }
        });

        me.orderBy.order();
    }

    function makeStyle(columns) {
        var style = [];
        var colCount = 0;
        var getColStyle = function (n, w, v) {
            var s = [];
            w = parseInt(w) - me.settings.padding > 0 ? w : 100;
            var wp = parseInt(w) - me.settings.padding;

            s.push(["#", me.settings.tableID, " th[colname=", n, "] {max-width:", w, "px; min-width:", w, "px; width:", w, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " th[colname=", n, "] span.th {display:block;max-width:", w, "px; min-width:", w, "px; width:", w, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " td[colname=", n, "] {max-width:", wp, "px; min-width:", wp, "px; width:", wp, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " td[colname=", n, "] div.td {max-width:", wp, "px; min-width:", wp, "px; width:", wp, "px;}\n"].join(""));

            if (v === false) {
                s.push(["#", me.settings.tableID, " th[colname=", n, "] {display:none;}\n"].join(""));
                s.push(["#", me.settings.tableID, " td[colname=", n, "] {display:none;}\n"].join(""));
            }

            return s.join("");
        };

        var ths = settings.header.find("th[colname]").toArray();

        if (columns && columns.length > 0) {
            ths.forEach(function (it, i) {
                var th = $(it);
                var span = th.find("span.th");
                var text = span.find("span.text");
                var w = parseInt(text.outerWidth());
                var colname = th.attr("colname");
                var c = columns.first("val=>val.colname=='" + colname + "'");
                if (c) {
                    style.push(getColStyle(c.colname, c.width, c.visible));
                } else {
                    style.push(getColStyle(colname, w, true));
                }
            });
        } else {
            ths.forEach(function (it, i) {
                var td = $(it);
                var span = td.find("span.th");
                var text = span.find("span.text");
                var w = parseInt(text.outerWidth());
                var v = td.get(0).visible;
                var colname = td.attr("colname");
                style.push(getColStyle(colname, w, v));
            });
        }

        $("#" + me.settings.styleID).html(style.join(""));
    }

    function setWidth(el, w) {
        el.css({
            width: w + "px",
            minWidth: w + "px",
            maxWidth: w + "px"
        });
    }

    function sort(table, oldIndex, newIndex) {
        table.find("tr").each(function () {
            var cells = $(this).children("td, th");

            if (newIndex < oldIndex) {
                $(cells[newIndex]).before(cells[oldIndex]);
            } else {
                $(cells[newIndex]).after(cells[oldIndex]);
            }
        });
    }

    function sortTemplate(oldIndex, newIndex) {
        var tbl = $("<table/>");
        tbl.html($("#" + me.settings.koTemplateID).html());
        sort(tbl, oldIndex, newIndex);
        $("#" + me.settings.koTemplateID).replaceWith([
                    "<script type='text/html' id='", me.settings.koTemplateID, "'>",
                    tbl.html(),
                    "</", "script>"
                ].join(""));
    };

    ctor();
};