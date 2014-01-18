using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Objects.DataClasses;

namespace EntityJs.Client.Objects
{
    public class JsSelectResult
    {
        public JsSelectResult()
        {
            this.Collections = new Dictionary<string, List<EntityObject>>();
        }

        public JsSelectResult(Dictionary<string, List<EntityObject>> Collections)
        {
            this.Collections = Collections;
        }

        public object ToJson()
        {
            Serializer serializer = new Serializer();

            return new
            {
                Collections = this.Collections.ToDictionary(key => key.Key, val => val.Value.Where(v => v != null).Select(v => serializer.Serialize(v, "", SelectMode)).ToList()),
                this.TotalCount,
                this.Data
            };
        }

        public object Data { get; set; }

        public string SelectMode { get; set; }

        public Dictionary<string, List<EntityObject>> Collections
        {
            get;
            protected set;
        }

        public int TotalCount
        {
            get;
            set;
        }
    }
}
