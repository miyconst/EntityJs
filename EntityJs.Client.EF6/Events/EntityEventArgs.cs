using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using EntityJs.Client.Objects;
using System.Data.Entity;

namespace EntityJs.Client.Events
{
    public class EntityEventArgs : EventArgs
    {
        public EntityEventArgs(DbContext Context, string EntitySetName, string EntityName, IEntity Entity, ActionsEnum Action)
            : this(Context, EntitySetName, EntityName, Entity, new Dictionary<string, object>(), Action)
        {
        }

        public EntityEventArgs(DbContext Context, string EntitySetName, string EntityName, IEntity Entity, Dictionary<string, object> Values, ActionsEnum Action)
        {
            this.Context = Context;
            this.EntityName = EntityName;
            this.EntitySetName = EntitySetName;
            this.Entity = Entity;
            this.Values = Values;
            this.Action = Action;
        }

        public string EntitySetName
        {
            get;
            protected set;
        }

        public string EntityName
        {
            get;
            protected set;
        }

        public string EntityMode
        {
            get;
            set;
        }

        public ActionsEnum Action
        {
            get;
            protected set;
        }

        public IEntity Entity
        {
            get;
            protected set;
        }

        public DbContext Context
        {
            get;
            protected set;
        }

        public Dictionary<string, object> Values
        {
            get;
            protected set;
        }
    }
}
