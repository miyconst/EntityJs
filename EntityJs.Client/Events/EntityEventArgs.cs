using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Objects;
using System.Data.Objects.DataClasses;
using EntityJs.Client.Objects;

namespace EntityJs.Client.Events
{
    public class EntityEventArgs : EventArgs
    {
        public EntityEventArgs(ObjectContext Context, string EntitySetName, string EntityName, EntityObject Entity, ActionsEnum Action)
            : this(Context, EntitySetName, EntityName, Entity, new Dictionary<string, object>(), Action)
        {
        }

        public EntityEventArgs(ObjectContext Context, string EntitySetName, string EntityName, EntityObject Entity, Dictionary<string, object> Values, ActionsEnum Action)
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

        public EntityObject Entity
        {
            get;
            protected set;
        }

        public ObjectContext Context
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
