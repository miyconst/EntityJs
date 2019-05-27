/*-- File version 0.0.0.4 from 2019.05.28 --*/
"use strict";

ejs.grid2 = function (options) {
    var me = this
    var uid = (new Date).getMilliseconds();
    var container = $(options.container);

    me.elements = {
        cantainerID: container.attr("id"),
        styleID: "stlEjsGrid" + uid,
        tableID: "tblEjsGrid" + uid,
        container: container,
        header: container.find(".ejsgrid-header"),
        table: container.find(".ejsgrid-table")
    };

    me.events = {
        columnsSaving: ejs.createEvent(),
        columnsSaved: ejs.createEvent(),
        filterClosing: ejs.createEvent(),
        filterClosed: ejs.createEvent(),
        filterOpening: ejs.createEvent(),
        filterOpened: ejs.createEvent(),
        ordering: ejs.createEvent(),
        ordered: ejs.createEvent(),
        applyFilter: ejs.createEvent(),
        cancelFilter: ejs.createEvent(),
        pageSizeChanged: ejs.createEvent()
    };

    me.getColumns = function () {
        var columns = [];

        container.find(".ejsgrid-header th").each(function () {
            var th = $(this);

            columns.push({ col: th.attr("data-col"), width: th.attr("data-width"), visible: th.attr("data-visible"), order: th.attr("data-order"), index: th.get(0).cellIndex });
        });

        var f = container.find(".ejsgrid-tr-filter").attr("data-visible") == "off" ? "off" : "on";

        var result = {
            columns: columns,
            filter: f,
            pageSize: container.find(".ejsgrid-page-size").val()
        };

        return result;
    };

    me.setColumns = function (value) {
        var values = {};

        value.columns.forEach(function (it, i) {
            values[it.col] = it.width;
        });

        renderStyle(values);

        var tds = container.find("th").toArray().select(function (it, i) {
            var th = $(it);
            var col = th.attr("data-col");
            var c = value.columns.first("val=>val.col=='" + col + "'");
            var r = {
                th: th,
                col: col,
                c: c
            };

            if (c) {
                th.attr("data-visible", c.visible);

                if (c.order) {
                    th.attr("data-order", c.order);
                    th.addClass("ejsgrid-th-" + c.order);
                }
            }

            return r;
        }).orderByDesc(function (it, i) {
            it.index = it.c ? it.c.index : -1;
            return it.index;
        });

        tds.forEach(function (it, i) {
            var th = it.th;
            var col = it.col;
            var oldIndex = th.get(0).cellIndex;
            var newIndex = 0;

            moveCol(".ejsgrid-header", oldIndex, newIndex);
            moveCol(".ejsgrid-table", oldIndex, newIndex);
            moveCol(".ejsgrid-row-template", oldIndex, newIndex);
        });

        if (value.filter == "on") {
            openFilter();
        } else if (value.filter == "off") {
            closeFilter();
        }

        if (value.pageSize) {
            container.find(".ejsgrid-page-size").val(value.pageSize);
        }

        setSize();
    };

    me.getOrderBy = function () {
        var values = [];

        container.find(".ejsgrid-header th[data-order]").toArray().forEach(function (it, i) {
            it = $(it);
            values.push({ col: it.attr("data-col"), order: it.attr("data-order") });
        });

        return values;
    };

    me.print = function (onlySelected) {
        var columns = me.getColumns().columns;
        var html = ["<table class='ejsgrid-print'><thead><tr>"];

        columns.forEach(function (it, i) {
            if (it.col == "Save" || it.visible == "off") {
                return;
            }
            var td = container.find(".ejsgrid-header th[data-col=" + it.col + "]:first");
            html.push("<th>", td.text(), "</th>");
        });

        html.push("</tr></thead><tbody>");

        container.find(".ejsgrid-table tbody tr").each(function () {
            var tr = $(this);
            if (onlySelected && !tr.find("td[data-col=Save] input").get(0).checked) {
                return;
            }
            html.push("<tr>");
            columns.forEach(function (it, i) {
                if (it.col == "Save" || it.visible == "off") {
                    return;
                }

                var td = tr.find("td[data-col=" + it.col + "]:first");
                var text = td.text();

                if (!text.length) {
                    var checkbox = td.find("input[type=checkbox]");

                    if (checkbox.size() && checkbox.get(0).checked) {
                        text = ejs.crud ? ejs.crud.getDefaultTextProvider().bool.yes : "True";
                    } else if (checkbox.size()) {
                        text = ejs.crud ? ejs.crud.getDefaultTextProvider().bool.no : "False";
                    }
                }
                html.push("<td>", text, "</td>");
            });
            html.push("</tr>");
        });

        html.push("</tbody></table>");
        console.log(html.join(""));
        return html.join("");
    };

    function renderStyle(values) {
        var b = 0;
        var style = ["<style type='text/css' id='", me.elements.styleID, "'>"];

        container.find("th").each(function () {
            var th = $(this);
            var w = parseInt(th.attr("data-width"));
            var col = th.attr("data-col");

            if (values && values[col]) {
                w = parseInt(values[col]);
            } else if (!w) {
                th.css("white-space", "nowrap");
                w = parseInt(th.width());
                th.css("white-space", "");
            }

            var wb = parseInt(w - b);
            var v = th.attr("data-visible");

            v = v ? v : "on";

            th.attr("data-width", w);
            th.attr("data-visible", v);

            style.push("#", me.elements.cantainerID, ".ejsgrid2 th[data-col=", col, "] span.col { width: ", wb, "px; min-width: ", wb, "px; max-width: ", wb, "px; }", "\r\n");
            style.push("#", me.elements.cantainerID, ".ejsgrid2 td[data-col=", col, "] div.col { width: ", w, "px; min-width: ", w, "px; max-width: ", w, "px; }", "\r\n");

            if (v == "off") {
                style.push("#", me.elements.cantainerID, ".ejsgrid2 td[data-col=", col, "], ", "#", me.elements.cantainerID, ".ejsgrid2 th[data-col=", col, "] { display:none; }", "\r\n");
            }
        });

        style.push("</style>");
        $("#" + me.elements.styleID).remove();
        $("head").append(style.join(""));
    }

    function moveCol(tbl, dragIndex, dropIndex) {
        var el = container.find(tbl);
        var tagName = el.get(0).tagName.toLowerCase();
        var isTemplate = false;

        if (tagName == "template" || tagName == "script") {
            el = $(["<table>", el.html(), "</table>"].join(""));
            isTemplate = true;
        }

        $(el).find("tr").each(function () {
            var tr = $(this);
            var dragTd = $(tr.find("td, th").get(dragIndex));
            var dropTd = $(tr.find("td, th").get(dropIndex));

            if (dropIndex > dragIndex) {
                dropTd.after(dragTd);
            } else {
                dropTd.before(dragTd);
            }
        });

        if (isTemplate) {
            container.find(tbl).text(el.find("tbody").html());
        }
    }

    function setScrollSizes() {
        container.find(".ejsgrid-scroll-vertical div").height(container.find(".ejsgrid-table").height() + container.find(".ejsgrid-header").height() + 50);
        container.find(".ejsgrid-scroll-horizontal div").width(container.find(".ejsgrid-table").width() + 10);
    }

    function setSize() {
        var w = container.width() - 20;
        var h = container.height();
        var sh = container.find(".ejsgrid-scroll-horizontal").height();
        var hh = container.find(".ejsgrid-header").height();
        var fh = container.find(".ejsgrid-footer").height();

        container.find(".ejsgrid-grid").css({ width: w, height: h - hh - fh - sh });
        container.find(".ejsgrid-scroll-vertical").css({ height: h - fh });
        container.find(".ejsgrid-scroll-horizontal").css({ width: w });
    }

    function saveSettings() {
        var e = {
            name: options.settingsName,
            value: me.getColumns(),
            cancel: false,
            grid: me
        };

        me.events.columnsSaving.raise(e);

        if (e.cancel) {
            return;
        }

        container.find(".ejsgrid-th-actions").find(".fa-spinner, .fa-save").toggle();
        ejs.saveSetting(e.name, e.value, function () {
            container.find(".ejsgrid-th-actions").find(".fa-spinner, .fa-save").toggle();
            me.events.columnsSaved.raise(e);
        });
    }

    function toggleFilter() {
        if (container.find(".ejsgrid-tr-filter").attr("data-visible") == "off") {
            openFilter();
        } else {
            closeFilter();
        }

        setSize();
    }

    function openFilter() {
        var tr = container.find(".ejsgrid-tr-filter");
        var e = {
            grid: me,
            cancel: false
        };

        me.events.filterOpening.raise(e);

        if (e.cancel) {
            return;
        }

        tr.attr("data-visible", "on");
        tr.show();
        me.events.filterOpened.raise(e);
    }

    function closeFilter() {
        var tr = container.find(".ejsgrid-tr-filter");
        var e = {
            grid: me,
            cancel: false
        };

        me.events.filterClosing.raise(e);

        if (e.cancel) {
            return;
        }

        tr.attr("data-visible", "off");
        tr.hide();
        me.events.filterClosed.raise(e);
    }

    function orderByColumn(th, solo, direction) {
        var e = {
            grid: me,
            th: th,
            solo: solo,
            cancel: false,
            direction: direction
        };

        me.events.ordering.raise(e);

        if (e.cancel) {
            return;
        }

        if (solo) {
            container.find(".ejsgrid-header th").removeClass("ejsgrid-th-asc").removeClass("ejsgrid-th-desc").removeAttr("data-order");
        }

        if (direction == "remove") {
            th.removeClass("ejsgrid-th-asc, ejsgrid-th-desc").removeAttr("data-order", "asc");
        } else {
            th.removeClass("ejsgrid-th-asc, ejsgrid-th-desc").addClass("ejsgrid-th-" + direction).attr("data-order", direction);
        }

        e.values = [];

        container.find(".ejsgrid-header th[data-order]").toArray().forEach(function (it, i) {
            it = $(it);
            e.values.push({ col: it.attr("data-col"), order: it.attr("data-order") });
        });

        me.events.ordered.raise(e);
    }

    function applyFilter() {
        var e = {
            grid: me
        };

        me.events.applyFilter.raise(e);
    }

    function cancelFilter() {
        var e = {
            grid: me
        };

        me.events.cancelFilter.raise(e);
    };

    function ctor() {
        container.find(".ejsgrid-scroll-vertical").scroll(function () {
            var top = $(this).scrollTop();
            container.find(".ejsgrid-grid").scrollTop(top);
        });

        container.find(".ejsgrid-scroll-horizontal").scroll(function () {
            var left = $(this).scrollLeft();
            container.find(".ejsgrid-grid, .ejsgrid-header").scrollLeft(left);
        });

        container.find(".ejsgrid-header th").each(function () {
            var th = $(this);

            th.resizable({
                handles: "e",
                helper: "ui-resizable-helper-ejsgrid2",
                start: function (event, ui) {
                    var th = $(ui.originalElement);
                    var p = (th.width() - th.find("span.col").width());

                    th.attr("data-padding", p);
                },
                stop: function (event, ui) {
                    var th = $(ui.originalElement);
                    var values = {};
                    //var p = (th.width() - th.find("span.col").width());
                    var p = th.attr("data-padding");

                    values[th.attr("data-col")] = ui.size.width - p;
                    $(this).css({ width: "", height: "" });
                    renderStyle(values);
                    setSize();
                    console.log(p + ":" + ui.size.width);
                }
            });

            th.append("<span class='ui-drop-helper'></span>");

            th.draggable({
                revert: "invalid",
                revertDuration: 100,
                helper: "clone",
                start: function (e, ui) {
                    $(ui.helper).addClass("ui-draggable-helper");
                }
            });

            th.droppable({
                accept: "th[data-col]",
                activeClass: "ui-state-hover",
                hoverClass: "ui-state-active",
                drop: function (event, ui) {
                    var dragTh = $(ui.draggable);
                    var dropTh = $(this);
                    var dragIndex = dragTh.get(0).cellIndex;
                    var dropIndex = dropTh.get(0).cellIndex;

                    moveCol(".ejsgrid-header", dragIndex, dropIndex);
                    moveCol(".ejsgrid-table", dragIndex, dropIndex);
                    moveCol(".ejsgrid-row-template", dragIndex, dropIndex);
                }
            });
        });

        container.find(".ejsgrid-grid").bind("mousewheel DOMMouseScroll", function (event) {
            var delta = Math.max(-1, Math.min(1, (event.originalEvent.wheelDelta || -event.originalEvent.detail))) * -1;
            var div = $(this);
            var top = container.find(".ejsgrid-scroll-vertical").scrollTop();

            top += delta * 20;

            container.find(".ejsgrid-grid, .ejsgrid-scroll-vertical").scrollTop(top);
        });

        container.find(".ejsgrid-header th .menu a").click(function (e) {
            var a = $(this);
            var th = a.parents("th:first");
            var offset = a.offset();
            var menu = container.find(".ejsgrid-menu ul");

            container.find(".ejsgrid-menu ul label.checkbox").each(function () {
                var lbl = $(this);
                var col = lbl.attr("data-col");

                if (container.find(".ejsgrid-header th[data-col=" + col + "]").is(":visible")) {
                    lbl.find("input").attr("checked", "checked");
                } else {
                    lbl.find("input").removeAttr("checked");
                }
            });

            if (th.hasClass("ejsgrid-th-orderable")) {
                menu.find(".ejsgrid-a-order").show();
            } else {
                menu.find(".ejsgrid-a-order").hide();
            }

            menu.attr("data-col", th.attr("data-col"));
            menu.css({ top: offset.top + 20, left: offset.left });
            setTimeout(function () {
                menu.show();
            }, 50);
        });

        container.find(".ejsgrid-menu ul .ejsgrid-a-order").click(function (e) {
            var a = $(this);
            var dir = a.attr("data-direction");
            var ul = a.parents("ul:first");
            var col = ul.attr("data-col");
            var th = container.find(".ejsgrid-header th[data-col=" + col + "]");

            orderByColumn(th, !e.ctrlKey, dir);
            ul.hide();
        });

        container.find(".ejsgrid-tr-filter .ejsgrid-a-apply-filter").click(function (e) {
            applyFilter();
        });

        container.find(".ejsgrid-tr-filter .ejsgrid-a-cancel-filter").click(function (e) {
            cancelFilter();
        });

        container.find(".ejsgrid-menu ul label.checkbox input").change(function () {
            var chb = $(this);
            var lbl = chb.parents("label:first");
            var col = lbl.attr("data-col");

            if (chb.is(":checked")) {
                container.find(".ejsgrid-header th[data-col=" + col + "]").attr("data-visible", "on");
            } else {
                container.find(".ejsgrid-header th[data-col=" + col + "]").attr("data-visible", "off");
            }

            renderStyle();
        });

        container.find(".ejsgrid-menu ul").hover(function () {
            $(this).data("data-hover", "on");
        }, function () {
            $(this).data("data-hover", "off");
        });

        $(document).click(function () {
            var ul = container.find(".ejsgrid-menu ul");

            if (ul.data("data-hover") != "on") {
                ul.hide();
            }
        });

        container.find(".ejsgrid-a-save").click(function () {
            var ul = container.find(".ejsgrid-menu ul");
            saveSettings();
            ul.hide();
        });

        container.find(".ejsgrid-a-filter").click(function () {
            var ul = $(this).parents("ul:first");
            toggleFilter();
            ul.hide();
        });

        container.find(".ejsgrid-page-size").change(function () {
            var ddl = $(this);
            var e = {
                grid: me,
                pageSize: ddl.val()
            };

            me.events.pageSizeChanged.raise(e);
        });

        if (options.columns) {
            me.setColumns(options.columns);
        }

        renderStyle();
        setInterval(function () {
            setScrollSizes();
        }, 100);
        setTimeout(function () {
            setSize();
        }, 105);

        $(window).resize(function () {
            setTimeout(function () {
                setSize();
            }, 105);
        });
    }

    ctor();
};

ejs.grid2.getSettings = function (n, d) {
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
