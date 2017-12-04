/*-- File version 0.0.0.12 from 2017.12.04 --*/
ejs.remotePager = function (params) {
    var me = this;
    var settings = {
        set: null,
        model: null,
        pageSize: 100,
        compressPages: true,
        filters: [],
        includes: [],
        refreshIncludes: false,
        customSelect: false
    };

    var ctor = function () {
        $.extend(settings, params);
        me.setting = me.settings = settings;

        settings.set.events.change.attach(function (e) {
            refreshShown();
        });

        if (settings.orderBy) {
            me.orderBy(settings.orderBy);
        }

        if (typeof settings.orderDesc != "undefined") {
            me.orderDesc(settings.orderDesc);
        }

        if (settings.pageSize < 0) {
            refreshShown();
            generatePages();
        }
    };

    me.events = {
        pageChanging: ejs.createEvent(),
        pageChanged: ejs.createEvent()
    };

    me.loading = ko.observable(false);
    me.current = ko.observable(0);
    me.pages = ko.observableArray([]);
    me.orderBy = ko.observable("id");
    me.orderDesc = ko.observable(false);
    me.totalCount = ko.observable(0);
    me.shownFrom = ko.observable(0);
    me.shownTo = ko.observable(0);

    me.getSelectOptions = function (index) {
        var e = {
            entitySetName: ejs.toServerName(settings.set.settings.name),
            entityName: ejs.toServerName(settings.set.settings.className),
            selectMode: ejs.toServerName(settings.set.settings.mode),
            oldPage: me.current(),
            newPage: index,
            includes: settings.includes,
            wheres: getWhere(),
            whereMethod: settings.whereMethod,
            orders: getOrderBy(),
            orderMethod: settings.orderMethod,
            take: settings.pageSize,
            skip: index * settings.pageSize
        };
        return e;
    };
    me.gso = me.getSelectOptions;

    me.goTo = function (index, callback) {
        var e = { cancel: false, options: me.gso(index) };
        var perform = function (result) {
            result = ejs.toJsObject(result);

            if (me.setting.refreshIncludes) {
                me.setting.model.refreshData(result.collections);
            } else {
                me.setting.set.refreshData(result.collections[me.setting.set.settings.name]);
                delete result.collections[me.setting.set.settings.name];
                me.setting.model.addData(result.collections);
            }
            me.current(index);
            me.totalCount(result.totalCount);
            generatePages();

            me.loading(false);
            me.events.pageChanged.raise(e);

            if (me.current() * me.setting.pageSize > me.totalCount()) {
                me.goTo(me.pages().length - 1, callback);
            } else if (typeof callback == "function") {
                callback(result);
            }
        };

        me.events.pageChanging.raise(e);
        if (e.cancel) {
            return;
        }
        me.loading(true);

        if (settings.customSelect) {
            settings.customSelect(e, perform);
        } else {
            settings.model.select(e, perform);
        }
    };

    me.refresh = function (callback) {
        me.goTo(settings.pageSize <= 0 ? 0 : me.current(), callback);
    };

    me.order = function (property, desc) {
        if (me.orderBy() == property && typeof desc == "undefined") {
            desc = !me.orderDesc();
        } else {
            me.orderBy(property);
            desc = typeof desc == "undefined" ? false : desc;
        }
        me.orderDesc(desc);
        me.refresh();
    };

    me.next = function () {
        var index = me.current();

        if (index >= getMaxPageIndex()) {
            index = getMaxPageIndex();
            return false;
        }

        index++;
        me.goTo(index);

        return true;
    };

    me.previous = function () {
        var index = me.current();

        if (index <= 0) {
            index = 0;
            return false;
        }

        index--;
        me.goTo(index);

        return true;
    };

    me.pageSize = function (v) {
        if (v) {
            me.settings.pageSize = v;
            me.goTo(0);
        }

        return me.setting.pageSize;
    };

    function refreshShown() {
        me.totalCount(settings.set.load().length);
        me.shownFrom(me.shownFrom() == 0 && me.totalCount() > 0 ? 1 : me.totalCount() == 0 ? 0 : me.shownFrom());
        me.shownTo(me.totalCount() == 0 ? 0 : me.shownFrom() + me.totalCount() - 1);
    }

    function getMaxPageIndex() {
        var index = settings.pageSize <= 0 ? 1 : parseInt(me.totalCount() / settings.pageSize);

        if (settings.pageSize > 0 && index < me.totalCount() / settings.pageSize) {
            index++;
        }

        return index;
    }

    function getOrderBy() {
        var result = [];
        var properties = me.orderBy().split(",");

        properties.forEach(function (it) {
            var desc = me.orderDesc();

            if (/ /gi.test(it)) {
                it = it.split(" ");
                desc = it[1] == "desc";
                it = it[0];
            }

            result.push(ejs.createOrderParameter(it, desc));
        });

        return result;
    }

    function getWhere(filters, group) {
        var result = [];
        if (!filters) {
            filters = settings.filters;
        }

        filters.forEach(function (it, i) {
            if (typeof it == "string") {
                it = { property: it };
            }

            var v = "";
            var c = "";
            var value = it.value;
            var property = it.property;
            var condition = it.condition;
            var operand = it.operand;
            var action = it.action;
            var type = it.type;
            var filters = it.filters;
            var isGroup = false;

            if (group) {
                value = typeof it.value == "undefined" ? group.value : value;
                property = typeof it.property == "undefined" ? group.property : property;
                condition = typeof it.condition == "undefined" ? group.condition : condition;
                operand = typeof it.operand == "undefined" && group.innerOperand ? group.innerOperand : operand;
                type = typeof it.type == "undefined" && group.type ? group.type : type;
            }

            if (property.contains(",")) {
                isGroup = true;
                filters = property.split(",").select(function (p, i) {
                    var r = {
                        property: p,
                        operand: "or"
                    };
                    return r;
                });
            }

            v = ejs.gfv(value);
            c = ejs.gfv(condition);

            if (ejs.isEmpty(v)) {
                return;
            }

            var f = ejs.cwp(property, v, c, type, operand, action);

            if (isGroup) {
                it.value = typeof it.value == "undefined" ? v : it.value;
                f.SubParameters = getWhere(filters, it);
                f.DataType = "Group";
            }

            result.push(f);
        });

        return result;
    }

    function createPage(index, text, separator, from, to) {
        var page = {
            index: index,
            text: text,
            from: from,
            to: to,
            separator: separator,
            selected: ko.computed(function () {
                return me.current() == index;
            }),
            go: function () {
                me.goTo(index);
            }
        };

        return page;
    };

    function generatePages() {
        var size = settings.pageSize <= 0 ? me.totalCount() : settings.pageSize;
        var maxCount = count = parseInt(me.totalCount() / size);
        var current = me.current();
        var i = 0;
        var source = settings.set.load();

        if (me.totalCount() < (current + 1) * size) {
            me.shownTo(me.totalCount());
        } else {
            me.shownTo((current + 1) * size);
        }

        me.shownFrom(me.totalCount() > 0 ? current * size + 1 : 0);

        if (count < me.totalCount() / size) {
            count++;
            maxCount++;
        }

        var pages = [];

        if (count > 10) {
            i = current - 5;
            count = current + 5;
            if (i < 0) {
                count += i * -1;
                i = 0;
            }
            if (count > maxCount) {
                i -= count - maxCount + 1;
                count = maxCount;
            }
        }

        if (settings.compressPages) {
            if (i > 0) {
                pages.push(createPage(0, "1", false, "", ""));
                pages.push(createPage(i - 1, "...", true, "", ""));
            }

            for (; i < count; i++) {
                pages.push(createPage(i, (i + 1).toString(), false, "", ""));
            }

            if (count < maxCount) {
                pages.push(createPage(i, "...", true, "", ""));
                pages.push(createPage(maxCount - 1, maxCount.toString(), false, "", ""));
            }
        } else {
            for (i = 0; i < maxCount; i++) {
                var from = "";
                var to = "";

                if (params.textColumn) {
                    var end = (i + 1) * size;

                    if (end >= source.length) {
                        end = source.length - 1;
                    }

                    from = ko.get(source[i * size][params.textColumn]);
                    to = ko.get(source[end][params.textColumn]);
                }

                pages.push(createPage(i, (i + 1).toString(), false, from || "_", to || "_"));
            }
        }

        me.pages(pages);

        return pages;
    }

    ctor();
};