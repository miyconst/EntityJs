/*-- File version 0.0.0.12 from 2013.02.11 --*/
ejs.set = function (params) {
    var me = this;
    var collection = [];
    var removed = [];
    var cache = {};
    var settings = {
        data: [],
        isLoaded: false,
        name: "",
        className: "",
        mode: ""
    };

    var ctor = function () {
        $.extend(settings, params);
        me.settings = settings;
        me.addData(settings.data);

        settings.model.events.updated.attach(function (e) {
            if (removed.any()) {
                var deleted = e.changes.deleted.where("val=>val.settings.setName=='" + settings.name + "'");
                deleted.forEach(function (it) {
                    removed.removeEl(it);
                });
            }
        });
    };

    me.events = {
        change: ejs.createEvent()
    };

    me.setData = function (data) {
        console.warn("Method setData is deprecated and will be removed soon, use addData or refreshData instead.");
        me.refreshData(data);
    };

    me.refreshData = function (data, doDetach) {
        var oldCollection = collection.copy();

        collection.splice(0, collection.length);
        me.refreshKo();

        oldCollection.forEach(function (it, i) {
            if (doDetach) {
                it.detach();
            } else {
                it.dispose();
            }
        });

        if (data.forEach) {
        } else if (data.collections) {
            data = data.collections[settings.name];
        } else {
            throw "result is not in a correct format";
        }

        data.forEach(function (it, i) {
            var entity = createEntity();
            entity.parse(it);
            entity.attached = true;
            collection.push(entity);
        });

        me.refreshKo();
    };

    me.refreshKo = function () {
        if (!me.ko) {
            return;
        }

        me.toKo()(collection.select("val=>val.toKo()"));
    };

    me.addData = function (data) {
        var newEntities = [];
        var oldEntities = [];

        data.forEach(function (it, i) {
            if (collection.findIndex("val=>val.id()==" + it.id) < 0) {
                var entity = createEntity();
                entity.parse(it);
                entity.attached = true;
                collection.push(entity);
                newEntities.push(entity);
            } else {
                var entity = me.getByID(it.id);
                entity.parse(it);
                oldEntities.push(entity);
            }
        });

        if (me.ko) {
            me.ko(collection.select("val=>val.toKo()"));
        }

        var allEntities = [].concat(newEntities, oldEntities);
        var result = {
            allEntities: allEntities,
            oldEntities: oldEntities,
            newEntities: newEntities
        };

        return result;
    };

    me.load = function (callback, wheres, orders, take, skip) {
        if (typeof callback != "function") {
            return collection;
        }

        var options = createSelectOptions(wheres, orders, take, skip);

        settings.model.select(options, function (result) {
            collection.splice(0, collection.length);
            settings.isLoaded = true;
            me.refreshData(result.collections[settings.name]);
            callback(collection, result);
        });
    };

    me.select = function (callback, wheres, orders, take, skip, whereMethod, orderMethod, includes, addData) {
        var options = createSelectOptions(wheres, orders, take, skip, includes, whereMethod, orderMethod);

        settings.model.select(options, function (result) {
            var selected;
            if (result.rows) {
                selected = addData !== false ? me.addData(result.rows) : result.rows;
            } else if (result.collections) {
                selected = addData !== false ? me.addData(result.collections[settings.name]) : result.collections[settings.name];
                if (includes && addData !== false) {
                    settings.model.addData(result.collections);
                }
            } else {
                throw "result is not in correct format";
            }

            if (typeof callback == "function") {
                callback(collection, selected);
            }
        });
    };

    me.getByID = function (id, callback, includes) {
        var entity = collection.first("val=>val.id()==" + id);
        var where = ejs.createWhereParameter("ID", id, "=", "number");
        var sp = ejs.cso(me, [where], "", "", "", [].concat(includes));

        if (typeof callback != "function") {
            return entity;
        }

        if (entity) {
            callback(entity);
        }

        settings.model.select(sp, function (result) {
            //entity = createEntity();
            if (result.rows) {
                selected = me.addData(result.rows);
            } else if (result.collections) {
                selected = me.addData(result.collections[settings.name]);
                me.settings.model.addData(result.collections);
            } else {
                throw "result is not in a correct format";
            }

            entity = selected.allEntities.first();
            callback(entity);
        });
    };

    me.getChildren = function (parentID, fkProperty, callback, wheres) {
        var where = ejs.createWhereParameter(fkProperty, parentID, "=", "number");
        if (!wheres || !wheres.push) {
            wheres = [];
        }
        wheres.push(where);
        if (typeof callback == "function") {
            me.select(callback, wheres);
        } else {
            return collection.where("val=>val." + fkProperty + "()==" + parentID);
        }
    };

    me.getRemoved = function () {
        return removed;
    };

    me.create = function () {
        var entity = createEntity();
        entity.id(settings.model.getMinID());
        collection.push(entity);

        me.events.change.raise({ entity: entity, action: "insert" });

        return entity;
    };

    me.insert = function (entity) {
        entity.attached = true;

        if (!entity.id()) {
            entity.id(settings.model.getMinID());
        }

        collection.push(entity);

        entity.events.remove.attach(function (e) {
            me.remove(e.entity);
        });

        me.events.change.raise({ entity: entity, action: "insert" });

        return entity;
    };

    me.remove = function (entity) {
        var index = collection.findIndex(function (it, i) {
            return it.id() == entity.id();
        });
        if (index < 0) {
            return;
        }
        removed.push(entity);
        collection.splice(index, 1);

        me.events.change.raise({ entity: entity, action: "remove" });
    };

    me.renew = function (entity) {
        removed.removeEl(entity);

        collection.push(entity);

        if (me.ko) {
            me.ko.push(entity.toKo());
        }
    };

    me.toKo = function () {
        if (me.ko) {
            return me.ko;
        }

        me.ko = ko.observableArray(collection.select("val=>val.toKo()"));

        if (me.settings.properties.contains("deleted")) {
            me.ko.getActive = function (id) {
                if (!id) {
                    id = 0;
                }
                if (me.ko.getActive[id]) {
                    return me.ko.getActive[id];
                }
                var cmp = ko.cmp(function () {
                    var result = me.ko().where(function (it, i) {
                        return !it.deleted() || it.id() == id;
                    });
                    if (me.settings.properties.contains("orderNumber")) {
                        result = result.orderBy("val=>val.orderNumber()");
                    }
                    return result;
                });
                me.ko.getActive[id] = cmp;
                return cmp;
            };
        }

        me.events.change.attach(function (e) {
            if (e.action == "remove" || e.action == "detach") {
                var index = me.ko().findIndex(function (it) {
                    return it.id() == e.entity.id();
                });

                if (index >= 0) {
                    me.ko.splice(index, 1);
                }
            } else if (e.action == "reattach") {
                me.ko.push(e.entity.toKo());
            } else {
                var index = me.ko().findIndex(function (it) {
                    return it.id() == e.entity.id();
                });

                if (index >= 0) {
                    return;
                }

                var koEntity = e.entity.toKo();

                me.ko.push(koEntity);
            }
        });

        me.ko.subscribe(function (newArray) {
            var newKoEntities = newArray.where(function (koIt) {
                var index = collection.findIndex(function (it) { return it.id() == koIt.id(); });
                return index < 0;
            });

            var removedEntities = collection.where(function (it) {
                var index = newArray.findIndex(function (koIt) { return it.id() == koIt.id(); });
                return index < 0;
            });

            newKoEntities.forEach(function (it, i) {
                var entity = me.create();
                entity.fromKo(it);
            });

            removedEntities.forEach(function (it, i) {
                it.remove();
            });
        });

        return me.ko;
    };

    function createEntity() {
        var entity = new settings.model[settings.className]();

        entity.attached = true;
        entity.events.remove.attach(entityRemove);
        entity.events.renew.attach(entityRenew);
        entity.events.detach.attach(entityDetach);
        entity.events.reattach.attach(entityReattach);

        return entity;
    }

    function entityRemove(e) {
        me.remove(e.entity);
    }

    function entityRenew(e) {
        collection.push(e.entity);
        if (me.ko) {
            me.ko.push(e.entity.toKo());
        }
    }

    function entityDetach(e) {
        collection.removeEl(e.entity);
        me.events.change.raise({ entity: e.entity, action: "detach" });
    }

    function entityReattach(e) {
        collection.push(entity);
        me.events.change.raise({ entity: e.entity, action: "reattach" });
    }

    function createSelectOptions(wheres, orders, take, skip, includes, whereMethod, orderMethod) {
        return ejs.createSelectOptions(me, wheres, orders, take, skip, includes, whereMethod, orderMethod);
    }

    ctor();
};