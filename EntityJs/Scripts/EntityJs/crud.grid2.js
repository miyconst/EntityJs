/*-- File version 0.0.0.3 from 2016.02.20 --*/
ejs.crud.grid2Renderer = function (options) {
    var me = this;
    var uid = (new Date).getMilliseconds();
    var rootPath = "$root";
    var showColumns = [];
    var showFilterName;

    function ctor() {
        me.options = options;
        me.uid = uid;
        me.scriptID = "scrGrid2Template" + uid;

        container = $(options.container);
        showColumns = options.columns.where("val=>!val.editOnly");
        options.gridName = gridName = options.set.settings.name + "Grid";
        showFilterName = "showFilter" + options.set.settings.name;

        if (options.wrap) {
            rootPath = "$root." + options.names.crudName + ".wrapper";
        }

        options.wrapper[showFilterName] = function (name) {
            var div = options.container.find("div.ejsgrid-check-list." + name + ":first");

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
    };

    me.render = function () {
        var html = [];

        me.renderMenu(html);
        me.renderBody(html);
        me.renderFooter(html);
        me.renderScript(html);
        container.append(html.join(""));

        var crud = options.wrapper[options.names.crudName];
        var pager = options.wrapper[options.names.pagerName];
        var grid = options.wrapper[gridName] = new ejs.grid2({
            container: options.container,
            parentScroll: options.gridParentScroll,
            settingsName: options.gridSettingsName,
            columns: options.gridColumnsSettings
        });

        if (options.gridAtuoRefresh) {
            var o = grid.getOrderBy();

            if (o.any()) {
                pager.orderBy(grid.getOrderBy().select("val=>[val.col, val.order].join(' ')").join(","));
            } 

            pager.refresh();
        }

        grid.events.pageSizeChanged.attach(function (e) {
            pager.pageSize(e.pageSize);
        });

        grid.events.applyFilter.attach(function (e) {
            crud.applyFilter();
        });

        grid.events.cancelFilter.attach(function (e) {
            crud.cancelFilter();
        });

        grid.events.ordered.attach(function (e) {
            if (e.values.any()) {
                pager.orderBy(e.values.select("val=>[val.col, val.order].join(' ')").join(","));
            } else {
                pager.orderBy("id asc");
            }

            pager.refresh();
        });
    };

    me.renderMenu = function (html) {
        html.push("<div class='ejsgrid-menu'>", "<ul class='dropdown-menu'>");
        html.push("<li><a href='javascript:' class='ejsgrid-a-order' data-direction='asc'><i class='fa fa-sort-alpha-asc'></i> ", me.options.textProvider.sortAsc, "</a></li>");
        html.push("<li><a href='javascript:' class='ejsgrid-a-order' data-direction='desc'><i class='fa fa-sort-alpha-desc'></i> ", me.options.textProvider.sortDesc, "</a></li>");
        html.push("<li><a href='javascript:' class='ejsgrid-a-order' data-direction='remove'><i class='fa fa-remove'></i> ", me.options.textProvider.sortRemove, "</a></li>");
        html.push("<li><a href='javascript:' class='ejsgrid-a-filter'><i class='fa fa-filter'></i> ", me.options.textProvider.toggleFilter, "</a></li>");

        html.push("<li><div class='ejsgrid-menu-columns'>");
        showColumns.forEach(function (it, i) {
            html.push("<label class='checkbox' data-col='", it.name, "'><input type='checkbox' /><span>", it.title, "</span></label>");
        });
        html.push("</div></li>");

        html.push("<li><a href='javascript:' class='ejsgrid-a-save'><i class='fa fa-save'></i> ", me.options.textProvider.saveColumns, "</a></li>");
        html.push("</ul></div>");

        return html;
    };

    me.renderBody = function (html) {
        html.push("<div class='ejsgrid-scroll-vertical'><div></div></div>");
        html.push("<div class='ejsgrid-header'><table class='table table-bordered'><thead><tr>");

        html.push("<th data-col='Save' class='ejsgrid-th-actions'><span class='menu'><a href='javascript:'><i class='fa fa-cog'></i></a></span>");
        html.push("<span class='col'><a href='javascript:' class='ejsgrid-a-filter'><i class='fa fa-filter'></i></a> <a href='javascript:' class='ejsgrid-a-save'><i class='fa fa-save'></i><i class='fa fa-spinner fa-spin'></i></a></span></th>");

        showColumns.forEach(function (it, i) {
            var isOrder = it.order !== false && it.order !== "false" && it.orderable !== false;

            html.push("<th data-col='", it.name, "'");
            
            if (isOrder) {
                html.push(" class='ejsgrid-th-orderable'");
            }
            
            html.push(">");

            if (isOrder) {
                html.push("<span class='order'><i class='fa fa-caret-down'></i><i class='fa fa-caret-up'></i></span>");
            }

            html.push("<span class='menu'><a href='javascript:'><i class='fa fa-cog'></i></a></span><span class='col'>", it.title, "</span></th>");
        });

        html.push("</tr>");

        me.renderFilter(html);

        html.push("</thead></table></div>");
        html.push("<div class='ejsgrid-grid'><table class='table table-bordered ejsgrid-table'>");
        html.push("<tbody data-bind='template: { name: \"", me.scriptID, "\", foreach: ", rootPath, ".", me.options.set.settings.name, " }'></tbody></table></div>");
        html.push("<div class='ejsgrid-scroll-horizontal'><div></div></div>");
        

        return html;
    };

    me.renderFilter = function (html) {
        if (!options.gridFilter) {
            return;
        }

        html.push("<tr class='ejsgrid-tr-filter'><td data-col='Save'><div class='col'>");
        html.push("<a title='", options.textProvider.applyFilter, "' href='javascript:' class='ejsgrid-a-apply-filter'><i class='fa fa-check'></i></a> ");
        html.push("<a title='", options.textProvider.clearFilter, "' href='javascript:' class='ejsgrid-a-cancel-filter'><i class='fa fa-remove'></i></a></div></td>");

        showColumns.forEach(function (it, i) {
            var type = it.filterType || it.type;
            var name = it.name;

            html.push("<td data-col='", it.name, "'><div class='col'>");

            if (!it.filter) {
                html.push("</div></td>");
                return;
            }

            html.push("<form data-bind='event: { submit: function() { $root.", options.names.crudName, ".applyFilter(); return false; } }'>");

            switch (type) {
                case "select":
                    var ov = it.filterOptionsValue || it.optionsValue || "id";
                    var ot = it.filterOptionsText || it.optionsText || "name";
                    var op = it.filterOptionsParent || it.optionsParent;
                    var os = it.filterOptions || it.options;

                    html.push("<input class='ejsgrid-check-select form-control input-sm' readonly='readonly' type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".valueString(), click: function() { ", rootPath, ".", showFilterName, "(&quot;", name, "&quot;); }'/>");

                    if (op) {
                        html.push("<div class='ejsgrid-check-list ", name, "' data-bind=''><dl data-bind='foreach: $root.", os, ".where(\"val=>!val.", op, "()\")'>");
                        html.push("<dt data-bind='html: $data.", ot, "'></dt>");
                        html.push("<!-- ko foreach: $root.", os, ".where(\"val=>val.", op, "()==\" + $data.", ov, "()) -->");
                        html.push("<dd><label><input type='checkbox' data-bind='checked: ", rootPath, ".", options.names.filterName, ".", name, ".value, value: $data.", ov, "().toString() + \"|\" + $data.", ot, "()'/> <span data-bind='html: $data.", ot, "'></span></label></dd>");
                        html.push("<!-- /ko -->");
                        html.push("</div>");
                    } else {
                        html.push("<div class='ejsgrid-check-list ", name, "' data-bind='foreach: $root.", os, "'><label><input type='checkbox' data-bind='checked: ", rootPath, ".", options.names.filterName, ".", name, ".value, value: $data.", ov, "().toString() + \"|\" + $data.", ot, "()'/> <span data-bind='html: $data.", ot, "'></span></label></div>");
                    }
                    break;
                case "checkbox":
                    html.push("<select class='form-control input-sm' data-bind='options: [{ value: null, text: \" \" } , { value: \"on\", text: \"", options.textProvider.bool.yes, "\" }, { value: \"off\", text: \"", options.textProvider.bool.no, "\"}], optionsText: \"text\", optionsValue: \"value\", value: ", rootPath, ".", options.names.filterName, ".", name, ".value'></select>");
                    break;
                case "date":
                case "datepicker":
                    html.push("<input class='form-control input-sm' type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value' />");
                    break;
                case "time":
                    html.push("<input class='form-control input-sm' type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value' />");
                    break;
                default:
                    html.push("<input class='form-control input-sm' type='text' data-bind='value: ", rootPath, ".", options.names.filterName, ".", name, ".value, valueUpdate: \"afterkeydown\"");
                    if (it.filterAutocomplete) {
                        html.push(", simpleAutocomplete: ", rootPath, ".", options.names.fnAutocompleteName, "(\"", name, "\")");
                    }
                    html.push("' />");
                    break;
            }

            html.push("</div></form></div></td>");
        });

        html.push("</tr>");
    };

    me.renderFooter = function (html) {
        if (options.noFooter) {
            return "";
        }

        html.push("<div class='ejsgrid-footer'>");

        html.push("<ul class='pagination'><li><a href='javascript:' data-bind='click: ", rootPath, ".", options.names.pagerName, ".previous'><span>&laquo;</span></a></li>");
        html.push("<!-- ko foreach: ", rootPath, ".", options.names.pagerName, ".pages -->");
        html.push("<li><a href='javascript:' data-bind='html: text, click: go, css: { active: selected }'></a></li>");
        html.push("<!-- /ko -->");
        html.push("<li><a href='javascript:' data-bind='click: ", rootPath, ".", options.names.pagerName, ".next'><span>&raquo;</span></a></li></ul>");

        html.push("<div class='shown'>", options.textProvider.pager.shown, " <span data-bind='html: ", rootPath, ".", options.names.pagerName, ".shownFrom'></span><span>-</span>");
        html.push("<span data-bind='html: ", rootPath, ".", options.names.pagerName, ".shownTo'></span>");
        html.push(" <span>", options.textProvider.pager.from, " </span><span data-bind='html: ", rootPath, ".", options.names.pagerName, ".totalCount'></span>");

        if (options.selectPageSize) {
            html.push(" <span class='ejsgrid-page-size-separator'>|</span> <select class='ejsgrid-page-size form-control input-sm'>");

            var crudSettings = ejs.crud.getDefaultSettings();

            crudSettings.selectPageSizes.forEach(function (it, i) {
                var t;

                if (it > 0) {
                    t = it + " " + options.textProvider.rowsPerPage;
                } else {
                    t = options.textProvider.allRows;
                }

                html.push("<option value='", it, "'>", t, "</option>");
            });

            html.push("</select>");
        }

        html.push("</div></div>");
    };

    me.renderScript = function (html) {
        var css = [];

        html.push("<script type='text/html' id='", me.scriptID, "' class='ejsgrid-row-template'><tr data-bind='");

        if (options.edit) {
            html.push("event: { dblclick: ", rootPath, ".", options.names.fnEditName, " }");
        }

        if (options.trcss) {
            for (var i in options.trcss) {
                if (css.length) {
                    css.push(", ");
                }
                css.push(i, ": ", options.trcss[i]);
            }
        }

        html.push(", css: { ", css.join(""), " }'>");
        html.push("<td data-col='Save'><div class='col'><div class='btn-group' role='group'>");

        if (options.tdSaveTemplate) {
            var t = ejs.getTemplate(options.tdSaveTemplate);
            html.push(t);
        } else {
            if (options.selectMany) {
                html.push("<label class='checkbox btn btn-default btn-xs'><input type='checkbox' data-bind='value: $data.id().toString(), checked: ", rootPath, ".", options.names.selectManyName, "'/></label>");
            }

            if (options.edit) {
                html.push("<a class='btn btn-default btn-xs' href='javascript:' ");
                html.push("title='", options.disabled ? options.textProvider.viewRow : options.textProvider.editRow, "'");
                html.push("' data-bind='");

                if (options.editLink && typeof options.editLink != "function") {
                    html.push("attr: { href: \"", options.editLink, "\".replace(/[{]id[}]/gi, $data.id()) }");
                } else {
                    html.push("click: ", rootPath, ".", options.names.fnEditName);
                }

                html.push("'>");

                if (options.disabled) {
                    html.push("<i class='fa fa-eye'></i>");
                } else {
                    html.push("<i class='fa fa-pencil'></i>");
                }

                html.push("</a>");
            }

            if (options.remove) {
                html.push(" <a class='btn btn-default btn-xs' href='javascript:' title='", options.textProvider.removeRow, "' data-bind='click: ", rootPath, ".", options.names.fnRemoveName, "'><i class='fa fa-trash'></i></a>");
            }
        }

        html.push("</div></div></td>");

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

            html.push("<td data-col='", it.name, "'>");

            if (tdStyle) {
                html.push(" data-bind='css: {" + tdStyle + "}'");
            }

            html.push("<div class='col ", align, "'");

            if (dataBind) {
                html.push(" data-bind='", dataBind, "'");
            }

            html.push(">");

            if (it.showTemplate) {
                html.push(ejs.getTemplate(it.showTemplate));
            } else if (it.template) {
                html.push(ejs.getTemplate(it.template));
            } else {
                switch (it.type) {
                    case "checkbox":
                    case "bool":
                        html.push("<input type='checkbox' disabled='disabled' data-bind='checked: ", val, "'/>");
                        break;
                    default:
                        html.push("<span data-bind='html: ", val, "'></span>");
                        break;
                }
            }
            html.push("</div></td>");
        });
        
        html.push("</tr></script>");

        return html;
    };

    me.print = function (onlySelected) {
        onlySelected = onlySelected === true;
        var pager = options.wrapper[options.names.pagerName];
        var size = pager.settings.pageSize;
        var fn = function () {
            ejs.openWindow(function (w) {
                console.log("!!");
                $(w.document).find("title").html($("title").html());
                $(w.document).find("body").html(options.wrapper[gridName].print(onlySelected));
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