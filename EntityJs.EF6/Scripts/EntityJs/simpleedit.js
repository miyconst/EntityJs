var koModel = {
};

$(function () {
    var data = ejs.toJsObject(eval("(" + $("#scrData").html() + ")"));
    var entitySetName = ejs.toJsName(data.entitySetName ? data.entitySetName : ejs.toPlural(data.entityName));
    var model = new ejs.model({
        sets: [{
            name: entitySetName,
            className: ejs.toJsName(data.entityName),
            properties: data.columns.select("val=>ejs.toJsName(val.name)")
        }]
    });

    model.events.koCreated.attach(function (e) {
    });

    model.refreshData(data);
    model.toKo(koModel);
    koModel.data = data;

    var sn = data.settingsName;
    var s = data.userSettings;

    try {
        s = eval("(" + s + ")");
    }
    catch (ex) {
        s = null;
    }

    koModel[entitySetName + "Crud"] = new ejs.crud({
        koModel: koModel,
        model: model,
        set: model[entitySetName],
        gridSettingsName: sn,
        gridColumnsSettings: s,
        gridPadding: 10,
        gridFilter: true,
        gridAutoRefresh: true,
        selectPageSize: true,
        selectMany: true,
        container: $("#divCrud"),
        gridParentScroll: "#divGrid",
        create: true,
        edit: true,
        remove: true,
        autoSave: true,
        pageSize: 20,
        pure: true,
        columns: data.columns.select(function (it, i) {
            it.name = ejs.toJsName(it.name);
            it.showOnly = it.name == "id";
            return it;
        })
    });

    ko.apply(koModel);
});