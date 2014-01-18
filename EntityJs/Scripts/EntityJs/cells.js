/*-- File version 0.0.0.1 from 2012.12.01 --*/
ejs.cells = function (params) {
    var me = this;
    var defaultParams = {
        container: null,
        dataCellCss: [],
        left: [],
        top: [],
        topLevels: 1,
        cellHeight: 20,
        leftColumns: 1,
        leftColumnWidths: 200,
        title: "",
        data: [],
        draggable: true,
        droppable: true,
        dropAccept: null,
        scroll: true,
        uniqueID: 0,
        padding: 5,
        border: 1,
        scrollPosition: 0,
        domRender: false
    };

    me.dictionary = {};
    me.dataItems = [];
    me.events = {
        dataCellCreated: ejs.createEvent(),
        dataCellDblclick: ejs.createEvent(),
        leftCellCreated: ejs.createEvent(),
        topCellCreated: ejs.createEvent(),
        dataItemCreated: ejs.createEvent(),
        dataItemRefreshed: ejs.createEvent(),
        dataItemOpening: ejs.createEvent(),
        dataItemMoved: ejs.createEvent(),
        cellsRefreshed: ejs.createEvent()
    };

    function ctor() {
        $.extend(defaultParams, params);
        me.params = defaultParams;
        me.params.leftData = get(me.params.left);
        me.params.topData = get(me.params.top);

        if (!me.params.leftColumnWidths.linqArray) {
            me.params.leftColumnWidths = [me.params.leftColumnWidths];
        }

        for (var i in me.events) {
            if (me.params[i]) {
                me.events[i].attach(me.params[i]);
            }
        }

        me.render();
        me.renderData();
        me.renderStyle();

        if (ko.isSubscribable(me.params.data)) {
            me.params.data.subscribe(function () {
                me.refreshData();
            });
        }

        if (ejs.cells.uniqueID) {
            me.params.uniqueID = ejs.cells.uniqueID;
            ejs.cells.uniqueID++;
        } else {
            ejs.cells.uniqueID = 1;
        }

        $(window).resize(function () {
            me.renderStyle();
            me.refreshData();
        });
    }

    me.refresh = function () {
        me.rememberScrollPosition();

        me.params.leftData = get(me.params.left);
        me.params.topData = get(me.params.top);

        var container = $(defaultParams.container);
        container.html("");
        me.dictionary = {};
        me.dataItems = [];
        me.render();
        me.renderData();
        me.events.cellsRefreshed.raise(me);

        me.restoreScrollPosition();
    };

    me.render = function () {
        if (defaultParams.domRender) {
            me.domRender();
        }

        me.prepareDictionaries();

        var container = $(defaultParams.container);
        var html = ["<div class='clRows' id='", me.getRowsID(), "'><div class='clDataItems' id='", me.getDataItemsID(), "'></div><table class='clRows'><thead class='clHeader' id='", me.getHeaderID(), "'>", me.renderHeader(), "</thead>", me.renderBody(), "</table></div>"];

        container.html(html.join(""));

        me.bindBody();
        me.bindScroll();
    };

    me.prepareDictionaries = function () {
        me.topDictionary = {};
        me.leftDictionary = {};
        me.bottomTops = [];
    };

    me.renderHeader = function () {
        var html = ["<tr><td class='clTopCell clCaption", (defaultParams.leftColumns > 0 ? " clLeftCell" : ""), "' rowspan='", defaultParams.topLevels, "' colspan='", (!me.params.leftColumnHeaders ? defaultParams.leftColumns : 1), "'><div class='td'>", (me.params.leftColumnHeaders ? me.params.leftColumnHeaders[0] : defaultParams.title), "</div></td>"];

        if (me.params.leftColumnHeaders) {
            for (var i = 1; i < me.params.leftColumnHeaders.length; i++) {
                var ch = me.params.leftColumnHeaders[i];

                html.push("<td class='clTopCell clCaption clLeftCell", "' rowspan='", defaultParams.topLevels, "' colspan='", (!me.params.leftColumnHeaders ? defaultParams.leftColumns : 1), "'><div class='td'>" + ch + "</div></td>");
            }
        }

        var top = null;

        for (var i = 0; i < defaultParams.topLevels; i++) {
            if (!top) {
                top = me.params.topData;// get(defaultParams.top);
            } else {
                top = top.selectMany("val=>val.children");
            }
            me.params.maxX = me.params.maxX > top.length ? me.params.maxX : top.length;

            top.forEach(function (item, index) {
                var td = $("<td class='clTopCell'/>");
                var div = $("<div class='td'/>");

                html.push("<td colspan='", (item.children ? item.children.length : 1), "' class=' clTopCell");

                me.params.dataCellCss.forEach(function (css, i) {
                    var is;
                    if (typeof css.fn == "function") {
                        is = css.fn({ top: item, css: css, left: null });
                    } else {
                        is = true
                    }

                    if (is) {
                        html.push(" ", css.name || css);
                    }
                });

                html.push("'><div class='td'>", item.title, "</div></td>");

                item.key = i + "_" + index;
                me.topDictionary[item.key] = item;

                if (i + 1 == defaultParams.topLevels) {
                    me.bottomTops.push(item);
                }
            });

            html.push("</tr><tr>");
        }

        html.push("</tr>");

        return html.join("");
    };

    me.renderBody = function () {
        var html = [];

        var leftData = me.params.leftData;//get(defaultParams.left);
        leftData.forEach(function (leftItem, leftIndex) {
            var cols = leftItem.columns ? leftItem.columns : [{ title: leftItem.title }];

            html.push("<tr>");

            for (var i = 0; i < defaultParams.leftColumns; i++) {
                var col = cols[i];
                var td = $("<td class='clLeftCell'/>");
                var div = $("<div class='td'/>");
                var spn = $("<span class=''/>");

                html.push("<td class='clLeftCell clLeftCell", i, "'><div class='td'><span>", col.title, "</span></div></td>");
            }

            me.bottomTops.forEach(function (topItem, topIndex) {
                html.push("<td topKey='", topItem.key, "' topIndex='", topIndex, "' leftIndex='", leftIndex, "' class='clDataCell");

                defaultParams.dataCellCss.forEach(function (css, i) {
                    var is;
                    if (typeof css.fn == "function") {
                        is = css.fn({ top: topItem, left: leftItem, css: css });
                    } else {
                        is = true
                    }

                    if (is) {
                        html.push(" ", css.name || css);
                    }
                });

                html.push("'><div class='td'></div></td>");
            });

            html.push("</tr>");

            me.leftDictionary[leftIndex] = leftItem;
        });

        return html.join("");
    };

    me.bindBody = function () {
        var container = $(defaultParams.container);
        var cells = container.find("td.clDataCell");

        cells.each(function () {
            var td = $(this);
            var topIndex = td.attr("topIndex");
            var leftIndex = td.attr("leftIndex");
            me.dictionary[topIndex + "_" + leftIndex] = td;

            if (!me.params.draggable) {
                return;
            }

            td.droppable({
                accept: function (el) {
                    var r = el.hasClass("clDataItem");
                    if (typeof me.params.dropAccept == "function") {
                        var td = $(this);
                        var dataItem = el.get(0).dataItem;
                        var topIndex = td.attr("topIndex");
                        var leftIndex = td.attr("leftIndex");
                        var topKey = td.attr("topKey");
                        var topItem = me.topDictionary[topKey];
                        var leftItem = me.leftDictionary[leftIndex];
                        r = r && me.params.dropAccept({ item: dataItem, x: topIndex, y: leftIndex, top: topItem, left: leftItem });
                    }
                    return r;
                },
                hoverClass: "clDataCellHover",
                tolerance: "pointer",
                drop: function (event, ui) {
                    var td = $(this);
                    var topIndex = td.attr("topIndex");
                    var leftIndex = td.attr("leftIndex");
                    var topKey = td.attr("topKey");
                    var topItem = me.topDictionary[topKey];
                    var leftItem = me.leftDictionary[leftIndex];

                    if (me.params.droppable) {
                        var dataItem = ui.draggable.get(0).dataItem;
                        var item = dataItem.item;
                        var newX = topIndex;
                        var newY = leftIndex;
                        var sizeX = parseInt(dataItem.sx);
                        var sizeY = parseInt(dataItem.sy);

                        if (item) {
                            set(item, "x", newX);
                            set(item, "y", newY);
                        }
                        set(dataItem, "x", newX);
                        set(dataItem, "y", newY);
                        me.refreshItem(dataItem);
                    }
                    me.events.dataItemMoved.raise({ item: dataItem, x: newX, y: newY, top: topItem, left: leftItem });
                }
            });
        });
    };

    me.domRender = function () {
        var container = $(defaultParams.container);
        var header = $("<thead class='clHeader'/>");
        var rowsDiv = $("<div class='clRows'/>");
        var dataItemsDiv = $("<div class='clDataItems'/>");
        var rowsTbl = $("<table class='clRows'/>");
        var style = [];

        var tr = $("<tr/>");
        var td = $("<td class='clTopCell'/>");

        td.addClass("clCaption");
        td.attr("rowspan", defaultParams.topLevels);
        if (!me.params.leftColumnHeaders) {
            td.attr("colspan", defaultParams.leftColumns);
        }
        td.html("<div class='td'>" + (me.params.leftColumnHeaders ? me.params.leftColumnHeaders[0] : defaultParams.title) + "</div>");
        if (defaultParams.leftColumns > 0) {
            td.addClass("clLeftCell");
        }
        me.events.topCellCreated.raise({ td: td, title: true, top: null });
        tr.append(td);

        if (me.params.leftColumnHeaders) {
            for (var i = 1; i < me.params.leftColumnHeaders.length; i++) {
                var ch = me.params.leftColumnHeaders[i];
                var it = $(td.get(0).outerHTML);
                it.addClass("clLeftCell" + i);
                it.html("<div class='td'>" + ch + "</div>");
                tr.append(it);
            }
        }

        var top = null;

        for (var i = 0; i < defaultParams.topLevels; i++) {
            if (!top) {
                top = me.params.topData;// get(defaultParams.top);
            } else {
                top = top.selectMany("val=>val.children");
            }
            me.params.maxX = me.params.maxX > top.length ? me.params.maxX : top.length;

            top.forEach(function (item, i) {
                var td = $("<td class='clTopCell'/>");
                var div = $("<div class='td'/>");

                me.params.dataCellCss.forEach(function (css, i) {
                    var is;
                    if (typeof css.fn == "function") {
                        is = css.fn({ top: item, css: css, left: null });
                    } else {
                        is = true
                    }

                    if (is) {
                        td.addClass(css.name);
                    }
                });

                div.html(item.title);
                td.append(div);

                if (item.children) {
                    td.attr("colspan", item.children.length);
                }

                me.events.topCellCreated.raise({ td: td, caption: false, top: item });
                tr.append(td);
            });

            header.append(tr);
            tr = $("<tr/>");
        }

        rowsTbl.append(header);
        rowsDiv.append(dataItemsDiv);
        var leftData = me.params.leftData; //get(defaultParams.left);
        leftData.forEach(function (leftItem, leftIndex) {
            var tr = $("<tr/>");
            var cols = leftItem.columns ? leftItem.columns : [{ title: leftItem.title }];

            for (var i = 0; i < defaultParams.leftColumns; i++) {
                var col = cols[i];
                var td = $("<td class='clLeftCell'/>");
                var div = $("<div class='td'/>");
                var spn = $("<span class=''/>");

                td.addClass("clLeftCell" + i);
                spn.html(col.title);
                div.append(spn);
                td.append(div);
                me.events.leftCellCreated.raise({ td: td, col: col, item: leftItem, index: i });
                tr.append(td);
            }

            top.forEach(function (topItem, topIndex) {
                var td = $("<td class='clDataCell'/>");
                var div = $("<div class='td'/>");

                defaultParams.dataCellCss.forEach(function (css, i) {
                    var is;
                    if (typeof css.fn == "function") {
                        is = css.fn({ top: topItem, left: leftItem, css: css });
                    } else {
                        is = true
                    }

                    if (is) {
                        td.addClass(css.name);
                    }
                });

                td.append(div);
                td.dblclick(function () { me.events.dataCellDblclick.raise({ x: topIndex, y: leftIndex, top: topItem, left: leftItem }); });

                if (me.params.draggable) {
                    td.droppable({
                        accept: function (el) {
                            var r = el.hasClass("clDataItem");
                            if (typeof me.params.dropAccept == "function") {
                                var dataItem = el.get(0).dataItem;
                                r = r && me.params.dropAccept({ item: dataItem, x: topIndex, y: leftIndex, top: topItem, left: leftItem });
                            }
                            return r;
                        },
                        hoverClass: "clDataCellHover",
                        tolerance: "pointer",
                        drop: function (event, ui) {
                            if (me.params.droppable) {
                                var dataItem = ui.draggable.get(0).dataItem;
                                var item = dataItem.item;
                                var newX = topIndex;
                                var newY = leftIndex;
                                var sizeX = parseInt(dataItem.sx);
                                var sizeY = parseInt(dataItem.sy);

                                if (item) {
                                    set(item, "x", newX);
                                    set(item, "y", newY);
                                }
                                set(dataItem, "x", newX);
                                set(dataItem, "y", newY);
                                me.refreshItem(dataItem);
                            }
                            me.events.dataItemMoved.raise({ item: dataItem, x: newX, y: newY, top: topItem, left: leftItem });
                        }
                    });
                }

                me.params.dataCellCss.forEach(function (css, i) {
                    var is;
                    if (typeof css.fn == "function") {
                        is = css.fn({ css: css, left: leftItem, top: topItem });
                    } else {
                        is = true
                    }

                    if (is) {
                        td.addClass(css.name);
                    }
                });

                me.events.dataCellCreated.raise({ td: td, left: leftItem, top: topItem });
                tr.append(td);
                me.dictionary[topIndex + "_" + leftIndex] = td;
            });

            rowsTbl.append(tr);
        });

        rowsDiv.append(rowsTbl);
        container.append(rowsDiv);

        header.attr("id", me.getHeaderID());
        rowsDiv.attr("id", me.getRowsID());
        dataItemsDiv.attr("id", me.getDataItemsID());

        me.bindScroll();
    };

    me.renderStyle = function () {
        var container = $(me.params.container);
        var style = [".clDataItems .clDataItemWrapper { width: 0px; height: 0px; overflow: visible; }"];
        var widths = me.params.leftColumnWidths;
        var p = me.params.padding;
        var b = me.params.border;
        var header = container.find("thead.clHeader");
        var rowsDiv = container.find("div.clRows");

        header.hide();
        rowsDiv.hide();

        var containerWidth = container.width();
        var containerHeight = container.height();
        var columnWidth = 0;
        var captionWidth = 0;

        header.show();
        rowsDiv.show();

        for (var i = 0; i < me.params.leftColumns; i++) {
            var s = "#" + me.getRowsID() + " td.clLeftCell" + i;
            style.push(" ", s, "{ width: ", widths[i], "px; }");
            style.push(" ", s, " div.td", "{ width: ", widths[i], "px; }");
            captionWidth += widths[i] + p * 2 + b * 2;
        }

        captionWidth -= p * 2 + b * 2 + (widths.length - 1);
        containerHeight -= me.params.topHeight;
        containerWidth -= captionWidth + (me.params.scroll ? 25 + p * 2 : 0);
        if (me.bottomTops.length) {
            columnWidth = containerWidth / me.bottomTops.length/* get(me.params.top).length */ - p * 2 - b * 2;
        } else {
            columnWidth = containerWidth / me.params.topData.length/* get(me.params.top).length */ - p * 2 - b * 2;
        }
        columnWidth = columnWidth < 100 ? 100 : columnWidth;

        style.push(" #", me.getHeaderID(), " td.clTopCell:not(.clLeftCell) { width: ", columnWidth, "px; }");
        style.push(" #", me.getHeaderID(), " td.clTopCell:not(.clLeftCell) div.td { width: ", columnWidth, "px; }");
        style.push(" #", me.getRowsID(), " td.clDataCell  { width: ", columnWidth, "px; }");
        style.push(" #", me.getRowsID(), " td.clDataCell div.td { width: ", columnWidth, "px; }");
        style.push(" #", me.getDataItemsID(), " { height: 0px; padding: 0px; }");

        style = style.join('');

        var styleID = me.getStyleID();
        var css = $("#" + styleID);

        if (!css.size()) {
            css = $("<style type='text/css'/>");
            css.attr("id", styleID);
            $("head").append(css);
        }

        css.html(style);
    };

    me.refreshData = function () {
        for (var i in me.dataItems) {
            if (parseInt(i)) {
                me.removeItem(me.dataItems[i]);
            }
        }
        me.renderData();
    };

    me.renderItem = function (item, div) {
        var td = me.dictionary[item.x + "_" + item.y];

        if (!td) {
            if (div) {
                div.hide();
            }
            return;
        } else if (div) {
            div.show();
        }

        var id = me.getItemID(item);
        var dataContainer = $("#" + me.getDataItemsID());

        if (!div && $("#" + id).size()) {
            div = $("#" + id);
        } else if (!div || div.size() < 1) {
            var wrapper = $("<div class='clDataItemWrapper'/>");
            div = $("<div class='clDataItem'/>");
            div.draggable({
                revert: "invalid",
                stop: function (event, ui) {
                }
            });
            div.html(item.value);
            div.dblclick(function () {
                me.events.dataItemOpening.raise({ item: item.item || item, div: div });
            });
            div.bind("click.clDataItem", function (e) {
                var item = e.target.dataItem;
                if (!item) {
                    return;
                }
                var items = me.dataItems.where("val=>val&&val.x==" + item.x + "&&val.y==" + item.y).orderByDesc("val=>val.z");
                var first = items.first();
                if (!first || !item || first.id == item.id) {
                    return;
                }
                if (first) {
                    var temp = first.z;
                    first.z = item.z;
                    item.z = temp;
                    me.refreshItem(first, first.div);
                } else {
                    item.z = 1;
                    me.refreshItem(item, div);
                }
            });
            wrapper.append(div);
            dataContainer.append(wrapper);
            me.events.dataItemCreated.raise({ div: div, item: item.item || item });
        }

        me.refreshItem(item, div);
    };

    me.refreshItem = function (item, div) {
        var td = me.dictionary[item.x + "_" + item.y];
        if (!td) {
            return;
        }
        var w = td.outerWidth();
        var h = td.outerHeight();
        var sx = parseInt(item.sx);
        var sy = parseInt(item.sy);
        var maxX = me.params.maxX;
        var maxY = me.params.leftData.length;// get(me.params.left).length;
        var x = parseInt(item.x);
        var y = parseInt(item.y);
        var z = parseInt(item.z);
        var color = get(item.color);
        var textColor = get(item.textColor);
        var dataContainer = $("#" + me.getDataItemsID());
        var id = me.getItemID(item);
        var items = me.dataItems.where("val=>val&&val.id!='" + item.id + "'&&val.x==" + x + "&&val.y==" + y).orderByDesc("val=>val.z");

        if (!div) {
            div = item.div;
        }
        if (!div) {
            div = me.dataItems[item.id].div;
        }

        if (x + sx > maxX) {
            sx = maxX - x;
        }
        if (y + sy > maxY) {
            sy = maxY - y;
        }

        var overItem = items.first("val=>val.z<=" + z);
        var underItems = items.where("val=>val.z>" + z);
        if (overItem) {
            z = overItem.z + 1;
            w = overItem.w || w;
            w -= 10;
        }

        div.attr("id", id);
        div.css({
            position: "relative",
            width: (w * sx) + "px",
            height: (h * sy) + "px",
            zIndex: z,
            top: (td.position().top - dataContainer.position().top) + "px",
            left: (td.position().left - dataContainer.position().left) + "px"
        });
        div.html(item.value);
        if (color) {
            div.css("background-color", color);
        }
        if (textColor) {
            div.css("color", textColor);
        }
        item.z = z;
        item.w = w;
        item.div = div;
        div.get(0).dataItem = item;
        me.dataItems[item.id] = item;
        me.events.dataItemRefreshed.raise({ div: div, item: item.item || item });

        underItems.forEach(function (it) {
            var div = it.div;
            me.refreshItem(it, div);
        });
    };

    me.removeItem = function (item) {
        $("#" + me.getItemID(item)).parents(".clDataItemWrapper").remove();
        $("#" + me.getItemID(me.dataItems[item.id])).parents(".clDataItemWrapper").remove();
        delete me.dataItems[item.id];
    };
    me.removeByID = function (id) {
        var item = me.dataItems[id];
        if (!item) {
            return;
        }
        $("#" + me.getItemID(item)).remove();
        delete me.dataItems[id];
    };

    me.addItem = function (item) {
        var d = {
            title: get(item.title),
            value: get(item.value),
            color: get(item.color),
            textColor: get(item.textColor),
            item: item
        };
        d.z = get(item.z) || 1;
        d.id = get(item.id);
        d.x = get(item.x);
        d.y = get(item.y);
        d.sx = get(item.sx);
        d.sy = get(item.sy);
        me.dataItems[d.id] = d;
        me.renderItem(d);
    };

    me.renderData = function () {
        var data = get(me.params.data);

        data.forEach(function (item) {
            me.addItem(item);
        });
    };

    me.rememberScrollPosition = function () {
        var div = $("#" + me.getRowsID());
        me.scrollLeft = div.scrollLeft();
        me.scrollTop = div.scrollTop();
    };

    me.restoreScrollPosition = function () {
        var div = $("#" + me.getRowsID());

        div.scrollLeft(me.scrollLeft);
        div.scrollTop(me.scrollTop);

        me.refreshCaptionPositions();
    };

    me.refreshCaptionPositions = function (time) {
        var div = $("#" + me.getRowsID());
        var leftTds = div.find("td.clLeftCell");
        var topTds = div.find("td.clTopCell");
        var oldLeft = leftTds.css("left").replace("px", "") * 1;
        var oldTop = topTds.css("top").replace("px", "") * 1;
        var left = div.scrollLeft();
        var top = div.scrollTop();

        if (left < oldLeft) {
            leftTds.css({ left: 0 });
        }

        if (top < oldTop) {
            topTds.css({ top: 0 });
        }

        var fn = function () {
            var left = div.scrollLeft();
            var top = div.scrollTop();
            top = top > 0 ? top - 1 : top;

            leftTds.css({ left: left });
            topTds.css({ top: top });
            timer = null;
        }

        clearTimeout(me.refreshCaptionPositionsTimer);

        if (time) {
            me.refreshCaptionPositionsTimer = setTimeout(fn, time);
        } else {
            fn();
        }
    };

    me.bindScroll = function () {
        var div = $("#" + me.getRowsID());
        div.unbind("scroll.ejscells");
        $(window).unbind("mousemove.ejscells");

        if (!me.params.scroll) {
            return;
        } else if (me.params.scrollPosition > 0) {
            var sw = div[0].scrollWidth;
            div.scrollLeft(me.params.scrollPosition < 1 ? me.params.scrollPosition * sw : me.params.scrollPosition);
        }
        
        div.bind("scroll.ejscells", function (e, a) {
            me.refreshCaptionPositions(500);
        });
        $(window).bind("mousemove.ejscells", function () {
            /*var left = div.scrollLeft();
            var top = div.scrollTop();
            top = top > 0 ? top - 1 : top;

            leftTds.css({ left: left });
            topTds.css({ top: top });*/
            me.refreshCaptionPositions();
        });

        if (me.params.scrollPosition > 0) {
            var sw = div[0].scrollWidth;
            div.scrollLeft(me.params.scrollPosition < 1 ? me.params.scrollPosition * sw : me.params.scrollPosition);
        }
    };

    me.getItemID = function (item) {
        return "divClDataItem" + me.params.uniqueID + "_" + item.id + "_" + item.x + "_" + item.y;
    };
    me.getHeaderID = function () {
        return "thClHeader" + me.params.uniqueID;
    };
    me.getRowsID = function () {
        return "divClRows" + me.params.uniqueID;
    };
    me.getStyleID = function () {
        return "stlCells" + me.params.uniqueID;
    };
    me.getDataItemsID = function () {
        return "divClDataItems" + me.params.uniqueID;
    };

    function get(it) {
        return typeof it == "function" ? it() : it;
    };

    function set(o, it, v) {
        if (typeof o[it] == "function") {
            o[it](v);
        } else {
            o[it] = v;
        }
    }

    ctor();
};