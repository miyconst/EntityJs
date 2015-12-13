/*-- File version 0.0.0.23 from 2013.05.16 --*/
ejs.model = function (params) {
    var me = this;
    var settings = {
        sets: [],
        classes: [],
        selectUrl: ejs.arp() + "Data/Select",
        updateUrl: ejs.arp() + "Data/Update",
        exportUrl: ejs.arp() + "Data/Export",
        preventDataLost: true,
        autoUpdate: false
    };
    var changes = {
        updated: [],
        deleted: []
    };
    var exs = {
        notLoaded: "The data is not loaded"
    };

    var ctor = function () {
        $.extend(settings, params);

        settings.sets.forEach(function (it, i) {
            var set = it;

            if (!it.className && !it.name) {
                throw "You have to provide name or className at least.";
            }
            else if (!it.className) {
                it.className = ejs.toSingular(it.name);
            } else if (!it.name) {
                it.name = ejs.toPlural(it.className);
            }

            var name = it.name;
            var className = it.className;

            if (!it.belongs) {
                it.belongs = [];
            }
            var belongs = it.belongs;
            belongs.forEach(function (it, i) {
                if (typeof it == "string") {
                    it = { name: it };
                    belongs[i] = it;
                }

                if (!it.setName) {
                    it.setName = ejs.toPlural(it.name);
                }

                if (!it.fkProperty) {
                    it.fkProperty = it.name + "ID";
                }
            });

            if (!it.hasMany) {
                it.hasMany = [];
            }
            var hasMany = it.hasMany;
            hasMany.forEach(function (it, i) {
                if (typeof it == "string") {
                    it = { name: it };
                    hasMany[i] = it;
                }

                if (!it.setName) {
                    it.setName = it.name;
                }

                if (!it.fkProperty) {
                    it.fkProperty = ejs.toSingular(set.name) + "ID";
                }
            });

            me[name] = new ejs.set({ name: name, className: className, model: me, mode: it.mode, properties: it.properties });

            me[name].events.change.attach(function (e) {
                if (e.action != "insert" || changes.updated.contains(e.entity)) {
                    return;
                }

                changes.updated.push(e.entity);
            });

            var onChange = function (e) {
                me.events.change.raise(e);

                if (e.inParse || changes.updated.contains(e.entity) || !e.entity.attached || e.entity.isLocked() || e.oldValue === e.newValue) {
                    return;
                }

                changes.updated.push(e.entity);
                me.events.changed.raise(e);
            };

            var onCommit = function (e) {
                if (!e.hasChanges || changes.updated.contains(e.entity)) {
                    return;
                }

                changes.updated.push(e.entity);
                me.events.changed.raise(e);
            };

            var onRemove = function (e) {
                changes.updated.removeEl(e.entity);
                me.events.remove.raise(e);

                if (!changes.deleted.contains(e.entity) && e.entity.attached && e.entity.id() > 0) {
                    changes.deleted.push(e.entity);
                }

                me.events.removed.raise(e);
            };

            var onRenew = function (e) {
                me.events.renew.raise(e);

                var index = changes.deleted.indexOf(e.entity);
                if (index >= 0) {
                    changes.deleted.removeAt(index);
                }

                e.entity.settings.properties.forEach(function (it, i) {
                    if (e.entity[it].hasChanges()) {
                        changes.updated.push(e.entity);
                        return { stop: true };
                    }
                });

                me.events.renewed.raise(e);
            };

            var onDetach = function (e) {
                me.events.detach.raise(e);
                changes.deleted.removeEl(e.entity);
                changes.updated.removeEl(e.entity);
                me.events.detached.raise(e);
            };

            var onReattach = function (e) {
                me.events.reattach.raise(e);
                if (e.entity.removed) {
                    changes.deleted.push(e.entity);
                }
                e.entity.settings.properties.forEach(function (it, i) {
                    if (e.entity[it].hasChanges()) {
                        changes.updated.push(e.entity);
                        return { stop: true };
                    }
                });
                me.events.reattached.raise(e);
            };

            var onAttach = function (e) {
                e.className = className;
                me.events.koCreated.raise(e);
            };
            
            var onDispose = function (e) {
                e.className = className;
                me.events.dispose.raise(e);

                if (e.cancel) {
                    return;
                }

                changes.deleted.removeEl(e.entity);
                changes.updated.removeEl(e.entity);                
            };

            me[className] = function () {
                var entity = new ejs.entity({
                    properties: it.properties,
                    model: me,
                    setName: name,
                    name: className,
                    belongs: it.belongs,
                    hasMany: it.hasMany
                });

                entity.events.change.attach(onChange);
                entity.events.commit.attach(onCommit);
                entity.events.remove.attach(onRemove);
                entity.events.renew.attach(onRenew);
                entity.events.detach.attach(onDetach);
                entity.events.reattach.attach(onReattach);
                entity.events.koCreated.attach(onAttach);
                entity.events.dispose.attach(onDispose);

                return entity;
            };
        });

        if (settings.preventDataLost) {
            top.onbeforeunloadEvent.attach(function () {
                if (settings.autoUpdate) {
                    me.update("", "", true);
                }
                else if (me.hasChanges()) {
                    return "У вас есть несохраненные данные.";
                }
            });
        }

        me.settings = settings;
    };

    me.events = {
        remove: ejs.createEvent(),
        removed: ejs.createEvent(),
        renew: ejs.createEvent(),
        renewed: ejs.createEvent(),
        change: ejs.createEvent(),
        changed: ejs.createEvent(),
        koCreated: ejs.createEvent(),
        updated: ejs.createEvent(),
        update: ejs.createEvent(),
        detach: ejs.createEvent(),
        detached: ejs.createEvent(),
        reattach: ejs.createEvent(),
        reattached: ejs.createEvent(),
        dispose: ejs.createEvent(),
        changesCancelled: ejs.createEvent()
    };
    me.minID = -1;
    me.getMinID = function () {
        var result = me.minID;
        me.minID--;
        return result;
    };

    me.refreshData = function (data) {
        settings.sets.forEach(function (it) {
            if (!data[it.name]) {
                return;
            }

            me[it.name].refreshData(data[it.name]);
        });
    };

    me.addData = function (data) {
        settings.sets.forEach(function (it) {
            if (!data[it.name]) {
                return;
            }

            me[it.name].addData(data[it.name]);
        });
    };

    me.hasChanges = function () {
        return changes.updated.length > 0 || changes.deleted.length > 0;
    };

    me.clearChanges = function () {
        changes.updated.clear();
        changes.deleted.clear();
        if (me.koHasChanges) {
            me.koHasChanges(false);
        }
    };

    me.cancelChanges = function () {
        var restore = function (e) {
            if (e.id() < 0) {
                e.remove();
                return;
            }
            e.settings.properties.forEach(function (p, i) {
                if (e[p].hasChanges()) {
                    e[p].restore();
                }
            });
        };
        changes.updated.copy().forEach(function (it, i) {
            restore(it);
            it.hasChanges = false;
        });
        changes.deleted.copy().forEach(function (it, i) {
            it.renew();
            restore(it);
            it.hasChanges = false;
        });
        changes.updated = [];
        changes.deleted = [];
        me.events.changesCancelled.raise();
    };

    me.select = function (options, callback) {
        var defaultOptions = {
            includes: [],
            wheres: [],
            orders: [],
            skip: -1,
            take: -1,
            whereMethod: "",
            orderMethod: ""
        };

        for (var i in options) {
            defaultOptions[i] = options[i];
        }

        //$.extend(defaultOptions, options);

        ejs.rjson({
            url: settings.selectUrl,
            data: ejs.toServerObject(defaultOptions),
            success: function (result) {
                if (typeof callback == "function") {
                    callback(result);
                }
            },
            error: function (ex) {
            }
        });
    };

    me["export"] = function (options, callback) {
        ejs.rjson({
            url: settings.exportUrl,
            data: ejs.toServerObject(options),
            success: function (result) {
                var v = true;
                if (typeof callback == "function") {
                    v = callback(result);
                }
                if (v !== false) {
                    top.window.location = ejs.fdp(result.id, 0);
                }
            },
            error: function (ex) {
            }
        });
    };

    me.update = function (callback, setNames, sync) {
        var eupdate = { model: me, cancel: false };
        me.events.update.raise(eupdate);
        if (eupdate.cancel) {
            return;
        }

        var updated = changes.updated;
        var deleted = changes.deleted;

        if (setNames && setNames.any()) {
            updated = updated.where(function (it, i) {
                return setNames.contains(it.settings.setName);
            });

            deleted = deleted.where(function (it, i) {
                return setNames.contains(it.settings.setName);
            });
        }

        if (!updated.any() && !deleted.any()) {
            var e = {
                model: me,
                changes: {
                    updated: [],
                    deleted: []
                },
                canceled: []
            };

            me.events.updated.raise(e);
            ejs.callIfFunction(callback, e);

            return;
        }

        var data = {
            updated: updated.select(function (it, i) {
                return {
                    entitySetName: ejs.toServerName(it.settings.setName),
                    entityName: ejs.toServerName(it.settings.name),
                    entityMode: ejs.toServerName(me[it.settings.setName].settings.mode || ""),
                    values: it.serialize()
                }
            }),
            deleted: deleted.select(function (it, i) {
                return {
                    entitySetName: ejs.toServerName(it.settings.setName),
                    entityName: ejs.toServerName(it.settings.name),
                    entityMode: ejs.toServerName(me[it.settings.setName].settings.mode || ""),
                    values: it.serialize()
                }
            })
        };

        var r = ejs.rjson({
            async: !sync,
            url: settings.updateUrl,
            data: ejs.toServerObject(data),
            success: function (result) {
                me.errors = result.errors;
                updated.forEach(function (it, i) {
                    var id = it.id();

                    if (id < 0) {
                        id = result.maps.first("val=>val.oldID==" + id).newID;
                    }

                    var newValues = result.objects.first("val=>val.entity.id==" + id + "&&val.entityName.toLowerCase()=='" + it.settings.name.toLowerCase() + "'");

                    if (newValues) {
                        it.parse(newValues);
                    }
                });

                var canceled = [];

                result.canceledObjects.forEach(function (it, i) {
                    var entity = changes.updated.first(function (en) {
                        return en.settings.name == ejs.tjn(it.entityName) && en.id() == it.entity.id;
                    });

                    if (!entity) {
                        entity = changes.deleted.first(function (en) {
                            return en.settings.name == ejs.tjn(it.entityName) && en.id() == it.entity.id;
                        });
                    }

                    if (entity) {
                        canceled.push(entity);
                    }
                });

                var e = {
                    model: me,
                    changes: {
                        deleted: deleted,
                        updated: updated
                    },
                    canceled: canceled,
                    errors: result.errors
                };

                if (setNames && setNames.length) {
                    updated.forEach(function (it, i) {
                        changes.updated.removeEl(it);
                    });
                    deleted.forEach(function (it, i) {
                        changes.deleted.removeEl(it);
                    });
                } else if (canceled.any()) {
                    for (var i = 0; i < changes.updated.length;) {
                        var it = changes.updated[i];
                        if (!canceled.contains(it)) {
                            changes.updated.removeAt(i);
                            continue;
                        }
                        i++;
                    }
                    for (var i = 0; i < changes.deleted.length;) {
                        var it = changes.deleted[i];
                        if (!canceled.contains(it)) {
                            changes.deleted.removeAt(i);
                            continue;
                        }
                        i++;
                    }
                } else {
                    changes.updated = [];
                    changes.deleted = [];
                }

                me.events.updated.raise(e);
                ejs.callIfFunction(callback, e);
            }
        });

        return r;
    };

    me.toKo = function (s) {
        if (!s) {
            s = {};
        }

        settings.sets.forEach(function (it, i) {
            s[it.name] = me[it.name].toKo();
        });

        s.hasChanges = me.getHasChangesObservable();

        return s;
    };

    me.getHasChangesObservable = function () {
        if (me.koHasChanges) {
            return me.koHasChanges;
        }

        var result = ko.observable(me.hasChanges());

        for (var i in me.events) {
            me.events[i].attach(function () {
                result(me.hasChanges());
            });
        }

        me.koHasChanges = result;

        return result;
    };

    ctor();
};