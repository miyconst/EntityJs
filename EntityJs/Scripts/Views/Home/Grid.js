var koModel = {};

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

    //initProducts(data, model);
    initCustomers(data, model);

    koModel.restore = function () {
        model.cancelChanges();
    };

    var setSize = function () {
        var h = $(window).height();
        $("div.scroll").css("height", h - 100);
    }
    $(window).resize(setSize);
    setSize();

    ko.apply(koModel);
});

function initProducts(data, model) {
    var s = data.userSettings.first("val=>val.name=='Home/Grid#tblProducts'");
    var cols = s ? eval("(" + s.value + ")") : null;

    koModel.crud = new ejs.crud({
        koModel: koModel,
        model: model,
        set: model.products,
        gridSettingsName: "Home/Grid#tblProducts",
        gridColumnsSettings: cols,
        gridPadding: 10,
        gridFilter: true,
        container: $("#divCrud"),
        create: true,
        edit: true,
        remove: true,
        autoSave: true,
        pageSize: 50,
        pure: true,
        columns:
        [
            {
                title: "Photo",
                name: "photoVirtualPath",
                orderBy: "photoID",
                showOnly: true,
                template: "<span data-bind='if: $data.photoVirtualPath'><img data-bind='attr: { src: $data.photoVirtualPath }' width='150' /></span>"
            },
            {
                title: "Big photo",
                name: "bigPhotoVirtualPath",
                orderBy: "bigPhotoID",
                showOnly: true,
                template: "<span data-bind='if: $data.bigPhotoVirtualPath'><img data-bind='attr: { src: $data.bigPhotoVirtualPath }' width='150' /></span>"
            },
            {
                title: "#",
                name: "id",
                orderBy: "id,name",
                showOnly: true,
                filter: true,
                filterType: "number"
            },
            {
                title: "Name",
                name: "name",
                orderBy: "category.Name+Name",
                type: "text",
                required: true,
                filter: true
            },
            {
                title: "Full name",
                name: "fullName",
                type: "text",
                required: true,
                filter: true
            },
            {
                title: "Price",
                name: "price",
                type: "number",
                required: true,
                filter: true,
                filterType: "string"
            },
            {
                title: "Category",
                name: "categoryID",
                orderBy: "category.Name",
                value: "category().name",
                type: "select",
                options: "categories",
                filter: true
            },
            {
                title: "photo",
                src: "photoVirtualPath",
                name: "photoID",
                value: "photoName",
                type: "file",
                editOnly: true,
                required: false,
                types: "jpg,jpeg,png"
            },
            {
                title: "Big photo",
                src: "bigPhotoVirtualPath",
                name: "bigPhotoID",
                value: "bigPhotoName",
                type: "file",
                editOnly: true
            }
        ]
    });

    if (!s) {
        koModel.crud.getPager().refresh();
    }
}

function initCustomers(data, model) {
    var s = data.userSettings.first("val=>val.name=='Home/Grid#tblCustomers'");
    var cols = s ? eval("(" + s.value + ")") : null;

    koModel.crud = new ejs.crud({
        koModel: koModel,
        model: model,
        set: model.customers,
        gridSettingsName: "Home/Grid#tblCustomers",
        gridColumnsSettings: cols,
        gridPadding: 10,
        gridFilter: true,
        container: $("#divCrud"),
        create: true,
        edit: true,
        remove: true,
        autoSave: true,
        pageSize: 50,
        pure: true,
        filterConditions: true,
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
        filters: [{ property: "timeFrom", type: "time", condition: ">=", value: "06:00" }]
    });

    if (!s) {
        koModel.crud.getPager().refresh();
    }
}