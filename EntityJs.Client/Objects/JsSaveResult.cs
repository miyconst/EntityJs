using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Data.Objects.DataClasses;

namespace EntityJs.Client.Objects
{
    public class JsSaveResult
    {
        public JsSaveResult()
        {
            this.Maps = new List<JsIDMap>();
            this.Objects = new List<JsEntityObjectContainer>();
            this.CanceledObjects = new List<JsEntityObjectContainer>();
            this.Errors = new List<string>();
        }

        public object Data
        { get; set; }

        public List<JsIDMap> Maps
        {
            get;
            protected set;
        }

        public List<JsEntityObjectContainer> Objects
        {
            get;
            protected set;
        }

        public List<JsEntityObjectContainer> CanceledObjects
        {
            get;
            protected set;
        }

        public List<String> Errors
        {
            get;
            protected set;
        }

        public object ToJson()
        {
            return new
            {
                Errors,
                Maps = this.Maps,
                Data = this.Data,
                Objects = this.Objects.Select(val => val.ToJson()).ToList(),
                CanceledObjects = CanceledObjects.Select(val => val.ToJson()).ToList()
            };
        }
    }
}
