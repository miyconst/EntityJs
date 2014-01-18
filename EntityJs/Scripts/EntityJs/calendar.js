/*-- File version 0.0.0.3 from 2012.12.10 --*/
ejs.calendar = function (params) {
    var me = this;
    var uid = ejs.getUniqueNumber();
    var value = (new Date).toSds();
    var crudReady = false;
    var settings = {
        container: null,
        gridContainer: null,
        types: [],
        typesDictionary: {},
        set: null,
        model: null,
        incidentModel: null,
        koModel: null,
        containerClass: "",
        gridContainerID: "",
        styleID: "",
        userID: -1,
        roleID: -1,
        crudClass: "ejsgrid",
        gridPadding: 20,
        dialodWidth: 900
    };

    me.events = {
        dialogOpening: ejs.createEvent(),
        dialogClosing: ejs.createEvent()
    };

    var ctor = function () {
        $.extend(settings, params);
        me.settings = settings;

        settings.containerClass = getContainerClass();
        settings.gridContainerID = getGridContainerID();
        settings.styleID = getStyleID();

        makeModel();
        fillDicitionaries();
        renderStyle();
        render();
        onChangeMonthYear();
    };

    me.closeDialog = function () {
        me.events.dialogClosing.raise({ dialog: me.settings.gridContainer, value: value });
        me.settings.gridContainer.dialog("close");
    };

    me.openDialog = function () {
        me.events.dialogOpening.raise({ dialog: me.settings.gridContainer, value: value });
        me.settings.gridContainer.dialog("option", "title", ejs.gs("Event for the date", "calendar") + ": " + value);
        me.settings.gridContainer.dialog("open");
    };

    me.isCrudReady = function () {
        return crudReady;
    };

    me.value = function () {
        if (arguments.length > 0) {
            value = arguments[0];
            $(me.settings.container).datepicker("setDate", value);
            onSelect(value, $(".selector").datepicker("widget"));
        }

        return value;
    };

    me.getCrud = function () {
        return me.settings.koModel.crud;
    };

    function renderCrud() {
        if (crudReady) {
            return;
        }

        crudReady = true;

        if (!me.settings.gridContainer) {
            var gridContainer = $("<div title='" + ejs.gs("Event for the date", "calendar") + "' class='" + me.settings.crudClass + "' id='" + me.settings.gridContainerID + "'></div>");
            $("body").append(gridContainer);
            me.settings.gridContainer = gridContainer;

            me.settings.gridContainer.dialog({
                autoOpen: false,
                modal: true,
                width: me.settings.dialodWidth,
                height: $(window).height() - 100,
                buttons: [{
                    text: ejs.gs("Close", "calendar"),
                    click: function () {
                        me.closeDialog();
                    }
                }]
            });
        }

        var sn = window.location.pathname + "#ejsCalendarIncidentsCrud";
        var s = me.settings.data.userSettings.first("val=>val.name=='" + sn + "'");
        var cols = s ? eval("(" + s.value + ")") : null;

        me.settings.koModel.crud = new ejs.crud({
            koModel: me.settings.koModel,
            model: me.settings.incidentModel,
            set: me.settings.incidentModel.incidents,
            gridSettingsName: sn,
            gridColumnsSettings: cols,
            container: me.settings.gridContainer,
            create: true,
            edit: true,
            remove: true,
            autoSave: true,
            pageSize: 20,
            gridPadding: me.settings.gridPadding,
            pure: true,
            columns:
            [
                {
                    title: ejs.gs("Name", "calendar"),
                    name: "name",
                    required: true
                },
                {
                    title: ejs.gs("Type", "calendar"),
                    name: "typeID",
                    showTemplate: "<div data-bind='html: $data.incidentType().name, attr: { \"class\": $root.getTypeClass($data.incidentType()) }'></div>",
                    value: "incidentType().name",
                    orderBy: "incidentType.Name",
                    type: "select",
                    options: "incidentTypes",
                    required: true
                },
                {
                    title: ejs.gs("Date", "calendar"),
                    name: "date",
                    type: "date",
                    required: true
                },
                {
                    title: ejs.gs("Comments", "calendar"),
                    name: "comments",
                    type: "textarea",
                    editOnly: true
                },
                {
                    title: ejs.gs("Visible", "calendar"),
                    name: "visible",
                    type: "checkbox"
                },
                {
                    title: ejs.gs("For role", "calendar"),
                    name: "forRoleID",
                    value: "forRole().name",
                    orderBy: "role.Name",
                    type: "select",
                    options: "roles",
                    optionsText: "name",
                    optionsCaption: " "
                },
                {
                    title: ejs.gs("For user", "calendar"),
                    name: "forUserID",
                    value: "forUser().name",
                    orderBy: "forUser.Surname,forUser.Name,forUser.Patronymic",
                    type: "select",
                    options: "$root.incident() ? ($root.incident().forRoleID() ? $root.users().where(\"val=>val.roleID()==\" + $root.incident().forRoleID()) : $root.users()) : []",
                    optionsText: "fullName",
                    optionsCaption: " "
                }
            ],
            filters: [{
                property: "date",
                value: function () { return value },
                condition: "=",
                type: "date"
            }, {
                property: "group",
                type: "group",
                condition: "=",
                innerOperand: "or",
                filters: [{
                    property: "creatorID",
                    value: me.settings.userID,
                    type: "number",
                    operand: "or"
                }, {
                    property: "group",
                    type: "group",
                    value: me.settings.userID,
                    filters: [{
                        property: "forUserID",
                        value: me.settings.userID,
                        type: "number",
                        operand: "or"
                    }, {
                        property: "forUserID",
                        value: me.settings.userID,
                        type: "number",
                        condition: "isNull",
                        operand: "or"
                    }]
                }, {
                    property: "group",
                    type: "group",
                    value: me.settings.roleID,
                    filters: [{
                        property: "forRoleID",
                        value: me.settings.roleID,
                        type: "number",
                        operand: "or"
                    }, {
                        property: "forRoleID",
                        value: me.settings.roleID,
                        type: "number",
                        condition: "isNull",
                        operand: "or"
                    }]
                }]
            }]
        });

        me.settings.koModel.crud.events.creating.attach(function (e) {
            e.row.creatorID(me.settings.userID);
            e.row.date(value);
            e.row.visible(true);
        });

        me.settings.koModel.crud.events.removed.attach(function (e) {
            var entity = me.settings.model.incidents.getByID(e.row.id());
            if (entity) {
                entity.detach();
                entity.dispose();
            }
        });

        me.settings.koModel.crud.events.saved.attach(function () {
            var entities = me.settings.incidentModel.incidents.load().select("val=>ejs.toJsObject(val.eImport())");
            me.settings.model.incidents.addData(entities);
            refreshDatepicker();
        });

        ko.apply(me.settings.koModel, me.settings.gridContainer.get(0));
        ko.apply(me.settings.koModel, me.settings.koModel.crud.getEditor().getDialog().get(0));
    }

    function makeModel() {
        if (!me.settings.model) {
            me.settings.model = new ejs.model({
                sets: [{
                    name: "incidents",
                    properties: ["name", "date", "typeID", "creatorID", "forUserID", "forRoleID", "comments", "visible"],
                    belongs: [{ name: "incidentType", fkProperty: "typeID" }]
                }, {
                    name: "incidentTypes",
                    properties: ["name", "color", "backgroundColor", "importance"],
                    hasMany: [{ name: "incidents", fkProperty: "typeID" }]
                }]
            });

            me.settings.model.refreshData(me.settings.data.incidentTypes);
            me.settings.types = me.settings.model.incidentTypes.load();
        }

        if (!me.settings.incidentModel) {
            me.settings.incidentModel = new ejs.model({
                sets: [{
                        name: "incidents",
                        properties: ["name", "date", "typeID", "creatorID", "forUserID", "forRoleID", "comments", "visible"],
                        belongs: [{ name: "incidentType", fkProperty: "typeID" }, { name: "forUser", setName: "users", fkProperty: "forUserID" }, { name: "forRole", setName: "roles", fkProperty: "forRoleID" }]
                    },
                    {
                        name: "incidentTypes",
                        properties: ["name", "color", "backgroundColor", "importance"],
                        hasMany: [{ name: "incidents", fkProperty: "typeID" }]
                    },
                    {
                        name: "users",
                        properties: ["fullName", "roleID"]
                    },
                    {
                        name: "roles",
                        properties: ["name"]
                    }
                ]
            });
        }

        if (!me.settings.koModel) {
            me.settings.koModel = {};
        }

        me.settings.koModel.getTypeClass = getTypeClass;
        me.settings.incidentModel.events.koCreated.attach(function (e) {
            if (e.className == "incident") {
                e.ko.include(["incidentType", "forUser", "forRole"]);
            }
        });
        me.settings.model.refreshData(me.settings.data);
        me.settings.incidentModel.refreshData(me.settings.data);
        me.settings.incidentModel.toKo(me.settings.koModel);
        me.settings.set = me.settings.model.incidents;
    }

    function render() {
        var container = $(me.settings.container);

        container.addClass(me.settings.containerClass);
        container.datepicker({
            beforeShowDay: beforeShowDay,
            onSelect: onSelect,
            onChangeMonthYear: onChangeMonthYear
        });
    }

    function fillDicitionaries() {
        me.settings.types.forEach(function (it, i) {
            me.settings.typesDictionary[it.id()] = it;
        });
    }

    function renderStyle() {
        var id = me.settings.styleID;
        var style = ["<style type='text/css' id='", id, "'>"];

        me.settings.types.forEach(function (it, i) {
            style.push(".", me.settings.containerClass, " .", getTypeClass(it), " a { background-image:none; background-color: ", it.backgroundColor(), "; color: ", it.color(), ";}\n");
            style.push("#", me.settings.gridContainerID, " td div.", getTypeClass(it), " { background-image:none; background-color: ", it.backgroundColor(), "; color: ", it.color(), ";}\n");
        });

        style.push("</style>");

        var old = $("#" + id);
        old.remove();
        $("head").append(style.join(""));
    }

    function getGridContainerID() {
        return "ejsCalendarGridContainer" + uid;
    }

    function getContainerClass() {
        return "ejsCalendar" + uid;
    }

    function getStyleID() {
        return "stlEjsCalendar" + uid;
    }

    function getTypeClass(t) {
        if (!t || !t.id) {
            return "ejsCalendarDay";
        }
        return "ejsCalendarDay" + t.id();
    }

    function beforeShowDay(date) {
        var events = me.settings.set.load().where(function (it, i) {
            var d = parseDate(it.date());
            return d.getFullYear() == date.getFullYear() && d.getMonth() == date.getMonth() && d.getDate() == date.getDate() && it.visible();
        });
        var event = events.first();

        if (!event) {
            return [true];
        }

        var t = me.settings.typesDictionary[event.typeID()];
        var result = [true, getTypeClass(t), event.name()];

        return result;
    }

    function onSelect(date, ui) {
        value = date;

        if (!crudReady) {
            renderCrud();
        }

        me.settings.koModel.crud.getPager().refresh();
        me.openDialog();
    }

    function onChangeMonthYear(year, month, ui) {
        var dateFrom = new Date();
        var dateTo = new Date();

        if (year && month) {
            month--;
            dateFrom.setFullYear(year);
            dateTo.setFullYear(year);
            dateFrom.setMonth(month);
            dateTo.setMonth(month);
        }

        dateFrom.setDate(1);
        dateTo.setDate(1);
        dateTo.setMonth(dateTo.getMonth() + 1);
        dateTo.setDate(0);
        dateFrom = dateFrom.toSds();
        dateTo = dateTo.toSds();

        var w = ejs.cwp("group", me.settings.userID, "=", "group", "and", "",
        [
            ejs.cwp("creatorID", me.settings.userID, "=", "number", "or"),
            ejs.cwp("group", me.settings.userID, "=", "group", "or", "",
            [
                ejs.cwp("group", me.settings.userID, "=", "group", "and", "",
                [
                    ejs.cwp("forUserID", me.settings.userID, "=", "number", "or"),
                    ejs.cwp("forUserID", me.settings.userID, "isNull", "number", "or")
                ]),
                ejs.cwp("group", me.settings.roleID, "=", "group", "and", "",
                [
                    ejs.cwp("forRoleID", me.settings.roleID, "=", "number", "or"),
                    ejs.cwp("forRoleID", me.settings.roleID, "isNull", "number", "or")
                ])
            ])
        ]);

        me.settings.set.refreshData([]);
        me.settings.set.select(function () {
            refreshDatepicker();
        },
        [ejs.cwp("visible", true, "=", "bool"), ejs.cwp("date", dateFrom, ">=", "date"), ejs.cwp("date", dateTo, "<=", "date"), w],
        [ejs.cop("date")]);
    }

    function refreshDatepicker() {
        $(me.settings.container).datepicker("refresh");
    }

    ctor();
};

ejs.calendar.localization = function () {
    ejs.strings.calendar = {};
    ejs.strings.calendar["Name"] = "Название";
    ejs.strings.calendar["Type"] = "Тип";
    ejs.strings.calendar["Date"] = "Дата";
    ejs.strings.calendar["Comments"] = "Дополнительно";
    ejs.strings.calendar["Visible"] = "Отображать";
    ejs.strings.calendar["For role"] = "Для роли";
    ejs.strings.calendar["For user"] = "Для пользователя";
    ejs.strings.calendar["Event for the date"] = "События на дату";
    ejs.strings.calendar["Close"] = "Закрыть";
};
ejs.calendar.localization();

