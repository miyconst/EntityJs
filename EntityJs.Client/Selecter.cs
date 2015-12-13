using System;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Data.Objects;
using System.Data.Objects.DataClasses;
using System.Reflection;
using System.Collections.Generic;

namespace EntityJs.Client
{
    public class Selecter<ContextType>
        where ContextType : ObjectContext
    {
        EntityModel<ContextType> model;

        public Selecter(EntityModel<ContextType> Model)
        {
            this.model = Model;
        }

        public Objects.JsSelectResult Select(EntityJs.Client.Objects.JsSelectOptions Options)//string EntitySetName, string EntityName, Objects.JsIncludeParameter[] Includes = null, Objects.JsWhereParameter[] Wheres = null, Objects.JsOrderParameter[] Orders = null, int Skip = -1, int Take = -1, string WhereMethod = null, string OrderMethod = null)
        {
            string EntitySetName = Options.EntitySetName;
            string EntityName = Options.EntityName;
            Objects.JsIncludeParameter[] Includes = Options.Includes;
            Objects.JsWhereParameter[] Wheres = Options.Wheres;
            Objects.JsOrderParameter[] Orders = Options.Orders;
            int Skip = Options.Skip;
            int Take = Options.Take;
            string WhereMethod = Options.WhereMethod;
            string OrderMethod = Options.OrderMethod;

            List<string> log = new List<string>();
            log.Add(string.Format("{0:hh:mm.ss:ffff} Select started", DateTime.Now));

            Objects.JsSelectResult result;
            Objects.WhereCollection where = null;
            Objects.OrderCollection order = null;
            Objects.IncludeCollection include = null;
            int count;

            if (Includes != null && Includes.Length > 0)
            {
                include = new Objects.IncludeCollection(Includes);
                include.IncludeResults = Options.IncludeResults;
            }

            if (Wheres != null && Wheres.Length > 0)
            {
                where = new Objects.WhereCollection(Wheres);
            }

            if (Orders != null && Orders.Length > 0)
            {
                order = new Objects.OrderCollection(Orders);
            }
            
            var data = this.model.Select(EntitySetName, EntityName, out count, include, where, order, Skip, Take, WhereMethod, OrderMethod, Options.SelectMode);
            log.Add(string.Format("{0:hh:mm.ss:ffff} Select data selected", DateTime.Now));

            result = new Objects.JsSelectResult(data);
            result.SelectMode = Options.SelectMode;
            result.TotalCount = count;
            log.Add(string.Format("{0:hh:mm.ss:ffff} Select completed", DateTime.Now));
            result.Data = log;

            return result;
        }

        public EntityModel<ContextType> EntityModel
        {
            get
            {
                return this.model;
            }
        }
    }
}
