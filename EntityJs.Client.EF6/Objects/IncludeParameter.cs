using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class IncludeParameter
    {
        public IncludeParameter(JsIncludeParameter Source)
            : this(Source.EntitySetName, Source.EntityName, Source.Collection, Source.Property)
        {
            if (Source.Child != null)
            {
                this.Child = new IncludeParameter(Source.Child);
            }
        }

        public IncludeParameter(string EntitySetName, string EntityName, bool Collection, string Property)
        {
            this.EntitySetName = EntitySetName;
            this.EntityName = EntityName;
            this.Collection = Collection;
            this.Property = Property;
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

        public string Property
        {
            get;
            protected set;
        }

        public bool Collection
        {
            get;
            protected set;
        }

        public string Value
        {
            get
            {
                StringBuilder result = new StringBuilder();
                if (this.Property.IsNotNullOrEmpty())
                {
                    result.Append(this.Property);
                }
                else if (this.Collection)
                {
                    result.Append(this.EntitySetName);
                }
                else
                {
                    result.Append(this.EntityName);
                }

                if (this.Child != null)
                {
                    result.Append(".");
                    result.Append(this.Child.Value);
                }

                return result.ToString();
            }
        }

        public IncludeParameter Child
        {
            get;
            protected set;
        }
    }
}
