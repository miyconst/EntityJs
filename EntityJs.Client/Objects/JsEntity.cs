using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsEntity
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

        public string EntityMode
        {
            get;
            set;
        }

        public List<JsKeyValue> Values
        {
            get;
            set;
        }
    }
}
