using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class OrderParameter : PropertyParameter
    {
        public OrderParameter(JsOrderParameter Source)
            : this(Source.Property, Source.Descending, Source.Action)
        {
        }

        public OrderParameter(string Property, bool Descending, ActionsEnum Action)
        {
            this.Property = Property;
            this.Descending = Descending;
            this.Action = Action;

            CheckProperty();
        }

        public bool Descending
        {
            get;
            protected set;
        }

        public override string ToString()
        {
            StringBuilder result = new StringBuilder();

            result.Append(this.ActionProperty);

            if (this.Descending)
            {
                result.Append(" DESC");
            }

            return result.ToString();
        }

        public override bool GetNewParameter(string EntityName, string Property, out string NewProperty)
        {
            return this.Model.GetOrderParameter(EntityName, Property, out NewProperty);
        }
    }
}
