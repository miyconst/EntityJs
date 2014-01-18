/*-- File version 0.0.1.11 from 2013.10.26 --*/
ejs.grid = function (options) {
    var me = this
    var container = null;
    var settings = {
        styleID: "stlEjsGrid",
        tableID: "tblEjsGrid" + (new Date).getMilliseconds(),
        headerTableID: "",
        koTemplateID: "",
        headerContainer: null,
        padding: 20,
        border: 1,
        columns: [],
        source: ko.obsa([]),
        sortable: options.sortable || false,
        disallowSort: [],
        sortMethod: null,
        autoSort: options.autoSort || false,
        filter: false,
        filterVisible: false,
        pageSize: -1
    };
    var scrollTimer = null;
    var heightTimer = null;
    var headerTable;
    var columnsMenu;

    me.events = {
        columnsSaving: ejs.createEvent(),
        columnsSaved: ejs.createEvent()
    };

    var ctor = function () {
        container = $(options.container);
        $.extend(settings, options);
        settings.headerTableID = settings.tableID + "Header";

        me.settings = settings;
        me.orderBy.order = order;
        me.saveSettings.save = saveColumns;

        if (settings.orderBy) {
            me.orderBy.path(settings.orderBy);
        }

        if (typeof settings.orderDesc != "undefined") {
            me.orderBy.desc(settings.orderDesc);
        }

        if (settings.autoSort && settings.source && settings.source.subscribe) {
            settings.source.subscribe(function () {
                me.orderBy.order();
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
        var path = me.orderBy.path();

        if (!settings.sortable || me.orderBy.inProgress() || settings.sortMethod) {
            return settings.source();
        }


        if (isEmpty(path)) {
            return settings.source();
        }

        return settings.source().orderBy(function (it) {
            var value;
            var temp = it;
            var parts = path.split(".");
            for (var i = 0; i < parts.length; i++) {
                var p = ejs.toJsName(parts[i]);

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
                fn: function (v) { return (v || "").toString().toLowerCase(); }
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

    me.toggleFilter = function (is) {
        if (!settings.filter) {
            return;
        }
        var tr = settings.headerContainer.find("tr.filter");
        if (typeof is != "undefined" && is) {
            tr.show();
            tr.get(0).visible = true;
        } else if (typeof is != "undefined" && !is) {
            tr.hide();
            tr.get(0).visible = false;
        } else {
            tr.toggle(is);
            tr.get(0).visible = !tr.get(0).visible;
        }
        setHeaderPosition();
    };

    me.print = function (onlySelected) {
        var columns = me.getColumns().columns;
        var html = ["<table class='ejsgrid-print'><thead><tr>"];

        columns.forEach(function (it, i) {
            if (it.colname == "Select" || it.colname == "Save" || !it.visible) {
                return;
            }
            var td = settings.headerContainer.find("tr:first td[colname=" + it.colname + "]:first");
            html.push("<th>", td.text(), "</th>");
        });

        html.push("</tr></thead><tbody>");

        container.find("tr.datarow").each(function () {
            var tr = $(this);
            if (onlySelected && !tr.find("td[colname=Select] input").checked()) {
                return;
            }
            html.push("<tr>");
            columns.forEach(function (it, i) {
                if (it.colname == "Select" || it.colname == "Save" || !it.visible) {
                    return;
                }

                var td = tr.find("td[colname=" + it.colname + "]:first");
                var text = td.text();
                if (!text.length && td.find("input[type=checkbox]").checked()) {
                    text = ejs.crud ? ejs.crud.getDefaultTextProvider().bool.yes : "True";
                }
                html.push("<td>", text, "</td>");
            });
            html.push("</tr>");
        });

        html.push("</tbody></table>");
        return html.join("");
    };

    me.pageSize = function () {
        if (arguments.length) {
            me.settings.pageSize = arguments[0];
        }

        return me.settings.pageSize;
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

        var div = headerTable.find("tr:first div.col[colname=" + me.orderBy.name() + "]");

        headerTable.find("tr:first div.col[colname]").removeClass("desc");
        headerTable.find("tr:first div.col[colname]").removeClass("asc");

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
        var menuItems = [];
        headerTable = ["<div class='ejsgrid-header'><table class='header' id='", settings.headerTableID, "'><tr>"];
        columnsMenu = ["<div class='ejsgrid-menu'><ul class='ejsgrid-menu'><li class='button'><a href='javascript:' class='icon small delete'></a></li>"];

        container.find("thead tr:first th").each(function (i) {
            var th = $(this);
            var w = th.width();
            var colname = th.attr("colname");
            var coltitle = th.attr("title");
            var orderName = th.attr("orderBy") || th.attr("sortpath");
            var text = th.text();

            text = coltitle || text;
            orderName = orderName || colname;

            var chbID = "chb_" + settings.headerTableID + "_" + colname;
            headerTable.push("<td colname='", colname, "' data-bind='", th.attr("data-bind"), "'><div class='col' style='width:", w, "px;' colname='", colname, "'", " orderBy='", orderName, "'", "><div class='text'>", th.html() || "&nbsp;", "</div></div></td>");

            if (colname != "Save") {
                menuItems.push({ title: text, html: ["<li class='item nowrap'><div><input type='checkbox' checked='checked' value='", colname, "' id='", chbID, "' /><label for='", chbID, "'>", text, "</label></div></li>"].join("") });
            }
        });

        menuItems = menuItems.orderBy("val=>val.title").select("val=>val.html");
        columnsMenu = columnsMenu.concat(menuItems);

        columnsMenu.push("</ul></div>");
        headerTable.push("</tr>");

        if (settings.filter) {
            headerTable.push("<tr class='filter'>");
            container.find("thead tr.filter td").each(function (i) {
                var td = $(this);
                var w = td.width();
                var colname = td.attr("colname");
                var coltitle = td.attr("title");
                var orderName = td.attr("orderBy") || td.attr("sortpath");

                orderName = orderName || colname;

                headerTable.push(["<td colname='", colname, "' data-bind='", td.attr("data-bind"), "'><div class='col' style='width:", w, "px;' colname='", colname, "'",
                                    " orderBy='", orderName, "'", "><div class='text'>", td.html() || "&nbsp;", "</div></div></td>"].join(""));
            });
            headerTable.push("</tr>");
        }

        headerTable.push("</table></div>");
        headerTable = $(headerTable.join(""));
        headerTable.find("tr:first div.col[colname]").each(function (n) {
            var div = $(this);
            var th = $(container.find("thead tr:first th").get(n));

            if (settings.sortable && settings.disallowSort.indexOf(div.attr("colname")) < 0) {
                var newName = div.attr("colname");
                var orderPath = div.attr("orderBy");
                if (orderPath !== "false") {
                    div.addClass("orderable");
                    div.click(function () {
                        var oldName = me.orderBy.name();

                        if (ejs.isEmpty(orderPath)) {
                            orderPath = newName;
                        }

                        if (oldName != newName) {
                            me.orderBy.name(newName);
                            me.orderBy.path(orderPath);
                            me.orderBy.desc(false);
                        } else {
                            var desc = !me.orderBy.desc();
                            me.orderBy.desc(desc);
                        }
                        me.orderBy.order();
                    });
                }
            }

            div.removeAttr("style");
            div.resizable({
                handles: "e",
                start: function (event, ui) {
                },
                stop: function (event, ui) {
                    setWidth(div, ui.size.width);
                    div.css({
                        height: "auto",
                        maxHeight: "100px"
                    });
                    makeStyle();
                    div.removeAttr("style");
                    setHeaderPosition();
                },
                resize: function (event, ui) {
                },
                helper: "ejs-resizable-helper"
            });

            div.draggable({
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

            div.droppable({
                addClasses: false,
                accept: "div.col",
                activeClass: "active",
                hoverClass: "hover",
                tolerance: "pointer",
                drop: function (event, ui) {
                    var helper = ui.helper;
                    var newTd = div.parents("td:first").get(0);
                    var oldTd = helper.parents("td:first").get(0);
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

        columnsMenu = $(columnsMenu.join(""));
        $("body").append(columnsMenu);
        columnsMenu.find("input[type=checkbox]").change(function () {
            var chb = $(this);
            var td = headerTable.find("td[colname=" + chb.val() + "]");

            if (td.size() < 1) {
                return;
            }

            td.get(0).visible = chb.checked();
            makeStyle();
            setHeaderPosition();
        });

        columnsMenu.find("a").click(function () {
            columnsMenu.hide();
        });

        columnsMenu.attr("id", settings.headerTableID + "Menu");
        columnsMenu.hideOnClick();

        headerTable.find("table tr:first").bind("contextmenu", function (e) {
            e.preventDefault();

            var z = Math.max.apply(null, $.map($('body > *'), function (e, n) {
                if ($(e).css('position') == 'absolute') {
                    return parseInt($(e).css('z-index')) || 1;
                }
            }));

            var d = document;
            var x = e.pageX ? e.pageX : e.clientX + d.scrollLeft;
            var y = e.pageY ? e.pageY : e.clientY + d.scrollTop;

            columnsMenu.css({ top: y, left: x, zIndex: z + 10 });
            columnsMenu.slideDown(200);
            columnsMenu.find("input:first").focus();

            return false;
        });

        settings.menu = columnsMenu;
        settings.header = headerTable;

        settings.headerContainer.prepend(headerTable);
        settings.headerContainer.css("position", "relative");

        setColumns(settings.columns);
        if (!settings.columns && settings.autoRefresh) {
            me.orderBy.order();
        }
        container.find("thead").hide();

        var parent = container.parent();
        parent.scroll(function () {
            setHeaderPosition(500);
        });
        $(window).resize(function () {
            setParentHeight();
        });
        setParentHeight();
    };

    function setParentHeight() {
        if (!options.parentScroll) {
            return;
        }

        clearTimeout(heightTimer);

        heightTimer = setTimeout(function () {
            var scrollParent = container.parents(options.parentScroll);
            if (!scrollParent.length) {
                return;
            }

            var parent = container.parent();
            var oldH = 0;
            var newH = 0;
            var h = 200;

            parent.css("height", h + "px");
            oldH = scrollParent.get(0).scrollHeight;

            for (var i = 0; i < 200; i++) {
                h += 5;
                parent.css("height", h + "px");
                newH = scrollParent.get(0).scrollHeight;

                if (newH > oldH) {
                    h -= 5;
                    parent.css("height", h + "px");
                }
            }

            setHeaderPosition();
        }, 50);
    }
    me.setParentHeight = setParentHeight;

    function setHeaderPosition(delay) {
        var parent = container.parent();
        var oldScroll = parent.data("scroll");
        var parentScrollTop = parent.scrollTop();
        var tableFooter = container.find("tfoot td.pager");
        var headerContainer = settings.headerContainer;

        var parentH = parseInt(parent.outerHeight());
        var containerH = parseInt(container.outerHeight());
        var footerH = parseInt(tableFooter.outerHeight());
        var headerH = parseInt(headerContainer.outerHeight());
        var parentW = parseInt(parent.width());
        var containerW = parseInt(container.width());

        var footerBottom = 0;

        if (containerH > parentH) {
            footerBottom = containerH + headerH - parentH - parentScrollTop - 1;
            if (parent.get(0).clientWidth < parent.get(0).scrollWidth) {
                footerBottom += 15;
            }
            if (footerBottom <= 0) {
                footerBottom = 1;
            }
        }

        parent.data("scroll", parentScrollTop);
        if (oldScroll != parentScrollTop) {
            headerContainer.css({ top: "0px" });
            tableFooter.css({ bottom: "0px", visibility: "hidden" });
        }
        clearTimeout(scrollTimer);

        var setSize = function () {
            headerContainer.css({ top: parentScrollTop + "px" });
            tableFooter.css({ bottom: footerBottom + "px", visibility: "visible" });

            if (parentScrollTop > 0) {
                headerContainer.addClass("moved");
            } else {
                headerContainer.removeClass("moved");
            }

            if (footerBottom > 0) {
                tableFooter.addClass("moved");
            } else {
                tableFooter.removeClass("moved");
            }
        };

        if (delay) {
            scrollTimer = setTimeout(setSize, 500);
        } else {
            setSize();
        }
    }

    function getColumns() {
        var headerTable = me.settings.header;
        var columns = [];
        var isFilter = false;

        if (settings.filter) {
            isFilter = settings.headerContainer.find("tr.filter").get(0).visible;
        }

        headerTable.find("tr:first td[colname]").each(function (n) {
            var td = $(this);
            var div = td.find("div[colname]");
            var colname = div.attr("colname");
            var orderBy = div.attr("orderBy");
            columns.push({
                colname: colname,
                orderBy: orderBy,
                index: n,
                width: div.width(),
                visible: td.get(0).visible === false ? false : true,
                order: colname == me.orderBy.name() ? true : false,
                desc: me.orderBy.desc()
            });
        });

        var result = {
            columns: columns,
            isFilter: !!isFilter,
            pageSize: me.settings.pageSize
        };

        return result;
    }

    function setColumns(value) {
        if (!value) {
            makeStyle();
            me.toggleFilter(me.settings.filterVisible);
            return;
        }

        var columns = value.columns || value;
        var isFilter = value.isFilter;

        if (ejs.isEmpty(isFilter)) {
            isFilter = me.settings.filterVisible;
        }

        if (!columns || !columns.length) {
            makeStyle();
            me.toggleFilter(isFilter);
            return;
        }

        makeStyle(columns);

        var headerTable = me.settings.header;
        var columnsMenu = me.settings.menu;
        var tds = headerTable.find("tr:first td").toArray().select(function (it, i) {
            var td = $(it);
            var div = td.find("div.col");
            var colname = div.attr("colname");
            var c = columns.first("val=>val.colname=='" + colname + "'");
            var chb = columnsMenu.find("input[value=" + colname + "]:first");
            var r = {
                td: td,
                div: div,
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
            var div = it.div;
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
            sort(container, oldIndex, newIndex);
            sort(headerTable, oldIndex, newIndex);
            sortTemplate(oldIndex, newIndex);

            if (c && c.order) {
                me.orderBy.name(c.colname);
                me.orderBy.path(c.orderBy);
                me.orderBy.desc(c.desc);
            }
        });

        me.settings.pageSize = value.pageSize || -1;
        me.toggleFilter(isFilter);
        me.orderBy.order();
    }

    function makeStyle(columns) {
        var style = [];
        var headerTable = me.settings.header;
        var colCount = 0;
        var getColStyle = function (n, w, v) {
            var s = [];
            w = parseInt(w) - me.settings.padding > 0 ? w : 100;
            var wp = parseInt(w) - me.settings.padding;

            s.push(["#", me.settings.headerTableID, " td[colname=", n, "] {max-width:", w, "px; min-width:", w, "px; width:", w, "px;}\n"].join(""));
            s.push(["#", me.settings.headerTableID, " div[colname=", n, "] {max-width:", w, "px; min-width:", w, "px; width:", w, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " th[colname=", n, "] {max-width:", w, "px; min-width:", w, "px; width:", w, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " th[colname=", n, "] span.th {display:block;max-width:", wp, "px; min-width:", wp, "px; width:", wp, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " td[colname=", n, "] {max-width:", wp, "px; min-width:", wp, "px; width:", wp, "px;}\n"].join(""));
            s.push(["#", me.settings.tableID, " td[colname=", n, "] div.td {max-width:", wp, "px; min-width:", wp, "px; width:", wp, "px;}\n"].join(""));

            if (v === false) {
                s.push(["#", me.settings.headerTableID, " td[colname=", n, "] {display:none;}\n"].join(""));
                s.push(["#", me.settings.tableID, " td[colname=", n, "] {display:none;}\n"].join(""));
            }
            if (wp < 50) {
                s.push(["#", me.settings.headerTableID, " div[colname=", n, "] div.conditions {display:none;}\n"].join(""));
                s.push(["#", me.settings.headerTableID, " div[colname=", n, "] div.control {margin-right:0px;}\n"].join(""));
            }

            return s.join("");
        };

        if (columns && columns.length > 0) {
            var divs = headerTable.find("tr:first div.col[colname]").toArray();
            divs.forEach(function (it, i) {
                var div = $(it);
                var w = div.find("div.text").outerWidth();
                var colname = div.attr("colname");
                var c = columns.first("val=>val.colname=='" + colname + "'");
                if (c) {
                    style.push(getColStyle(c.colname, c.width, c.visible));
                } else {
                    style.push(getColStyle(colname, w, true));
                }
            });
        } else {
            headerTable.find("tr:first td[colname]").each(function (n) {
                var td = $(this);
                var div = td.find("div.col[colname]");
                var w = parseInt(div.outerWidth());
                var v = td.get(0).visible;
                var colname = div.attr("colname");
                style.push(getColStyle(colname, w, v));
            });
        }

        $("#" + me.settings.styleID).remove();
        if ($("#" + settings.styleID).size() < 1) {
            var style = "<style id='" + settings.styleID + "' type='text/css'>" + style.join("") + "</style>";
            $("head").append(style);
        }
    }

    function setWidth(el, w) {
        el.css({
            width: w + "px",
            minWidth: w + "px",
            maxWidth: w + "px"
        });
    }

    function sort(table, oldIndex, newIndex) {
        var rows = table.find("thead tr, tbody tr");
        rows.each(function () {
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
        var html;
        if (tbl.find("tbody").size() > 0) {
            html = tbl.find("tbody").html();
        } else {
            html = tbl.html();
        }
        $("#" + me.settings.koTemplateID).replaceWith(["<script type='text/html' id='", me.settings.koTemplateID, "'>", html, "</", "script>"].join(""));
    };

    ctor();
};

ejs.grid.getSettings = function (n, d) {
    if (!d.userSettings) {
        return null;
    }

    var s = d.userSettings.first("val=>val.name=='" + n + "'");

    if (s) {
        try {
            s = eval(s.value);
            return s;
        } catch (ex) {
            return null;
        }
    }

    return null;
};