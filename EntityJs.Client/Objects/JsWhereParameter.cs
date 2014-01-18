using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsWhereParameter
    {
        public JsWhereParameter()
        {
            this.Condition = ConditionsEnum.Equals;
            this.DataType = DataTypesEnum.String;
            this.Operand = OperandsEnum.And;
        }

        public string Property
        {
            get;
            set;
        }

        public object Value
        {
            get;
            set;
        }

        public object[] Values
        {
            get;
            set;
        }

        public ConditionsEnum Condition
        {
            get;
            set;
        }

        public DataTypesEnum DataType
        {
            get;
            set;
        }

        public OperandsEnum Operand
        {
            get;
            set;
        }

        public ActionsEnum Action
        {
            get;
            set;
        }

        public JsWhereParameter[] SubParameters
        {
            get;
            set;
        }
    }
}
