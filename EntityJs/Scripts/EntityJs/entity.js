/*-- File version 0.0.0.9 from 2017.10.21 --*/
ejs.entity = function (params) {
    var me = this;
    me.inParse = false;

    var settings = {
        properties: [],
        hasMany: [],
        belongs: []
    };

    var ctor = function () {
        $.extend(settings, params);

        if (!settings.properties.contains("id")) {
            settings.properties.splice(0, 0, "id");
        }

        settings.properties.forEach(function (it, i) {
            me[it] = ejs.createProperty("", it);

            me[it].attach(function (e) {
                e.inParse = me.inParse;
                e.property = it;
                e.entity = me;
                me.hasChanges = true;
                me.events.change.raise(e);
            });
        });

        settings.belongs.forEach(function (it, i) {
            me[it.name] = createBelongsTo(it.setName, it.fkProperty);
        });

        settings.hasMany.forEach(function (it, i) {
            me[it.name] = createHasMany(it.setName, it.fkProperty);
        });

        me.id.attach(function (e) {
            var newID = e.newValue;

            if (e.newValue == e.oldValue || !e.oldValue) {
                return;
            }

            settings.hasMany.forEach(function (it, i) {
                settings.model[it.setName].load().where(function (child, i) {
                    return child[it.fkProperty]() == e.oldValue;
                }).forEach(function (childIt) {
                    var oldID = childIt[it.fkProperty]();

                    if (oldID == newID) {
                        return;
                    }

                    childIt[it.fkProperty](newID);
                });
            });
        });
    };

    me.events = {
        remove: ejs.createEvent(),
        renew: ejs.createEvent(),
        change: ejs.createEvent(),
        commit: ejs.createEvent(),
        detach: ejs.createEvent(),
        reattach: ejs.createEvent(),
        koCreated: ejs.createEvent(),
        dispose: ejs.createEvent()
    };
    me.hasChanges = false;
    me.removed = false;
    me.attached = false;
    me.disposed = false;
    me.settings = settings;

    me.parse = function (values) {
        me.inParse = true;

        if (values instanceof Array) {
            values.forEach(function (it, i) {
                var key = ejs.toJsName(it.key);
                me[key](it.value);
                me[key].originalValue = it.value;
            });
        } else if (values.entity) {
            settings.properties.forEach(function (it, i) {
                me[it](values.entity[it]);
                me[it].originalValue = values.entity[it];
            });
        }
        else {
            settings.properties.forEach(function (it, i) {
                var val = values[it];
                if (ejs.isEmpty(val)) {
                    val = "";
                }
                me[it](val);
                me[it].originalValue = val;
            });
        }

        me.hasChanges = false;
        me.removed = false;
        me.inParse = false;
    };

    me.serialize = function () {
        var result = [];

        settings.properties.forEach(function (it, i) {
            if (!me[it].hasChanges() && it != "id" && me.id() > 0) {
                return;
            }

            result.push({
                Key: ejs.toServerName(it),
                Value: me[it]()
            });
        });

        return result;
    };

    me.deserialize = function (values) {
        values.forEach(function (it, i) {
            me[ejs.toJsName(it.Key)](it.Value);
        });
    };

    me.eImport = function () {
        var result = {};

        settings.properties.forEach(function (it, i) {
            result[ejs.toServerName(it)] = me[it]();
        });

        return result;
    };

    me.eExport = function (entity) {
        for (var i in entity) {
            var name = ejs.toJsName(i);
            me[name](entity[i]);
        }
    };

    me.getValues = function () {
        var result = {};

        settings.properties.forEach(function (it, i) {
            if (it == "id") {
                return;
            }
            result[it] = me[it]();
        });

        return result;
    };

    me.setValues = function (entity) {
        for (var i in entity) {
            me[i](entity[i]);
        }
    };

    me.copy = function (to) {
        to = to || {};
        if (to.inParse) {
            to.inParse = true;
        }
        settings.properties.forEach(function (it, i) {
            if (it != "id") {
                if (typeof to[it] == "function") {
                    to[it](me[it]());
                } else {
                    to[it] = me[it]();
                }
            }
        });
        if (to.inParse) {
            to.inParse = false;
        }
        return to;
    };

    me.toKo = function () {
        if (me.ko) {
            return me.ko;
        }

        var result = {};
        var fromKo = false;
        var fromEntity = false;

        me.koDisposed = ko.obs(false);

        settings.properties.forEach(function (it, i) {
            result[it] = ko.observable(me[it]());
            joinWithKo(me[it], result[it]);
        });

        result.entity = me;
        result.include = function (v) {
            if (!(v instanceof Array)) {
                v = [v];
            }

            v.forEach(function (it, i) {
                var belong = me.settings.belongs.first("val=>val.name=='" + it + "'");

                if (belong) {
                    result[belong.name] = ko.computed(function () {
                        if (me.koDisposed()) {
                            return "";
                        }

                        var id = me.toKo()[belong.fkProperty]();

                        if (!id) {
                            return "";
                        }

                        var result = me.settings.model[belong.setName].toKo()().first("val=>val.id()==" + id);

                        if (!result) {
                            return null;
                        }

                        return result;
                    });
                }

                var has = me.settings.hasMany.first("val=>val.name=='" + it + "'");

                if (has) {
                    result[has.name] = ko.computed(function () {
                        if (me.koDisposed()) {
                            return "";
                        }

                        var id = me.toKo().id();

                        if (!id) {
                            return [];
                        }

                        var result = me.settings.model[has.setName].toKo()().where("val=>val." + has.fkProperty + "()==" + id);

                        return result;
                    });
                }
            });
        };
        result.toString = me.toString;

        me.ko = result;
        me.events.koCreated.raise({ entity: me, ko: result });

        return result;
    };

    me.fromKo = function (koObservable) {
        var data = {};

        settings.properties.forEach(function (it, i) {
            data[it] = koObservable[it]();
            joinWithKo(me[it], koObservable[it]);
        });

        me.parse(data);
        me.ko = koObservable;
    };

    me.remove = function () {
        me.events.remove.raise({ entity: me });
        me.removed = true;
    };

    me.renew = function () {
        me.removed = false;
        me.events.renew.raise({ entity: me });
    };

    me.backup = function () {
        me.oldValues = {};

        settings.properties.forEach(function (it, i) {
            me.oldValues[it] = me[it]();
        });
    };

    me.restore = function () {
        if (!me.oldValues) {
            return;
        }

        settings.properties.forEach(function (it, i) {
            me[it](me.oldValues[it], true);
        });

        me.oldValues = null;
        me.hasChanges = false;
    };

    me.commit = function () {
        var hasChanges = false;
        if (me.oldValues) {
            settings.properties.forEach(function (it, i) {
                if (me[it]() != me.oldValues[it]) {
                    hasChanges = true;
                    return { stop: true };
                }
            });
        }
        me.events.commit.raise({ entity: me, hasChanges: hasChanges });
        me.oldValues = null;
    };

    me.isLocked = function () {
        return me.oldValues ? true : false;
    };

    me.detach = function () {
        if (!me.attached) {
            return;
        }
        me.attached = false;
        me.events.detach.raise({ entity: me });
    };

    me.reattach = function () {
        if (me.attached) {
            return;
        }
        me.attached = true;
        me.events.reattach.raise({ entity: me });
    };

    me.toString = function (fields) {
        return ejs.ets(me, fields);
    };

    me.dispose = function () {
        var e = { cancel: false, entity: me };

        me.events.dispose.raise(e);

        if (e.cancel) {
            return;
        }

        for (var i in me.events) {
            me.events[i].clear();
        }

        if (me.ko) {
            delete me.ko.entity;

            var koProperties = [];

            for (var it in me.ko) {
                koProperties.push(it);
            }

            koProperties.forEach(function (it, i) {
                if (!me.ko[it]) {
                    return;
                }

                if (me.ko[it].dispose) {
                    me.ko[it].dispose();
                }

                if (me.ko[it].subscriber) {
                    me.ko[it].subscriber.dispose();
                }

                delete me.ko[it];
            });

            delete me.ko;
            
            me.koDisposed(true);
        }

        settings.properties.forEach(function (it, i) {
            if (!me[it].change) {
                return;
            }
            me[it].change.clear();
        });

        me.disposed = true;
    };

    function joinWithKo(property, koProperty) {
        var fromKo = false;
        var fromEntity = false;

        koProperty.subscriber = koProperty.subscribe(function (newValue) {
            if (fromEntity) {
                fromEntity = false;
                return newValue;
            }

            fromKo = true;
            property(newValue);
        });

        property.change.attach(function (e) {
            if (e.newValue === e.oldValue) {
                return;
            }

            if (fromKo) {
                fromKo = false;
                return;
            }

            fromEntity = true;
            koProperty(e.newValue);
        });
    }

    function createHasMany(setName, fkProperty) {
        return function (callback) {
            return settings.model[setName].getChildren(me.id(), fkProperty, callback);
        };
    }

    function createBelongsTo(setName, fkProperty) {
        return function (newValue, callback) {
            var id = me[fkProperty]();

            if (ejs.isEmpty(id)) {
                return null;
            }

            if (typeof callback == "undefined") {
                return settings.model[setName].getByID(id);
            }

            if (typeof newValue != "undefined") {
                me[fkProperty](newValue.id());
            }

            return settings.model[setName].getByID(id, callback);
        };
    }

    ctor();
};