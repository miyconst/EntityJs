using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsOrderParameter
    {
        public string Property
        {
            get;
            set;
        }

        public bool Descending
        {
            get;
            set;
        }

        public ActionsEnum Action
        {
            get;
            set;
        }
    }
}
