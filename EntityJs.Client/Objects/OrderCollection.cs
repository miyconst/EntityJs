using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class OrderCollection
    {
        public OrderCollection(JsOrderParameter[] Parameters)
        {
            this.Parameters = Parameters.Select(val => new OrderParameter(val)).ToList();
        }

        public OrderCollection(List<OrderParameter> Parameters)
        {
            this.Parameters = Parameters;
        }

        public OrderCollection()
        {
            this.Parameters = new List<OrderParameter>();
        }

        public List<OrderParameter> Parameters
        {
            get;
            protected set;
        }

        public dynamic AddOrder<TModel>(dynamic Query, EntityModel<TModel> Model, string EntityName, Dictionary<string, Func<dynamic, List<OrderParameter>, dynamic>> Methods, string Method = null)
            where TModel : System.Data.Objects.ObjectContext
        {
            dynamic result;

            if (!this.Parameters.Any())
            {
                result = EntityJs.Client.Dynamic.DynamicQueryable.OrderBy(Query, "it.ID");
                return result;
            }

            if (Method.IsNotNullOrEmpty())
            {
                return Methods[Method](Query, this.Parameters);
            }

            StringBuilder order = new StringBuilder();
            String orderString = string.Empty;
            bool desc = true;
            for (int i = 0; i < this.Parameters.Count; i++)
            {
                if (i > 0)
                {
                    order.Append(", ");
                }

                OrderParameter par = this.Parameters[i];

                par.Model = Model;
                par.EntityName = EntityName;
                desc = desc && par.Descending;

                order.Append(par.ToString());
            }
            orderString = order.ToString() + ", it.ID" + (desc ? " DESC" : "");
            result = EntityJs.Client.Dynamic.DynamicQueryable.OrderBy(Query, orderString);

            return result;
        }
    }
}
