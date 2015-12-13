/*-- File version 0.0.2.27 from 2015.07.23 --*/
ejs.crud = function (options) {
    var me = this;
    var koModel = options.koModel;
    var model = options.model;
    var set = options.set;
    var columns = options.columns;
    var grid = $("<table class='grid'></table>");
    var wrapper = koModel;

    var names = {};
    var classServerName = ejs.toServerName(set.settings.className);
    var setServerName = ejs.toServerName(set.settings.name);
    var pagerName = names.pagerName = options.pagerName || set.settings.name + "Pager";
    var fnEditName = names.fnEditName = "edit" + classServerName;
    var fnRemoveName = names.fnRemoveName = "remove" + classServerName;
    var fnRemoveSelectedName = names.fnRemoveSelectedName = "removeSelected" + setServerName;
    var fnCreateName = names.fnCreateName = "create" + classServerName;
    var fnCancelName = names.fnCancelName = "cancel" + classServerName;
    var fnUpdateName = names.fnUpdateName = "update" + classServerName;
    var fnSelectName = names.fnSelectName = "select" + classServerName;
    var fnAutocompleteName = names.fnAutocompleteName = "selectAutocomplete" + classServerName;
    var filterName = names.filterName = "filter" + classServerName;
    var crudName = names.crudName = options.crudName || ("crud" + classServerName);
    var obsName = names.obsName = set.settings.className;
    var selectedName = names.selectedName = "selected" + classServerName;
    var selectManyName = names.selectManyName = "selectMany" + classServerName;
    var selectAllName = names.selectAllName = "selectAll" + setServerName;
    var renderer = null;
    var editor = null;
    var textProvider = null;

    me.events = {
        beforeCreating: ejs.createEvent(),
        creating: ejs.createEvent(),
        created: ejs.createEvent(),
        editing: ejs.createEvent(),
        edited: ejs.createEvent(),
        validating: ejs.createEvent(),
        validated: ejs.createEvent(),
        updating: ejs.createEvent(),
        updated: ejs.createEvent(),
        canceling: ejs.createEvent(),
        cancelled: ejs.createEvent(),
        beforeRemoving: ejs.createEvent(),
        removing: ejs.createEvent(),
        removed: ejs.createEvent(),
        saving: ejs.createEvent(),
        saved: ejs.createEvent(),
        selecting: ejs.createEvent(),
        selected: ejs.createEvent(),
        applyFilter: ejs.createEvent(),
        cancelFilter: ejs.createEvent()
    };

    ctor = function () {
        options = $.extend(ejs.crud.getDefaultOptions(), options);
        options.crud = me;
        options.names = names;
        me.options = options;

        koModel[crudName] = me;

        if (options.wrap) {
            me.wrapper = {};
            wrapper = me.wrapper;
        }

        options.wrapper = wrapper;
        options.wrapper[crudName] = me;
        options.filterConditions = options.filterConditions !== false;

        if (options.renderer) {
            renderer = new options.renderer(options);
        } else if (options.pure) {
            renderer = new ejs.crud.pureRenderer(options);
        } else {
            renderer = new ejs.crud.defaultRenderer(options);
        }

        editor = options.editor || ejs.crud.getDefaultEditor(options);
        textProvider = options.textProvider || ejs.crud.getDefaultTextProvider(options);
        options.textProvider = textProvider;

        if (!wrapper[obsName]) {
            wrapper[obsName] = ko.obs(null);
        }

        if (options.selectPageSize && options.gridColumnsSettings && options.gridColumnsSettings.pageSize) {
            options.pageSize = options.gridColumnsSettings.pageSize;
        }

        wrapper[pagerName] = new ejs.remotePager({
            set: set,
            model: model,
            pageSize: options.pageSize || 20,
            orderBy: options.orderBy,
            orderDesc: options.orderDesc,
            filters: getPagerFilters(),
            includes: options.includes,
            whereMethod: options.whereMethod,
            orderMethod: options.orderMethod,
            customSelect: options.customSelect,
            selectMode: options.selectMode
        });

        wrapper[fnRemoveName] = function (row) {
            var e = { row: row, cancel: false };
            me.events.beforeRemoving.raise(e);
            if (e.cancel) {
                return;
            }

            var m = textProvider.confirmDeleteTemplate.replace(/[{][0][}]/gi, row.entity.toString());
            if (typeof row["deletable"] != "undefined" && !row["deletable"]()) {
                ejs.alert(textProvider.unableDelete, textProvider.unableDelete);
                return;
            }

            ejs.confirmRemove(textProvider.confirmDelete, m, function () {
                removeRow(row);
                autoSave();
            });
        };

        wrapper[fnEditName] = function (row) {
            var e = { row: row, cancel: false }
            me.events.editing.raise(e);
            if (e.cancel) {
                return;
            }

            if (typeof options.editLink == "function") {
                window.location = options.editLink(row);
                return;
            } else if (options.editLink) {
                var url = options.editLink.replace(/[{]id[}]/gi, row.id());
                window.location = url;
                return;
            }

            row.entity.backup();
            wrapper[obsName](row);
            wrapper[obsName].edit = true;
            wrapper[obsName].insert = false;
            editor.edit();
            me.events.edited.raise(e);
        };

        wrapper[fnCreateName] = function () {
            if (wrapper[obsName]()) {
                wrapper[fnCancelName]();
            }
            var e = { cancel: false }
            me.events.beforeCreating.raise(e);
            if (e.cancel) {
                return;
            }

            if (options.createLink) {
                window.location = options.createLink;
                return;
            }

            var row = set.create().toKo();
            var e = { row: row, cancel: false }
            me.events.creating.raise(e);
            if (e.cancel) {
                row.entity.remove();
                return;
            }
            wrapper[obsName](row);
            wrapper[obsName].edit = false;
            wrapper[obsName].insert = true;
            editor.insert();
            me.events.created.raise(e);
            return row;
        };

        wrapper[fnCancelName] = function () {
            var row = wrapper[obsName]();
            wrapper[obsName](null);
            me.events.canceling.raise({ row: row, insert: wrapper[obsName].insert, edit: wrapper[obsName].edit });
            if (wrapper[obsName].insert) {
                if (row.entity) {
                    row.entity.remove();
                }
            } else {
                row.entity.restore();
            }
            me.events.cancelled.raise({ row: row, insert: wrapper[obsName].insert, edit: wrapper[obsName].edit });
        };

        wrapper[fnUpdateName] = function (callback) {
            var row = wrapper[obsName]();
            var e = { row: row, insert: wrapper[obsName].insert, edit: wrapper[obsName].edit, cancel: false };
            me.events.updating.raise(e);
            if (e.cancel) {
                return false;
            }
            if (wrapper[obsName].edit) {
                row.entity.commit();
            }
            wrapper[obsName](null);
            e = { row: row, insert: wrapper[obsName].insert, edit: wrapper[obsName].edit };
            me.events.updated.raise(e);
            autoSave();
	    if (typeof callback == "function") {
                callback(e);
            }
            return true;
        };

        wrapper[fnAutocompleteName] = function (property) {
            var col = options.columns.first("val=>val.name=='" + property + "'");

            if (typeof col.filterAutocomplete == "function") {
                return col.filterAutocomplete;
            }

            var r = function (request, response) {
                if (!request || !response) {
                    return;
                }

                var ws = [ejs.cwp("Distinct", ejs.toServerName(property))];
                var t = request.term || "";

                if (options.removeField) {
                    ws.push(ejs.cwp(options.removeField, false, "=", "bool"))
                }

                if (t) {
                    t = "%" + t.toLowerCase() + "%";
                    ws.push(ejs.cwp(property, t, "like"))
                }

                var o = ejs.createSelectOptions(options.model[set.settings.name], ws, ejs.cop(property), 10, 0, null, null, null);

                model.select(o, function (result) {
                    response(result.collections[set.settings.name].select(function (it, i) {
                        var r = {
                            label: it[property],
                            value: it[property],
                            item: it
                        };
                        return r;
                    }));
                });
            };

            return r;
        };

        if (options.selectMany) {
            wrapper[selectManyName] = ko.observableArray([]);
            wrapper[pagerName].events.pageChanged.attach(function (e) {
                wrapper[selectManyName]([]);
            });
            wrapper[fnRemoveSelectedName] = function () {
                var rows = wrapper[selectManyName]().copy();
                if (!rows.length) {
                    alert(textProvider.nothingSelected);
                    return;
                }
                var m = textProvider.confirmDeleteSelected(rows.length);
                ejs.confirmRemove(m, m, function () {
                    var nonDeletable = [];
                    rows.forEach(function (it, i) {
                        var row = options.set.getByID(it).toKo();
                        if (typeof row["deletable"] != "undefined" && !row["deletable"]()) {
                            nonDeletable.push(row.toString());
                            return;
                        }
                        removeRow(row);
                    });
                    if (nonDeletable.any()) {
                        ejs.alert(textProvider.unableDelete, textProvider.unableDelete, null, nonDeletable.join(", "));
                    }
                    autoSave();
                    wrapper[selectManyName]([]);
                });
            };
            wrapper[selectAllName] = ko.cmp({
                read: function () {
                    return wrapper[selectManyName]().length == koModel[options.set.settings.name]().length;
                },
                write: function (newValue) {
                    if (newValue) {
                        wrapper[selectManyName](koModel[options.set.settings.name]().select("val=>val.id().toString()"));
                    } else {
                        wrapper[selectManyName]([]);
                    }
                }
            });
            me.events.removed.attach(function (e) {
                var selected = wrapper[selectManyName]();
                selected.removeEl(e.row.id().toString());
                if (selected.length != wrapper[selectManyName]().length) {
                    wrapper[selectManyName](selected);
                }
            });
        }
        if (options.select) {
            if (!wrapper[selectedName]) {
                wrapper[selectedName] = ko.observable(null);
            }
            wrapper[fnSelectName] = function (row) {
                if (options.removeField && row[options.removeField]()) {
                    return;
                }
                me.events.selecting.raise({ row: row });
                wrapper[selectedName](row);
                me.events.selected.raise({ row: row });
            };
        }

        options.columns.forEach(function (it, i) {
            if (it.formatter) {
                it.formatters = [it.formatter];
            }

            if (!it.formatters || !it.formatters.length) {
                return;
            }

            options.model.events.koCreated.attach(function (e) {
                if (e.className != options.set.settings.className) {
                    return;
                }

                var p = it.editValue || it.value || it.name;

                e.ko[p].subscribe(function (newValue) {
                    var formattedValue = newValue;

                    it.formatters.forEach(function (f) {
                        formattedValue = f.apply(formattedValue);
                    });

                    if (formattedValue !== newValue) {
                        e.ko[p](formattedValue);
                    }
                });
            });
        });

        renderer.render();
        editor.render();
    };

    me.refresh = function () {
        wrapper[pagerName].refresh();
    };

    me.getPager = function () {
        return wrapper[pagerName];
    };

    me.create = function () {
        wrapper[fnCreateName]();
    };

    me.update = function () {
        return wrapper[fnUpdateName]();
    };

    me.cancel = function () {
        wrapper[fnCancelName]();
    };

    me.edit = function (row) {
        wrapper[fnEditName](row);
    };

    me.remove = function (row) {
        wrapper[fnRemoveName](row);
    };

    me.save = function () {
        var e = { cancel: false, crud: me };
        me.events.saving.raise(e);
        if (e.cancel) {
            return;
        }
        if (!options.model.hasChanges()) {
            me.events.saved.raise(e);
            return;
        }
        options.model.update(function (e) {
            if (e.errors && e.errors.any()) {
                me.events.saved.raise(e);
                return;
            }
            if (options.removeField) {
                var rows = options.set.load().copy();
                rows.forEach(function (it, i) {
                    if (!it[options.removeField]()) {
                        return;
                    }
                    it.detach();
                });
            }
            me.events.saved.raise(e);
        });
    };

    me['export'] = function () {
        if (!options.excel) {
            return;
        }
        var so = me.getPager().gso();
        so.includes = options.excelIncludes || so.includes;

        var name = options.excel;
        var fields = columns.where("val=>val.excel!==false&&!val.editOnly");
        fields = fields.select(function (it) {
            return { name: it.showTitle || it.title || it.name, value: it.excel || it.orderBy || it.name };
        });
        model['export']({ selectOptions: so, name: name, parameters: fields });
    };

    me.getEditor = function () {
        return editor;
    };

    me.getRenderer = function () {
        return renderer;
    };

    me.applyFilter = function () {
        me.events.applyFilter.raise();
        me.getPager().refresh();
    };

    me.cancelFilter = function () {
        me.events.cancelFilter.raise();
        me.getPager().refresh();
    };

    function autoSave() {
        if (!options.autoSave) {
            return;
        }
        me.save();
    }

    function getFilterType(c) {
        var type = c.filterType || c.type;
        if (type == "select") {
            return "number";
        } else if (type == "checkbox") {
            return "bool";
        }
        return type;
    }

    function getPagerFilters() {
        var filters = options.filters;
        if (!filters) {
            filters = [];
        }
        if (options.removeField) {
            filters.push({
                property: options.removeField,
                value: false,
                condition: "=",
                type: "bool"
            });
        }

        var createFilter = function (it, koFilter) {
            var type = getFilterType(it);
            var controlType = it.filterType || it.type;
            var getValueObs = function () {
                if (controlType == "select") {
                    return ko.obsa([]);
                }
                return ko.obs("");
            };

            if (!koFilter) {
                koFilter = {
                    value: getValueObs(),
                    condition: ko.obs("")
                };

                if (controlType == "select") {
                    koFilter.valueString = ko.cmp(function () {
                        var v = koFilter.value();
                        if (!v) {
                            return "";
                        }

                        return v.select(function (it, i) {
                            it = it.split("|");
                            it.splice(0, 1);
                            return it.join("");
                        }).join(", ");
                    });
                }
            }

            var stringConditions = [">=", "<=", "!=", { text: "<>", value: "!=" }, ">", "<", "=", { text: "*", value: "..*.." }];
            var filter = {
                property: it.filterName || it.name,
                condition: ko.obs(""),
                type: type,
                value: ko.obs("")
            };
            var apply = function () {
                var c;
                var v = koFilter.value();

                if (!v) {
                    filter.condition(getDefaultFilterCondition(it));
                    filter.value("");
                    return;
                }

                if (options.filterConditions) {
                    c = koFilter.condition();
                } else {
                    var sv = v.toString();
                    stringConditions.orderBy("val=>val.length", true).forEach(function (it, i) {
                        var t = it.text || it;
                        if (sv.indexOf(t) == 0) {
                            c = it.value || it.text || it;
                            v = sv.replace(t, "");
                        }
                    });

                    if (!c) {
                        c = getDefaultFilterCondition(it);
                    }
                }

                switch (c) {
                    case "..*..":
                        filter.condition("like");
                        filter.value("%" + v + "%");
                        break;
                    case "*..":
                        filter.condition("like");
                        filter.value(v + "%");
                        break;
                    case "..*":
                        filter.condition("like");
                        filter.value("%" + v);
                        break;
                    default:
                        filter.condition(c);
                        filter.value(v);
                        break;
                }

                if (filter.type == "bool") {
                    if (v == "on") {
                        filter.value(true);
                    } else if (v == "off") {
                        filter.value(false);
                    } else {
                        filter.value("");
                    }
                } else if (controlType == "select") {
                    if (!v.length) {
                        filter.value("");
                        return;
                    }

                    v = v.select("val=>val.split('|')[0]");

                    if (v.length > 1) {
                        filter.value(v.select("val=>val"));
                    } else {
                        filter.value(v[0]);
                    }
                } else if (filter.type == "number" && it.type != "select") {
                    filter.value(ejs.parseFloat(v));
                } else if (filter.type == "date") {
                    var nv;
                    try {
                        nv = parseDate(v).toSds();
                    }
                    catch (ex) {
                        nv = "";
                    }
                    filter.value(nv);
                } else if (filter.type == "time") {
                    if (!ejs.isTime(v)) {
                        filter.value("");
                    }
                }
            };

            if (options.filterConditions) {
                koFilter.condition.subscribe(apply);
            }
            koFilter.value.subscribe(apply);
            
            me.events.cancelFilter.attach(function () {
                koFilter.condition(getDefaultFilterCondition(it));
                if (controlType == "select") {
                    koFilter.value([]);
                } else {
                    koFilter.value(null);
                }
            });

            return { koFilter: koFilter, filter: filter };
        };

        if (options.gridFilter) {
            wrapper[options.names.filterName] = {};
            options.columns.forEach(function (it, i) {
                if (!it.filter) {
                    return;
                }

                if (name.indexOf(",") >= 0) {
                    var names = name.split(",");
                    var groupFilter = {
                        property: "group",
                        type: "group",
                        condition: "like",
                        innerOperand: "or",
                        filters: []
                    };

                    names.forEach(function (n) {
                        it.filterName = n;
                        var filter = createFilter(it, wrapper[options.names.filterName][it.name]);

                        wrapper[options.names.filterName][it.name] = filter.koFilter;
                        groupFilter.filters.push(filter.filter);
                    });

                    groupFilter.value = wrapper[options.names.filterName][it.name].value;
                    filters.push(groupFilter);
                } else {
                    var filter = createFilter(it);

                    wrapper[options.names.filterName][it.name] = filter.koFilter;
                    filters.push(filter.filter);
                }
            });
        }

        return filters;
    }

    function getDefaultFilterCondition(c) {
        var type = c.filterType || c.type;
        if (!type || type == "string") {
            return "..*.."
        }
        return "=";
    };

    function removeRow(row) {
        var e = { row: row, cancel: false };
        me.events.removing.raise(e);
        if (e.cancel) {
            return;
        }
        if (options.removeField) {
            row.entity[options.removeField](true);
        } else {
            row.entity.remove();
        }
        me.events.removed.raise({ row: row });
    }

    ctor();
};

