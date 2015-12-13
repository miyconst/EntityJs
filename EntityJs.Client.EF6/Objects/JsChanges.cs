using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsChanges
    {
        public JsChanges()
        {
            this.Updated = new List<JsEntity>();
            this.Deleted = new List<JsEntity>();
        }

        public List<JsEntity> Updated
        {
            get;
            set;
        }

        public List<JsEntity> Deleted
        {
            get;
            set;
        }
    }
}
