var koModel = {
    rows: ko.observableArray(new Array(50))
};

$(function () {
    var data = ejs.toJsObject(eval("(" + $("#scrData").html() + ")"));
    var model = new ejs.model({
        sets: [{
            name: "products",
            properties: ["name", "fullName", "price", "categoryID", "photoID", "photoName", "photoVirtualPath", "bigPhotoID", "bigPhotoName", "bigPhotoVirtualPath"],
            belongs: [{ name: "category" }]
        }, {
            name: "categories",
            properties: ["name"],
            hasMany: [{ name: "products" }]
        }, {
            name: "customers",
            properties: ["name", "surname", "phone", "email", "timeFrom", "timeTo"]
        }]
    });

    model.events.koCreated.attach(function (e) {
        if (e.className == "product") {
            e.ko.include("category");
        }
    });

    model.refreshData(data);
    model.toKo(koModel);

    var sn = "Home.Grid2";
    var s = ejs.grid2.getSettings(sn, data);

    /*koModel.grid2 = new ejs.grid2({
        settingsName: sn,
        container: "#divGrid",
        columns: s
    });

    koModel.grid2.events.applyFilter.attach(function (e) {
        console.log("Apply filter");
    });

    koModel.grid2.events.cancelFilter.attach(function (e) {
        console.log("Cancel filter");
    });*/

    initCustomers(data, model);

    ko.applyBindings(koModel);
});

function initCustomers(data, model) {
    var sn = "Home.Grid2";
    var s = ejs.grid2.getSettings(sn, data);

    koModel.crud = new ejs.crud({
        koModel: koModel,
        model: model,
        set: model.customers,
        gridSettingsName: sn,
        gridColumnsSettings: s,
        gridFilter: true,
        container: $("#divCrud"),
        create: true,
        edit: true,
        remove: true,
        autoSave: true,
        gridAtuoRefresh: true,
        selectPageSize: true,
        pageSize: 50,
        renderer: ejs.crud.grid2Renderer,
        columns:
        [
            {
                title: "Name",
                name: "name",
                required: true,
                filter: true
            },
            {
                title: "Surname",
                name: "surname",
                required: true,
                filter: true
            },
            {
                title: "Phone",
                name: "phone",
                required: true,
                filter: true
            },
            {
                title: "Email",
                name: "email",
                required: true,
                filter: true
            },
            {
                title: "Time from",
                name: "timeFrom",
                type: "time",
                defaultValue: "now",
                filter: true
            },
            {
                title: "Time to",
                name: "timeTo",
                type: "time",
                filter: true
            }
        ],
        filters: []
    });
}