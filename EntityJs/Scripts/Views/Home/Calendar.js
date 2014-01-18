var koModel = {};

$(function () {
    var data = ejs.toJsObject(eval("(" + $("#scrData").html() + ")"));
    /*var model = new ejs.model({
        sets: [{
            name: "incidents",
            properties: ["name", "date", "typeID", "creatorID", "forUserID", "forRoleID", "comments"],
            belongs: [{ name: "incidentType", fkProperty: "typeID" }]
        }, {
            name: "incidentTypes",
            properties: ["name", "color", "backgroundColor", "importance"],
            hasMany: [{ name: "incidents", fkProperty: "typeID" }]
        }]
    });

    model.events.koCreated.attach(function (e) {
    });

    model.refreshData(data);
    model.toKo(koModel);*/

    koModel.calendar = new ejs.calendar({
        //koModel: koModel,
        //model: model,
        //set: model.incidents,
        data: data,
        //types: model.incidentTypes.load(),
        userID: 1,
        roleID: 1,
        container: "#divCalendar",
        crudClass: "ejsgrid beige",
        gridPadding: 10
    });

    ko.apply(koModel);
});