using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsIncludeParameter
    {
        public string EntitySetName
        {
            get;
            set;
        }

        public string EntityName
        {
            get;
            set;
        }

        public string Property
        {
            get;
            set;
        }

        public bool Collection
        {
            get;
            set;
        }

        public JsIncludeParameter Child
        {
            get;
            set;
        }
    }
}
