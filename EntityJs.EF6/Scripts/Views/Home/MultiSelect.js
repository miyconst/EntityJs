var koModel = {
};

$(function () {
    koModel.selected = ko.obsa([]);
    koModel.options = ko.obsa([]);

    for (var i = 0; i < 10; i++) {
        koModel.options.push({ name: "Option " + i, value: i });
    }

    ko.apply(koModel);
});