using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Data.Objects.DataClasses;

namespace EntityJs.Client.Objects
{
    public class JsEntityObjectContainer
    {
        public JsEntityObjectContainer()
        { 
        }

        public JsEntityObjectContainer(string EntityName, string EntitySetName, EntityObject Entity, string EntityMode = null)
        {
            this.Entity = Entity;
            this.EntityName = EntityName;
            this.EntitySetName = EntitySetName;
            this.EntityMode = EntityMode;
        }

        public string EntityName
        {
            get;
            set;
        }

        public string EntitySetName 
        {
            get;
            set;
        }

        public EntityObject Entity
        {
            get;
            set;
        }

        public string EntityMode
        {
            get;
            set;
        }

        public object ToJson() 
        {
            Serializer serializer = new Serializer();

            return new
            {
                this.EntityName,
                this.EntitySetName,
                Entity = serializer.Serialize(this.Entity, "", this.EntityMode)
            };
        }
    }
}
