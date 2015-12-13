using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class IncludeCollection
    {
        public bool IncludeResults { get; set; }
        public IncludeCollection()
        {
            this.Parameters = new List<IncludeParameter>();
            this.IncludeResults = true;
        }

        public IncludeCollection(JsIncludeParameter[] Parameters)
        {
            this.Parameters = Parameters.Select(val => new IncludeParameter(val)).ToList();
        }

        public List<IncludeParameter> Parameters
        {
            get;
            protected set;
        }

        public dynamic AddInclude(dynamic Query)
        {
            if (!this.Parameters.Any())
            {
                return Query;
            }

            this.Parameters.ForEach(val =>
            {
                Query = Query.Include(val.Value);
            });

            return Query;
        }
    }
}
