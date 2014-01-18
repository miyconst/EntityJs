var koModel = {
};

$(function () {
    koModel.scale = new ejs.scale({
        container: $("#divScale"),
        range: 2,
        start: "01.01.2012",
        end: "15.01.2012",
        type: "date",
        refreshOnDrag: true
    });

    koModel.scale.toKo();

    koModel.refresh10 = function () {
        koModel.scale.settings.end = "10.01.2012";
        koModel.scale.refresh();
    };

    koModel.refresh15 = function () {
        koModel.scale.settings.end = "15.01.2012";
        koModel.scale.refresh();
    };

    koModel.refresh20 = function () {
        koModel.scale.settings.end = "20.01.2012";
        koModel.scale.refresh();
    };

    ko.apply(koModel);
});