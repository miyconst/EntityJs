/*-- File version 0.0.0.13 from 2013.10.30 --*/
ko.obs = ko.observable;
ko.obsa = ko.observableArray;
ko.apply = ko.applyBindings;
ko.cmp = ko.computed;
ko.isObs = ko.isObservable;
ko.precision = ko.obs(2);
ko.likeobs = function (v) {
    var r = ko.obs("");
    r.text = ko.obs("");

    var fn = function (v) {
        if (!v) {
            r("");
            r.text("");
            return;
        }

        r(v.replace(/^[%]/gi, "").replace(/[%]$/gi, ""));
        r.text("%" + r() + "%");
    };

    r.text.subscribe(fn);
    r.subscribe(fn);
};

ko.dobs = function (v) {
    var r = ko.obs(v);

    r.text = ko.obs(ejs.toDecimalString(v));

    r.text.subscribe(function (v) {
        r.text(ejs.toDecimalString(v));
        r(ejs.parseFloat(v));
    });

    r.subscribe(function (v) {
        r.text(ejs.toDecimalString(v));
    });

    return r;
};

ko.toDobs = function (r) {
    if (r instanceof Array) {
        r.forEach(function (it, i) {
            ko.toDobs(it);
        });

        return;
    }

    if (arguments.length > 1) {
        for (var i = 0; i < arguments.length; i++) {
            ko.toDobs(arguments[i]);
        }

        return;
    }

    r.text = ko.cmp({
        read: function () {
            return ejs.toDs(r());
        },
        write: function (v) {
            r("");
            r(ejs.parseFloat(v));
        }
    });

    return r;
};

ko.toNobs = function (r) {
    if (r instanceof Array) {
        r.forEach(function (it, i) {
            ko.toNobs(it);
        });

        return;
    }

    if (arguments.length > 1) {
        for (var i = 0; i < arguments.length; i++) {
            ko.toNobs(arguments[i]);
        }

        return;
    }

    r.text = ko.cmp({
        read: function () {
            return ejs.toDs(r(), 0);
        },
        write: function (v) {
            r("");
            r(ejs.parseFloat(v));
        }
    });

    return r;
};

ko.datetimeComputable = function (koDate, koTime) {
    var cmp = ko.cmp({
        read: function () {
            return koDate() + " " + koTime();
        },
        write: function (newValue) {
            var values = newValue.split(" ");
            koDate(values[0]);
            koTime(values[1]);
        }
    });

    return cmp;
};

ko.dtcmp = ko.datetimeComputable;

ko.get = function (value) {
    if (typeof value == "function") {
        return value();
    } else {
        return value;
    }
};

ko.bindingHandlers.datepicker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        var options = null;

        if (ko.isObservable(value)) {
            value = value();
        }
        if (typeof value == "object") {
            options = value;
            value = ko.isObservable(options.value) ? options.value() : options.value;
        }

        element = $(element);
        if (allBindingsAccessor().attr && allBindingsAccessor().attr.id) {
            var id = allBindingsAccessor().attr.id;
            if (typeof id == "function")
                id = id();
            element.attr("id", id);
        }
        element.datepicker(options);

        if (!value) {
            element.datepicker("disable");
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        var options = null;

        if (ko.isObservable(value)) {
            value = value();
        }
        if (typeof value == "object") {
            options = value;
            value = ko.isObservable(options.value) ? options.value() : options.value;
        }

        element = $(element);

        if (!value) {
            element.datepicker("disable");
        } else {
            element.datepicker("enable");
        }
    }
};

ko.bindingHandlers.timepicker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        element.timepicker();
        if (!value) {
            element.timepicker("disable");
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        if (!value) {
            element.timepicker("disable");
        } else {
            element.timepicker("enable");
        }
    }
};

ko.bindingHandlers.datetimepicker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        element.datetimepicker({
            showSecond: true,
            timeFormat: 'HH:mm:ss',
            stepHour: 1,
            stepMinute: 1,
            stepSecond: 1
        });
        if (!value) {
            element.datetimepicker("disable");
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        if (!value) {
            element.datetimepicker("disable");
        } else {
            element.datetimepicker("enable");
        }
    }
};

ko.bindingHandlers.colorpicker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        element.colorPicker();
        element.val(value);
        element.change();
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        element.val(value);
        element.change();
    }
};

ko.bindingHandlers.validate = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        element = $(element);

        element.validate({
            errorClass: "invalid",
            errorPlacement: errorPlacement
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    }
};

ko.bindingHandlers.tabs = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        element = $(element);
        var onchange = allBindingsAccessor().onchange;
        var context = allBindingsAccessor().context;
        if (ko.isObs(onchange)) {
            onchange = onchange();
        }
        if (ko.isObs(context)) {
            context = context();
        }

        element.tabs({
            activate: function (event, ui) {
                ejs.cif(onchange, { index: element.tabs("option", "active"), event: event, ui: ui, context: context });
            }
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    }
};

ko.bindingHandlers.simpleAutocomplete = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        var valueBinding = allBindingsAccessor().value;
        var allowNew = allBindingsAccessor().allowNew;
        var onChange = function (event, ui) {
            if (typeof valueBinding == "function") {
                if (ui.item) {
                    valueBinding(ui.item.value);
                } else if (allowNew) {
                    valueBinding($(element).val());
                } else {
                    valueBinding("");
                }
            }
            $(element).change();
        };

        $(element).autocomplete({
            source: ko.utils.unwrapObservable(value),
            minLength: 0,
            select: onChange,
            change: onChange
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    }
};

