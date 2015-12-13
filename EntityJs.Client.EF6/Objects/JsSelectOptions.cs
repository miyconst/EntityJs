using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsSelectOptions
    {
        public string EntitySetName { get; set; }
        public string EntityName { get; set; }
        public Objects.JsIncludeParameter[] Includes { get; set; }
        public Objects.JsWhereParameter[] Wheres { get; set; }
        public Objects.JsOrderParameter[] Orders { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
        public string WhereMethod { get; set; }
        public string OrderMethod { get; set; }
        public string SelectMode { get; set; }
        public bool IncludeResults { get; set; }

        public JsSelectOptions()
        {
            Skip = -1;
            Take = -1;
            IncludeResults = true;
        }
    }
}