ejs.crud.getDefaultOptions = function () {
    return {
        filterConditions: false,
        filterVisible: true,
        pageSize: 20
    };
};

ejs.crud.pureRenderer = function (options) {
    var me = this;
    var localWhere = options.localWhere;
    var uid = Math.floor(Math.random() * 10001);
    var headerID = "divEjsGridHeader" + uid;
    var tableID = "tblEjsGrid" + uid;
    var scriptID = "scrEjsGrid" + uid;
    var styleID = "stlEjsGrid" + uid;
    var container = null;
    var showColumns = [];
    var gridName = "";
    var rootPath = "$root";
    var showFilterName = "";

    me.events = {};
    me.events.printing = ejs.createEvent();

    function ctor() {
        me.options = options;
        container = $(options.container);
        showColumns = options.columns.where("val=>!val.editOnly");
        options.gridName = gridName = options.set.settings.name + "Grid";
        showFilterName = "showFilter" + options.set.settings.name;

        if (options.wrap) {
            rootPath = "$root." + options.names.crudName + ".wrapper";
        }

        options.wrapper[showFilterName] = function (name) {
            var div = options.container.find("div.check-list." + name + ":first");

            if (!div.data("hover")) {
                div.hover(function () {
                    div.data("hover", "1");
                }, function () {
                    div.data("hover", "done");
                });
                div.data("hover", "done")
            }

            var hide = function () {
                if (div.data("hover") == "1") {
                    return;
                }

                div.data("visible", false);
                div.slideUp(50);
                $(document).unbind("click", hide);
            };

            var show = function () {
                div.slideDown(150);
                div.data("visible", true);
            };

            if (div.data("visible")) {
                div.data("hover", "done");
                hide();
                return;
            }

            $(document).unbind("click", hide);
            show();

            setTimeout(function () {
                $(document).click(hide);
            }, 500);
        };
    }

    me.render = function () {
        $("body").append(me.renderScript());
        container.append(me.renderHeader());
        container.append(me.renderTable());

        var source = options.koModel[options.set.settings.name];
        var crudSettings = ejs.crud.getDefaultSettings();

        options.wrapper[gridName] = new ejs.grid({
            container: "#" + tableID,
            source: source,
            orderBy: options.orderBy,
            orderDesc: options.orderDesc,
            koTemplateID: scriptID,
            headerContainer: $("#" + headerID),
            parentScroll: options.gridParentScroll,
            styleID: styleID,
            tableID: tableID,
            columns: [],
            sortable: !(options.gridSortable === false),
            autoSort: options.gridAutoSort === true,
            sortMethod: options.sortMethod || options.wrapper[options.names.pagerName].order,
            disallowSort: ["Save", "Select"].concat(options.columns.where("val=>val.sortable===false").select("val=>val.name")),
            settingsName: options.gridSettingsName,
            columns: options.gridColumnsSettings,
            autoRefresh: options.gridAutoRefresh,
            padding: options.gridPadding,
            filter: options.gridFilter,
            filterVisible: options.filterVisible,
            pageSize: options.pageSize
        });

        options.wrapper[options.names.pagerName].events.pageChanged.attach(function (e) {
            me.options.wrapper[gridName].refreshHeaderFooter();
        });

        if (options.selectPageSize) {
            var sizes = [];
            options.crud.pageSize = ko.obs(options.pageSize);
            crudSettings.selectPageSizes.forEach(function (it, i) {
                var t;

                if (it > 0) {
                    t = it + " " + options.textProvider.rowsPerPage;
                } else {
                    t = options.textProvider.allRows;
                }

                sizes.push({
                    value: it,
                    text: t
                });
            });

            options.crud.pageSizes = ko.obsa(sizes);
            options.crud.pageSize.subscribe(function (newValue) {
                me.options.wrapper[options.names.pagerName].pageSize(newValue);
                me.options.wrapper[gridName].pageSize(newValue);
            });
        }

        setTimeout(function () {
            me.options.wrapper[gridName].refreshHeaderFooter();
        }, 500);
    };

    me.renderHeader = function () {
        var html = "<div id='" + headerID + "'></div>";
        return html;
    };

    me.renderThead = function () {
        var html = ["<thead><tr>"];
        if (options.selectMany) {
            html.push("<th colname='Select' title='", options.textProvider.selectColumnTitle, "'><span class='th'><input type='checkbox' data-bind='checked: ", rootPath, ".", options.names.selectAllName, "' /></span></th>");
        }
        showColumns.forEach(function (it, i) {
            html.push("<th colname='", it.name, "' title='", it.title, "'");
            if (it.orderBy) {
                html.push(" orderBy='", it.orderBy, "'");
            }
            html.push("><span class='th'>", it.title, "</span></th>");
        });
        html.push("<th colname='Save'><span class='th'><a href='javascript:' class='save icon' title='", options.textProvider.saveColumns, "'");
        html.push(" data-bind='click: ", rootPath, ".", gridName, ".saveSettings.save, visible: !", rootPath, ".", gridName, ".saveSettings.inProgress()'></a>");
        html.push("<span class='loading icon' data-bind='visible: ", rootPath, ".", gridName, ".saveSettings.inProgress()'></span>");

        if (options.gridFilter) {
            html.push("<a href='javascript:' class='icon filter' title='", options.textProvider.toggleFilter, "' data-bind='click: function() { ", rootPath, ".", gridName, ".toggleFilter(); }'></a>");//&nbsp;
        }

        html.push("</span></th></tr>");

        if (options.gridFilter) {
            html.push("<tr class='filter'>");
            if (options.selectMany) {
                html.push("<td colname='Select' title='", options.textProvider.selectColumnTitle, "'><span class='th'>&nbsp;</span></td>");
            }
            showColumns.forEach(function (it, i) {
                var type = it.filterType || it.type;
                var name = it.name;

                html.push("<td colname='", it.name, "' title='", it.title, "'><div class='td'>");
                if (!it.filter) {
                    html.push("</div></td>");
                    return;
                }
                html.push("<form data-bind='event: { submit: function() {$root.", options.names.crudName, ".applyFilter(); return false;} }'>");

                if (options.filterConditions) {
                    html.push("<div class='conditions'><select class='conditions' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".condition'>");
                    switch (type) {
                        case "date":
                        case "time":
                        case "datepicker":
                        case "number":
                            html.push("<option value='='>=</option><option value='!='>!=</option><option value='&gt;='>&gt;=</option><option value='&lt;='>&lt;=</option><option value='&gt;'>&gt;</option><option value='&lt;'>&lt;</option>");
                            break;
                        case "select":
                        case "checkbox":
                            html.push("<option value='='>=</option><option value='!='>!=</option>");
                            break;
                        default:
                            html.push("<option value='..*..'>..*..</option><option value='='>=</option><option value='&gt;='>&gt;=</option><option value='&lt;='>&lt;=</option><option value='&gt;'>&gt;</option><option value='&lt;'>&lt;</option><option value='*..'>*..</option><option value='..*'>..*</option>");
                            break;
                    }
                    html.push("</select></div>");
                }

                html.push("<div class='control", (options.filterConditions ? "" : " noconditions"), "'>");

                switch (type) {
                    case "select":
                        var ov = it.filterOptionsValue || it.optionsValue || "id";
                        var ot = it.filterOptionsText || it.optionsText || "name";
                        var op = it.filterOptionsParent || it.optionsParent;
                        var os = it.filterOptions || it.options;

                        html.push("<input class='select' readonly='readonly' type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".valueString(), click: function() { ", rootPath, ".", showFilterName, "(&quot;", name, "&quot;); }'/>");

                        if (op) {
                            html.push("<div class='check-list ", name, "' data-bind=''><dl data-bind='foreach: $root.", os, ".where(\"val=>!val.", op, "()\")'>");
                            html.push("<dt data-bind='html: $data.", ot, "'></dt>");
                            html.push("<!-- ko foreach: $root.", os, ".where(\"val=>val.", op, "()==\" + $data.", ov, "()) -->");
                            html.push("<dd><label><input type='checkbox' data-bind='checked: ", rootPath, ".", options.names.filterName, ".", name, ".value, value: $data.", ov, "().toString() + \"|\" + $data.", ot, "()'/> <span data-bind='html: $data.", ot, "'></span></label></dd>");
                            html.push("<!-- /ko -->");
                            html.push("</div>");
                        } else {
                            html.push("<div class='check-list ", name, "' data-bind='foreach: $root.", os, "'><label><input type='checkbox' data-bind='checked: ", rootPath, ".", options.names.filterName, ".", name, ".value, value: $data.", ov, "().toString() + \"|\" + $data.", ot, "()'/> <span data-bind='html: $data.", ot, "'></span></label></div>");
                        }
                        break;
                    case "checkbox":
                        html.push("<select data-bind='options: [{ value: null, text: \" \" } , { value: \"on\", text: \"", options.textProvider.bool.yes, "\" }, { value: \"off\", text: \"", options.textProvider.bool.no, "\"}], optionsText: \"text\", optionsValue: \"value\", value: ", rootPath, ".", options.names.filterName, ".", name, ".value'></select>");
                        break;
                    case "date":
                    case "datepicker":
                        if (options.filterConditions) {
                            html.push("<input type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value, datepicker: true' />");
                        } else {
                            html.push("<input type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value' />");
                        }
                        break;
                    case "time":
                        if (options.filterConditions) {
                            html.push("<input type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value, timepicker: true' />");
                        } else {
                            html.push("<input type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value' />");
                        }
                        break;
                    default:
                        html.push("<input type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value, valueUpdate: \"afterkeydown\"");
                        if (it.filterAutocomplete) {
                            html.push(", simpleAutocomplete: ", rootPath, ".", options.names.fnAutocompleteName, "(\"", name, "\")");
                        }
                        html.push("' />");
                        break;
                }

                html.push("</div></form></div></td>");
            });
            html.push("<td colname='Save'><div class='th'><a href='javascript:' class='icon check' data-bind='click: $root.", options.names.crudName, ".applyFilter' title='", options.textProvider.applyFilter, "'></a>");
            html.push("&nbsp;<a href='javascript:' class='icon cross' data-bind='click: $root.", options.names.crudName, ".cancelFilter' title='", options.textProvider.clearFilter, "'></a></div></td>");
        }

        html.push("</thead>");
        return html.join("");
    };

    me.renderTbody = function () {
        var source = "";
        if (options.gridSource) {
            source = options.gridSource;
        } else {
            source = "$root." + options.set.settings.name;
            source += localWhere ? "().where('" + localWhere + "')" : "";
        }
        var html = ["<tbody data-bind='visible: !$root.", options.set.settings.name, "().any()'><tr class='foot'>"];
        if (options.selectMany) {
            html.push("<td colname='Select'><div class='td'></div></td>");
        }
        showColumns.forEach(function (it, i) {
            html.push("<td colspan='1' colname='", it.name, "'><div class='td'><span></span></div></td>");
        });
        html.push("<td colname='Save'><div class='td'></div></td></tr></tbody>");
        html.push("<tbody><!-- ko template: { name: \"", scriptID, "\", foreach: ", source, "}--><!-- /ko --></tbody>");
        return html.join("");
    };

    me.renderTfoot = function () {
        if (options.noFooter) {
            return "";
        }

        var length = options.selectMany ? showColumns.length + 2 : showColumns.length + 1;
        var html = ["<tfoot><tr><td colspan='", length, "' class='pager'><div class='pager'><div class='shown'>"];
        html.push(options.textProvider.pager.shown);
        html.push(" <span data-bind='html: ", rootPath, ".", options.names.pagerName, ".shownFrom'></span><span>-</span>");
        html.push("<span data-bind='html: ", rootPath, ".", options.names.pagerName, ".shownTo'></span>");
        html.push(" <span>", options.textProvider.pager.from, " </span><span data-bind='html: ", rootPath, ".", options.names.pagerName, ".totalCount'></span>");
        if (options.selectPageSize) {
            html.push(" &nbsp; <span>|</span> <select data-bind='optionsValue: \"value\", optionsText: \"text\", options: $root.", options.names.crudName, ".pageSizes, value: $root.", options.names.crudName, ".pageSize'></select>");
        }
        html.push("</div>");
        if (options.create) {
            html.push("<div class='insert'><a class='icon insert text' href='");

            if (options.createLink) {
                html.push(options.createLink, "'");
            } else {
                html.push("javascript:' data-bind='click: ", rootPath, ".", options.names.fnCreateName, "'");
            }

            html.push("><span>", options.textProvider.insertNew, "</span></a></div>");
        }
        html.push("<div class='pages' data-bind='foreach: ", rootPath, ".", options.names.pagerName, ".pages'>");
        html.push("<a href='javascript:' data-bind='html: text, click: go, css: { selected: selected }'></a></div>");
        html.push("</div>");
        html.push("</td></tr></tfoot>");
        return html.join("");
    };

    me.renderTable = function () {
        var html = ["<table class='ejsgrid' id='", tableID, "'>", me.renderThead(), me.renderTbody(), me.renderTfoot(), "</table>"];
        return html.join("");
    };

    me.renderScript = function () {
        var html = ["<script type='text/html' id='", scriptID, "'><tr class='datarow' data-bind='"];
        var css = [];
        if (options.edit) {
            html.push("event: { dblclick: ", rootPath, ".", options.names.fnEditName, " }");
        }
        if (options.select) {
            css.push("selected: ", rootPath, ".", options.names.selectedName, "() == $data");
        }
        if (options.trcss) {
            for (var i in options.trcss) {
                if (css.length) {
                    css.push(", ");
                }
                css.push(i, ": ", options.trcss[i]);
            }
        }
        html.push(", css: { ", css.join(""), " }, click: ", rootPath, ".", options.names.fnSelectName, " '>");
        if (options.selectMany) {
            html.push("<td colname='Select'><div class='td'><input type='checkbox' data-bind='value: $data.id().toString(), checked: ", rootPath, ".", options.names.selectManyName, "'/></div></td>");
        }
        showColumns.forEach(function (it, i) {
            var tdStyle = it.tdStyle || options.tdStyle;
            var css = [];

            if (it.tdcss) {
                var cssi = 0;
                for (var i in it.tdcss) {
                    if (cssi > 0) {
                        css.push(", ");
                    }
                    css.push(i, ": ", it.tdcss[i]);
                    cssi++;
                }
                tdStyle = css.join("");
            }

            var val = it.showValue || it.value || it.name;
            var dataBind = it.eWith ? "with: " + it.eWith : "";
            var align = it.type == "number" ? "text-right" : it.align || "";
            html.push("<td colname='", it.name, "' data-bind='", (tdStyle ? "css: {" + tdStyle + "}" : ""), "'><div class='td ", align, "' data-bind='", dataBind, "'>");
            if (it.showTemplate) {
                html.push(ejs.getTemplate(it.showTemplate));
            } else if (it.template) {
                html.push(ejs.getTemplate(it.template));
            } else {
                switch (it.type) {
                    case "image":
                    case "img":
                        html.push("<span data-bind='if: $data.", val, "'><img data-bind='attr: { src: $data.", val, " }' /></span>");
                        break;
                    case "checkbox":
                    case "bool":
                        html.push("<input type='checkbox' disabled='disabled' data-bind='checked: $data.", val, "'/>");
                        break;
                    default:
                        html.push("<span data-bind='html: ", val.startsWith("$") ? val : "$data." + val, "'></span>");
                        break;
                }
            }
            html.push("</div></td>");
        });
        html.push("<td colname='Save'><div class='td'>");
        if (options.tdSaveTemplate) {
            var t = ejs.getTemplate(options.tdSaveTemplate);
            html.push(t);
        } else {
            if (options.edit) {
                html.push("<a ");

                if (!options.editLink || typeof options.editLink == "function") {
                    html.push("href='javascript:' ");
                }

                html.push("title='", options.disabled ? options.textProvider.viewRow : options.textProvider.editRow, "' class='icon ");
                html.push(options.disabled ? "view" : "edit");
                html.push("' data-bind='");

                if (options.editLink && typeof options.editLink != "function") {
                    html.push("attr: { href: \"", options.editLink, "\".replace(/[{]id[}]/gi, $data.id()) }")
                } else {
                    html.push("click: ", rootPath, ".", options.names.fnEditName);
                }

                html.push("'></a>");
            }
            if (options.remove) {
                html.push("<a href='javascript:' title='", options.textProvider.removeRow, "' class='icon remove' data-bind='click: ", rootPath, ".", options.names.fnRemoveName, "'></a>");
            }
        }
        html.push("</div></td></tr></script>");
        return html.join("");
    };

    me.print = function (onlySelected) {
        onlySelected = onlySelected === true;
        var pager = options.wrapper[options.names.pagerName];
        var size = pager.settings.pageSize;
        var fn = function () {
            ejs.openWindow(function (w) {
                $(w.document).find("title").html($("title").html());
                $(w.document).find("body").html(options.wrapper[gridName].print(onlySelected));
                me.events.printing.raise({ document: w.document });
                w.print();
                if (!onlySelected || pager.settings.pageSize != size) {
                    pager.settings.pageSize = size;
                    pager.refresh();
                }
            });
            ejs.free(me);
        };

        ejs.busy(me);

        if (size > 0 && pager.pages().length > 1 && !onlySelected) {
            pager.settings.pageSize = -1;
            pager.refresh(function () {
                fn();
            });
        } else {
            fn();
        }
    };

    ctor();
};

ejs.crud.defaultRenderer = function (options) {
    var me = this;
    var container = null;
    var showColumns = [];
    var edit = true;
    var remove = true;
    var set = null;
    var rootPath = "$root";

    function ctor() {
        container = $(options.container);
        showColumns = options.columns.where("val=>!val.editOnly");
        edit = options.edit;
        remove = options.remove;
        set = options.set;

        if (options.wrap) {
            rootPath = "$root." + options.names.crudName + ".wrapper";
        }
    }

    me.render = function () {
        container.html(me.renderTable());

        if (options.create) {
            container.append(me.renderCreate());
        }
    };

    me.renderThead = function () {
        var html = ["<thead><tr>"];
        showColumns.forEach(function (c, i) {
            var o = c.orderBy || c.name;
            html.push("<th><a href='javascript:' data-bind='click: function() { ", rootPath, ".", set.settings.name, "Pager.order(\"", o, "\"); }'>", c.title, "</a></th>");
        });
        if (remove) {
            html.push("<th><span></span></th>");
        }
        html.push("</tr></thead>");
        return html.join("");
    };

    me.renderTbody = function () {
        var html = ["<tbody data-bind='foreach: $root.", set.settings.name, "'>"];
        if (edit) {
            html.push("<tr data-bind='event: { dblclick: ", rootPath, ".edit", ejs.toServerName(set.settings.className), " }'>");
        } else {
            html.push("<tr>");
        }
        showColumns.forEach(function (c) {
            var v = c.value || c.name;
            if (c.showTemplate) {
                html.push("<td>", ejs.getTemplate(c.showTemplate), "</td>");
            } else if (c.template) {
                html.push("<td>", ejs.getTemplate(c.template), "</td>");
            } else {
                html.push("<td><span data-bind='html: ", v, "'></span></td>");
            }
        });
        if (remove) {
            html.push("<td><a href='javascript:' data-bind='click: ", rootPath, ".remove", ejs.toServerName(set.settings.className), "'>Удалить</a></td>");
        }
        html.push("</tr></tbody>");
        return html.join("");
    };

    me.renderTfoot = function () {
        if (options.noFooter) {
            return "";
        }

        var html = [];
        var count = remove ? showColumns.length + 1 : showColumns.length;

        html.push("<tfoot><tr><td colspan='", count, "'><div class='pager'>");
        html.push("<div class='toLeft'>", options.textProvider.pager.shown, "<span data-bind='html: ", rootPath, ".", set.settings.name, "Pager.shownFrom'></span> - <span data-bind='html: ", rootPath, ".", set.settings.name, "Pager.shownTo'></span> ", options.textProvider.pager.from, " <span data-bind='html: ", rootPath, ".", set.settings.name, "Pager.totalCount'></span></div>");
        html.push("<div data-bind='foreach: ", rootPath, ".", set.settings.name, "Pager.pages' class='text-center'><a href='javascript:' data-bind='html: text, click: go, css: { selected: selected }'></a></div>");
        html.push("</div></td></tr></tfoot>");

        return html.join("");
    };

    me.renderTable = function () {
        var html = ["<table class='grid'>", me.renderThead(), me.renderTbody(), me.renderTfoot(), "</table>"];
        return html.join("");
    };

    me.renderCreate = function () {
        var html = ["<div class='addbutton'><a href='javascript:' data-bind='click: ", rootPath, ".create", ejs.toServerName(set.settings.className), "'>", options.textProvider.insertNew, "</a></div>"];
        return html.join("");
    };

    ctor();
};

ejs.crud.defaultEditor = function (options, override) {
    var me = this;
    var set = null;
    var editColumns
    var editColumns = [];
    var dialog = null;
    var isDialogButton = false;
    var parent = null;
    var tabs = null;
    var filesInProgress = [];
    var rootPath = "$root";

    function ctor() {
        set = options.set;
        editColumns = options.columns.where("val=>!val.showOnly");

        if (options.wrap) {
            rootPath = "$root." + options.names.crudName + ".wrapper";
        }

        options.rootPath = rootPath;

        var withDefaultValue = editColumns.where("val=>val.defaultValue");

        if (withDefaultValue.any()) {
            options.crud.events.created.attach(function (e) {
                withDefaultValue.forEach(function (it, i) {
                    var n = it.editName || it.name;
                    var dv = it.defaultValue;
                    if (it.defaultValue == "now" && it.type == "date") {
                        dv = (new Date()).toSds();
                    } else if (it.defaultValue == "now" && it.type == "time") {
                        dv = (new Date()).toSts();
                    }
                    options.wrapper[options.names.obsName]()[n](dv);
                });
            });
        }
    }

    me.events = {
        autocompleteSelected: ejs.createEvent()
    };

    me.render = function () {
        var mh = (options.maxHeight || $(window).height()) - 150;
        dialog = $("<div></div>");
        dialog.html(me.renderDialog());
        $("body").append(dialog);
        dialog.dialog({
            autoOpen: false,
            modal: true,
            resizabe: true,
            draggable: true,
            maxHeight: $(window).height() - 140,
            width: options.width || 700,
            close: function () {
                if (!isDialogButton) {
                    me.cancel();
                }
                isDialogButton = false;
            },
            buttons: me.createDialogButtons(),
            resize: function (event, ui) { dialog.css("max-height", "none"); }
        });
        if (mh > 100) {
            dialog.css("max-height", mh + "px");
        }
        parent = dialog.parents(".ui-dialog:first");
        if (options.tabs) {
            parent.addClass("ui-tabs-dialog");
            $(dialog).data('dialog').uiDialog.draggable('option', {
                cancel: '.ui-dialog-titlebar-close, .ui-tabs-panel',
                handle: '.ui-tabs-nav, .ui-dialog-titlebar'//, .ui-dialog-content'
            });
        }

        if (!options.koModel.onFileUploaded) {
            options.koModel.onFileUploaded = ejs.createEvent();
        }
        if (!options.koModel.onFileSelected) {
            options.koModel.onFileSelected = ejs.createEvent();
        }

        options.wrapper[options.names.obsName].removeFile = function (name) {
            var c = getColumn(name);
            var o = options.wrapper[options.names.obsName]();
            o[c.name]("");
            o[c.value]("");
            o[c.src]("");
        };
        options.wrapper[options.names.obsName].selectFile = function (name) {
            var frm = $("#" + me.getFileUploadIframeID(name));
            var txt = frm.contents().find("input[type=file]");
            txt.click();
        };
        options.wrapper[options.names.obsName].autocompleteSelected = function (e) {
            me.events.autocompleteSelected.raise(e);
            return true;
        };
    };

    me.renderDialog = function () {
        var html = ["<div data-bind='if: ", rootPath, ".", set.settings.className, "'>", me.renderForm(), "</div>"];
        return html.join("");
    };

    me.title = function (title) {
        dialog.dialog("option", "title", title);
    };

    me.edit = function () {
        dialog.dialog("option", "title", options.disabled ? options.textProvider.dialog.viewTitle : options.textProvider.dialog.editTitle);
        me.open();
    };

    me.insert = function () {
        dialog.dialog("option", "title", options.textProvider.dialog.insertTitle);
        me.open();
    };

    me.getDialog = function () {
        return dialog;
    };

    me.onFileSelected = function (item) {
        var c = getColumn(item.name);
        if (!c) {
            return;
        }
        options.wrapper[options.names.obsName]()[c.value](item.value);
    };

    me.onFileUploaded = function (item) {
        if (!filesInProgress.contains(item.name)) {
            return;
        }
        var c = getColumn(item.name);
        var o = options.wrapper[options.names.obsName]();
        if (item.code == 200) {
            o[c.name](item.file.id);
            o[c.value](item.file.name);
            o[c.src](item.file.virtualPath);
        } else {
            alert(options.textProvider.dialog[item.message]);
        }
        filesInProgress.removeEl(item.name);
        if (!filesInProgress.length) {
            me.update();
        }
    };

    me.uploadFiles = function () {
        me.disableButtons();
        var columns = options.columns.where("val=>val.type=='file'||val.type=='fl'");
        if (!columns.length) {
            me.update();
            return;
        }
        var frms = dialog.find("iframe.upload").toArray().where(function (frm, i) {
            var txt = $(frm).contents().find("input[type=file]");
            return !!txt.val();
        });
        if (!frms.length) {
            me.update();
            return;
        }
        filesInProgress = [];
        frms.forEach(function (frm) {
            var f = $(frm).contents().find("form");
            var txt = f.find("input[type=file]");
            var hdn = f.find("input[name=FileID]");
            var n = txt.attr("name");

            hdn.val(options.wrapper[options.names.obsName]()[n]());
            filesInProgress.push(n);
        });
        frms.forEach(function (frm) {
            var f = $(frm).contents().find("form");
            f.submit();
        });
    };

    me.update = function () {
        if (!options.crud.update()) {
            me.enableButtons();
            return;
        }
        me.close();
    };

    me.cancel = function () {
        options.crud.cancel();
        me.close();
    };

    me.close = function () {
        options.koModel.onFileUploaded.detach(me.onFileUploaded);
        options.koModel.onFileSelected.detach(me.onFileSelected);
        isDialogButton = true;
        dialog.dialog("close");
    };

    me.open = function () {
        options.koModel.onFileSelected.attach(me.onFileSelected);
        options.koModel.onFileUploaded.attach(me.onFileUploaded);
        me.enableButtons();
        dialog.dialog("open");
    };

    me.enableButtons = function () {
        dialog.parents(".ui-dialog:first").find(".ui-dialog-buttonpane button").removeAttr("disabled").removeClass("ui-state-disabled");
    };

    me.disableButtons = function () {
        dialog.parents(".ui-dialog:first").find(".ui-dialog-buttonpane button").attr("disabled", true).addClass("ui-state-disabled");
    };

    me.validate = function () {
        var row = options.wrapper[options.names.obsName]();
        var e = { row: row };
        var event = options.wrapper[options.names.crudName].events.validating;
        event.raise(e);
        event = options.wrapper[options.names.crudName].events.validated;

        if (options.tabs) {
            tabs = dialog.find(".tabs");
            var selected = tabs.tabs("option", "selected");
            for (var i = 0; i < options.tabs.length; i++) {
                tabs.tabs("select", i);
                if (!dialog.find("form").valid()) {
                    e.result = false;
                    event.raise(e);
                    return false;
                }
            }
            tabs.tabs('select', selected);
        } else if (!dialog.find("form").valid()) {
            e.result = false;
            event.raise(e);
            return false;
        }
        e.result = true;
        event.raise(e);
        return true;
    };

    me.createDialogButtons = function () {
        if (!options.dialogButtons) {
            var buttons;

            if (options.disabled) {
                buttons = [{
                    text: options.textProvider.dialog.closeButton,
                    click: function () {
                        me.cancel();
                    }
                }];
            } else {
                buttons = [{
                    text: options.textProvider.dialog.saveButton,
                    click: function () {
                        if (!me.validate()) {
                            return;
                        }
                        me.uploadFiles();
                    }
                }, {
                    text: options.textProvider.dialog.cancelButton,
                    click: function () {
                        me.cancel();
                    }
                }];
            }

            if (override && override.createDialogButtons) {
                return override.createDialogButtons(buttons);
            }

            return buttons;
        }

        var buttons = [];

        options.dialogButtons.forEach(function (it, i) {
            var e = {
                button: it,
                validate: me.validate,
                update: me.uploadFiles,
                cancel: me.cancel,
                editor: me
            };
            buttons.push({
                text: it.title,
                click: function () {
                    it.click(e);
                }
            });
        });

        return buttons;
    };

    me.renderForm = function () {
        var html = ["<form data-bind='validate: true'>", me.renderTabs(), "</form>"];
        return html.join("");
    }

    me.renderTabs = function () {
        var html = [];
        if (options.tabs) {
            var onchange = options.tabChanged ? ", onchange: " + options.tabChanged : "";
            var context = ", context: " + rootPath + "." + options.names.obsName;
            html.push("<div class='tabs' data-bind='tabs: true" + onchange + context + "'><ul>");
            options.tabs.forEach(function (it, i) {
                var visible = typeof it.visible != "undefined" ? ["data-bind='visible: ", it.visible, "'"].join("") : "";
                html.push("<li><a href='#divEjsCrudTab", it.id, "' ", visible, ">", it.title, "</a></li>");
            });
            html.push("</ul>");
            options.tabs.forEach(function (it, i) {
                var dataBind = [];
                if (typeof it.visible != "undefined") {
                    dataBind.push("visible: " + it.visible);
                }
                if (it.eWith) {
                    dataBind.push("with: " + it.eWith);
                }
                if (it.dataBind) {
                    dataBind.push(it.dataBind);
                }
                dataBind = "data-bind='" + dataBind.join(",") + "'";
                html.push("<div id='divEjsCrudTab", it.id, "' ", dataBind, ">");
                if (it.template) {
                    html.push(ejs.getTemplate(it.template));
                } else {
                    html.push(me.renderTab(editColumns.where("val=>val.tabID=='" + it.id + "'"), it));
                }
                html.push("</div>");
            });
            html.push("</div>");
        } else {
            html.push(me.renderTab(editColumns));
        }
        html = html.join("");

        return html;
    };

    me.renderTab = function (columns, tab) {
        var html = [];
        var eWith = tab && tab.eWith ? "" : "with: " + rootPath + "." + options.names.obsName;
        html.push("<table class='adjuster inputMax' data-bind='", eWith, "'>");
        html.push(me.renderColumns(columns));
        html.push("</table>");
        return html.join("");
    };

    me.renderColumn = function (c) {
        if (override && override.renderColumn) {
            override.renderColumnContainerStart(html, c);
            return;
        }

        var html = [];
        var dataBind = [];
        html.push("<tr data-bind='");
        if (c.visible) {
            dataBind.push("visible: ", c.visible);
        }
        if (c.eWith) {
            if (dataBind.any()) {
                dataBind.push(",");
            }
            dataBind.push("with: ", c.eWith);
        }
        html.push(dataBind.join(""));
        html.push("'>");
        html.push(me.renderColumnTitle(c));
        html.push(me.renderColumnControl(c));
        html.push("</tr>");

        return html.join("");
    };

    me.renderColumnTitle = function (c) {
        if (override && override.renderColumnTitle) {
            return override.renderColumnTitle(c);
        }

        var html = [];
        html.push("<th><span>", c.editTitle || c.title, "</span>");
        if (c.required) {
            html.push("<span class='required'>*</span>");
        } else {
            html.push("<span class='required'>&nbsp;</span>");
        }
        html.push("</th>");
        return html.join("");
    };

    me.renderColumnControl = function (c) {
        if (override && override.renderColumnControl) {
            return override.renderColumnControl(c);
        }

        var html = [];

        html.push("<td><div>");
        html.push(me.renderControl(c));

        if (c.hint) {
            html.push("</div><div class='hint'>", c.hint);
        }
        html.push("</div></td>");

        return html.join("");
    };

    me.renderControl = function (c) {
        if (override && override.renderControl) {
            return override.renderControl(c);
        }

        var html = [];
        var disable = c.disable ? ", disable: " + c.disable : "";
        var attrDisabled = c.disable ? ",attr: { disabled: " + c.disable + "}" : "";

        if (options.disabled) {
            disable = ", disable: true";
        }

        switch (c.type) {
            case "select":
            case "ddl":
                var css = c.required ? "required" : "";
                var os = c.options;
                if (!/^[$].*/gi.test(os)) {
                    os = "$root." + os;
                }
                c.optionsValue = c.optionsValue || "id";
                c.optionsText = c.optionsText || "name";
                c.editValue = c.editValue || c.name;
                if (c.optionsParent) {
                    html.push("<select class='", css, "' data-bind='uniqueName: true, value: ", c.editValue, disable, ", foreach: ", os, ".where(\"val=>!val.", c.optionsParent, "()\")'>");
                    if (c.optionsCaption) {
                        html.push("<!-- ko if: $index() == 0 --> <option value=\"\">", c.optionsCaption, "</option> <!-- /ko -->");
                    }
                    html.push("<optgroup data-bind='attr: { label: $data.", c.optionsText, " }, options: ", os, ".where(\"val=>val.", c.optionsParent, "()==\" + $data.", c.optionsValue, "()), optionsText: \"", c.optionsText, "\", optionsValue: \"", c.optionsValue, "\"'></optgroup>")
                    html.push("</select>");
                } else {
                    html.push("<select class='", css, "' data-bind='uniqueName: true, options: ", os, ", optionsText: \"", c.optionsText, "\", optionsValue: \"", c.optionsValue, "\", optionsCaption: \"", c.optionsCaption, "\", value: ", c.editValue, disable, "'></select>");
                }
                break;
            case "multiselect":
                var css = c.required ? "required" : "";
                c.optionsValue = c.optionsValue || "id";
                c.optionsText = c.optionsText || "name";
                options.wrapper[options.names.obsName][c.name + "GetCmp"] = function (id) {
                    if (options.wrapper[options.names.obsName][c.name + "Cmp" + id]) {
                        return options.wrapper[options.names.obsName][c.name + "Cmp" + id];
                    }
                    var r = ko.cmp({
                        read: function () {
                            var o = options.wrapper[options.names.obsName]();
                            if (!o) {
                                return false;
                            }
                            var i = o[c.name]().first("val=>val." + c.theirKey + "()=='" + id + "'");
                            return !!i;
                        },
                        write: function (newValue) {
                            var o = options.wrapper[options.names.obsName]();
                            if (!o) {
                                return false;
                            }
                            if (o.busy) {
                                return;
                            }
                            o.busy = true;
                            var i = o[c.name]().first("val=>val." + c.theirKey + "()=='" + id + "'");
                            if (newValue && i) {
                                o.busy = false;
                                return;
                            }
                            if (!newValue && !i) {
                                o.busy = false;
                                return;
                            }
                            if (newValue && !i) {
                                i = options.model[c.name].create();
                                i[c.mineKey](o.id());
                                i[c.theirKey](id);
                            } else if (!newValue && i) {
                                i.entity.remove();
                            }
                            o.busy = false;
                        }
                    });
                    options.wrapper[options.names.obsName][c.name + "Cmp" + id] = r;
                    return r;
                };
                html.push("<div data-bind='foreach: $root.", c.options, "'>");
                html.push("<div><label><input type='checkbox' data-bind='checked: ", rootPath, ".", options.names.obsName, ".", c.name, "GetCmp(", c.optionsValue, "())'/>&nbsp;<span data-bind='html: ", c.optionsText, "'></span></label></div>");
                html.push("</div>");
                break;
            case "datepicker":
            case "date":
                var css = c.required ? "required date" : "date";
                html.push("<input type='text' class='", css, "' data-bind='uniqueName: true, datepicker: true, value: ", c.editValue || c.value || c.name, disable, "'/>");
                break;
            case "time":
                var css = c.required ? "required time" : "time";
                html.push("<input type='text' class='", css, "' data-bind='uniqueName: true, timepicker: true, value: ", c.editValue || c.value || c.name, disable, "'/>");
                break;
            case "number":
                var css = c.required ? "required number" : "number";
                html.push("<input type='text' class='", css, "' data-bind='uniqueName: true, value: ", c.editValue || c.value || c.name, disable, "'/>");
                break;
            case "password":
                var css = c.required ? "required" : "";
                html.push("<input type='password' class='", css, "' data-bind='uniqueName: true, value: ", c.editValue || c.value || c.name, disable, "'/>");
                break;
            case "textarea":
                var css = c.required ? "required" : "";
                html.push("<textarea cols='0' rows='5' class='", css, "' data-bind='uniqueName: true, value: ", c.editValue || c.value || c.name, disable, "'></textarea>");
                break;
            case "checkbox":
            case "chb":
                html.push("<input type='checkbox' data-bind='uniqueName: true, checked: ", c.editValue || c.value || c.name, disable, "'/>");
                break;
            case "image":
            case "img":
                html.push("<span data-bind='if: ", c.name, "'><img data-bind='attr: { src: ", c.name, " }' /></span>");
                break;
            case "file":
            case "fl":
                var css = c.required ? "required" : "";
                var reg = "";
                if (c.types) {
                    var types = c.types.split(",");
                    types.forEach(function (it, i) {
                        if (reg) {
                            reg += "|";
                        }
                        reg += "(.*[.]" + it + ")";
                    });
                    reg = " regex='^" + reg + "$'";
                }
                html.push("<input type='text' readonly='readonly'", reg, " class='", css, "' data-bind='uniqueName: true, value: ", rootPath, ".", options.names.obsName, "().", c.value, "' />");
                html.push(" <a href='javascript:' data-bind='click: function() { ", rootPath, ".", options.names.obsName, ".selectFile(\"", c.name, "\") }'>", options.textProvider.dialog.selectFile, "</a>");
                if (!c.required) {
                    html.push(" <a href='javascript:' data-bind='click: function() { ", rootPath, ".", options.names.obsName, ".removeFile(\"", c.name, "\") }'>", options.textProvider.dialog.removeFile, "</a>");
                }
                html.push(" <a data-bind='visible: ", c.src, "(), attr: { href: ejs.fdp(", c.value, "(), ", c.name, "()) }'>", options.textProvider.dialog.downloadFile, "</a>");
                html.push("<iframe style='display:none;' class='upload' frameborder='0' width='100%' scrolling='no' seamless='seamless' data-bind='attr: { src:  ejs.fup(\"", c.name, "\") }' id='", me.getFileUploadIframeID(c.name), "'></iframe>");
                break;
            case "spn":
            case "span":
                html.push("<span data-bind='html: ", c.editValue || c.value || c.name, "'></span>");
                break;
            case "dis":
            case "disabled":
                html.push("<input type='text' disabled='disabled' data-bind='value: ", c.editValue || c.value || c.name, "'/>");
                break;
            case "autocomplete":
                var css = c.required ? "required" : "";
                html.push("<div class='nowrap'><a href='javascript:' data-bind='click: function(e,a){ ", rootPath, ".openAutocomplete(e,a); }", attrDisabled, "' class='icon small lupa input-right'></a>");
                html.push("<input type='text' class='", css, "' data-bind='autocomplete: ", rootPath, ".", c.method, ", value: ", c.editValue || c.value, disable, ", selected: { source: \"id\", target: \"", c.editName || c.name, "\" }, onselect: function (event, ui) { ", rootPath, ".", options.names.obsName, ".autocompleteSelected({ event: event, ui: ui, name: \"", c.name, "\" }) } , uniqueName: true' />");
                html.push("</div>");
                break;
            default:
                var css = c.required ? "required" : "";
                css += c.css ? " " + c.css : "";
                if (c.editTemplate) {
                    html.push(ejs.getTemplate(c.editTemplate));
                } else if (c.template) {
                    html.push(ejs.getTemplate(c.template));
                } else {
                    html.push("<input type='text' class='", css, "' data-bind='uniqueName: true, value: ", c.editValue || c.value || c.name, disable, "'/>");
                }
                break;
        }

        return html.join("");
    }

    me.renderColumns = function (columns) {
        var html = [];
        columns.forEach(function (c) {
            if (c.editRowTemplate) {
                html.push(ejs.getTemplate(c.editRowTemplate));
                return;
            }

            html.push(me.renderColumn(c));
        });
        return html.join('');
    };

    me.getFileUploadIframeID = function (n) {
        return "frmUploadFile" + ejs.toServerName(options.set.settings.name) + ejs.toServerName(n);
    }

    function getColumn(n) {
        return options.columns.first("val=>val.name=='" + n + "'");
    }

    ctor();
};

ejs.crud.getDefaultEditor = function (options) {
    return new ejs.crud.defaultEditor(options);
};

ejs.crud.defaultTextProvider = function (options) {
    var me = this;

    me.dialog = {};
    me.dialog.viewTitle = "Просмотр записи";
    me.dialog.editTitle = "Редактирование записи";
    me.dialog.insertTitle = "Создание записи";
    me.dialog.cancelButton = "Отмена";
    me.dialog.saveButton = "Сохранить";
    me.dialog.closeButton = "Закрыть";
    me.dialog.selectFile = "Выбрать";
    me.dialog.removeFile = "Удалить";
    me.dialog.downloadFile = "Скачать";
    me.dialog["Incorrect extension"] = "Файлы данного типа нельзя загружать.";
    me.dialog["Incorrect size"] = "Файл слишком большой.";

    me.pager = {};
    me.pager.shown = "Показано";
    me.pager.from = "из";

    me.insertNew = "Добавить новую запись";
    me.confirmDelete = "Точно удалить данную запись?";
    me.confirmDeleteTemplate = "Вы действительно хотите удалить запись \"{0}\"?";
    me.confirmDeleteSelected = function (n) {
        return "Вы действительно хотите удалить " + n + " " + me.declineCount(n, "запись", "записи", "записей") + "?";
    };
    me.unableDelete = "У этой записи есть связи, ее нельзя удалить!";
    me.saveColumns = "Сохранить размер и положение колонок";
    me.toggleFilter = "Открыть/закрыть фильтр";
    me.applyFilter = "Применить фильтр";
    me.clearFilter = "Сбросить фильтр";
    me.viewRow = "Смотреть детальней";
    me.editRow = "Редактировать запись";
    me.removeRow = "Удалить запись";
    me.nothingSelected = "Ничего не выбрано!";
    me.selectColumnTitle = "Выбрать";
    me.show = "Показать";
    me.rowsPerPage = "строк на странице";
    me.allRows = "Все данные";
    me.sortAsc = "Сортировать А-Я";
    me.sortDesc = "Сортировать Я-А";
    me.sortRemove = "Убрать сортировку";

    me.bool = {};
    me.bool.yes = me.bool["true"] = "Да";
    me.bool.no = me.bool["false"] = "Нет";

    me.declineCount = function (val, one, two, five) {
        var t = parseInt((val % 100 > 20) ? val % 10 : val % 20);
        switch (t) {
            case 1: return one;
            case 2:
            case 3:
            case 4: return two;
            default: return five;
        }
    };
};

ejs.crud.getDefaultTextProvider = function (options) {
    return new ejs.crud.defaultTextProvider();
};

ejs.crud.getDefaultSettings = function () {
    return {
        selectPageSizes: [10, 20, 30, 50, 100, 500, -1]
    };
};