ko.bindingHandlers.autocomplete = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = valueAccessor();
        var bindings = allBindingsAccessor();
        var context = bindings.context ? typeof bindings.context == "function" ? bindings.context() : bindings.context : null;
        context = context ? context : viewModel;

        var onselect = function (event, ui) {
            if (typeof bindings.onselect == "function" && bindings.onselect(event, ui) == false) {
                return;
            }
            if (typeof bindings.value == "function") {
                bindings.value(ui.item.value);
            }
            if (bindings.selected) {
                var selected = bindings.selected;
                if (ko.isObservable(selected)) {
                    selected = selected();
                }
                var source = selected.source ? selected.source : "id";
                var target = selected.target;
                var item = ui.item.source;
                if (typeof source == "function") {
                    source = source();
                }
                if (typeof target == "function") {
                    target = target();
                }
                source = item[source];
                if (typeof source == "function") {
                    source = source();
                }
                if (typeof context[target] == "function") {
                    context[target](source);
                } else {
                    context[target] = source;
                }
            }
        };

        element = $(element);
        element.autocomplete({
            source: Array.isArray(value) ? value : function (arg1, arg2) {
                value(arg1, arg2, context);
            },
            minLength: 0,
            position: { my: "left top", at: "left bottom", collision: "flip" },
            select: onselect,
            change: function (event, ui) {
                if (typeof bindings.onchange == "function" && bindings.onchange(event, ui, context) == false) {
                    return;
                }
                if (!ui.item) {// || !ui.item.source) {
                    var lastSource = element.data("source") || [];
                    var val = element.val().toLowerCase();
                    var first = lastSource.first("val=>val.value.toLowerCase()=='" + val + "'");
                    if (first) {
                        onselect(event, { item: first });
                        return;
                    }

                    if (bindings.selected) {
                        var selected = bindings.selected;
                        if (typeof selected == "function") {
                            selected = selected();
                        }
                        var target = selected.target;
                        if (typeof target == "function") {
                            target = target();
                        }
                        if (typeof context[target] == "function") {
                            context[target]("");
                        } else {
                            context[target] = "";
                        }
                    }
                    if (typeof bindings.value == "function") {
                        bindings.value("");
                    } else {
                        $(element).val("");
                    }
                } else {
                    onselect(event, ui);
                }
            },
            response: function (e, a) {
                element.data("source", a.content);
            }
        });

        element.bind("autocompleteopen.ko", function (event, ui) {
            element.data("state", 1);
        });

        element.bind("autocompleteclose.ko", function (event, ui) {
            element.data("state", 0);
        });

        if (!bindingContext.$root.openAutocomplete) {
            bindingContext.$root.openAutocomplete = function (data, e) {
                var a = $(e.target);
                if (a.attr("disabled")) {
                    return;
                }
                var div = a.parent();
                if (div.get(0).tagName.toLowerCase() == "a") {
                    div = div.parent();
                }
                var ac = div.find("input");
                if (ac.disabled() || ac.data("state") == 1) {
                    ac.autocomplete("close");
                } else {
                    ac.focus().trigger('keydown.autocomplete')
                    ac.autocomplete("search")
                }
            };
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var bindings = allBindingsAccessor();
        var context = bindings.context ? typeof bindings.context == "function" ? bindings.context() : bindings.context : null;
        context = context ? context : viewModel;

        var value = valueAccessor();
        element = $(element);
        element.autocomplete({
            source: Array.isArray(value) ? value : function (arg1, arg2) {
                value(arg1, arg2, context);
            }
        });
    }
};

ko.bindingHandlers.numeric = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        element.numeric();
        if (!value) {
            element.numeric("disable");
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            value = value();
        }
        element = $(element);
        if (!value) {
            element.numeric("disable");
        } else {
            element.numeric("enable");
        }
    }
};

ko.bindingHandlers.tooltip = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        element = $(element);
        var value = valueAccessor();
        var options = {};
        if (ko.isObs(value)) {
            value = value();
        }
        if (typeof value == "object") {
            options = value.options;
            value = value.value;
        }

        element.attr("title", value);
        element.tooltip(options);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        element = $(element);
        var value = valueAccessor();
        var options = {};
        if (ko.isObs(value)) {
            value = value();
        }
        if (typeof value == "object") {
            options = value.options;
            value = value.value;
        }

        element.attr("title", value);
        element.tooltip("destroy");

        element.tooltip(options);
    }
};

ko.bindingHandlers.rating = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var options = valueAccessor();
        var value = options.value;
        var index = value;

        delete options.value;

        element = $(element);

        if (ko.isObservable(value)) {
            index = index();

            value.subscribe(function (newValue) {
                element.val(newValue);
                element.rating("refresh");
            });
        }

        options.change = function (r, v) {
            if (ko.isObservable(value)) {
                value(v);
            }
        };

        element.val(index);
        element.rating(options);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    }
};

ko.bindingHandlers.fadeVisible = {
    init: function (element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function (element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
    }
};

ko.bindingHandlers.hideOnClick = {
    init: function (element, valueAccessor) {
        $(element).hideOnClick();
    },
    update: function (element, valueAccessor) {
    }
};