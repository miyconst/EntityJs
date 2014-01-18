using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Objects;
using System.Text.RegularExpressions;

namespace EntityJs.Client.Objects
{
    public class WhereParameter : PropertyParameter
    {
        public WhereParameter(JsWhereParameter Source)
        {
            if (Source.DataType == DataTypesEnum.Number && Source.Values != null && Source.Values.Length > 1)
            {
                Init(Source.Property, (object)true, Source.Condition, DataTypesEnum.Group, Source.Operand, Source.Action);

                this.SubCollection = new WhereCollection();

                foreach (object o in Source.Values)
                {
                    this.SubCollection.Parameters.Add(new WhereParameter(Source.Property, o, Source.Condition, Source.DataType, Source.Condition == ConditionsEnum.NotEquals ? OperandsEnum.And : OperandsEnum.Or, Source.Action));
                }

                return;
            }

            Init(Source.Property, Source.Value, Source.Condition, Source.DataType, Source.Operand, Source.Action);

            if (Source.DataType == DataTypesEnum.Group && Source.SubParameters != null && Source.SubParameters.Any())
            {
                SubCollection = new WhereCollection(Source.SubParameters);
            }
        }

        public WhereParameter(string Property, object Value)
            : this(Property, Value, ConditionsEnum.Equals, DataTypesEnum.String, OperandsEnum.And, ActionsEnum.None)
        {
        }

        public WhereParameter(string Property, object Value, ConditionsEnum Condition, DataTypesEnum DataType, OperandsEnum Operand, ActionsEnum Action)
        {
            Init(Property, Value, Condition, DataType, Operand, Action);
        }

        protected void Init(string Property, object Value, ConditionsEnum Condition, DataTypesEnum DataType, OperandsEnum Operand, ActionsEnum Action)
        {
            this.Property = Property;
            this.Value = Value;
            this.Condition = Condition;
            this.DataType = DataType;
            this.Operand = Operand;
            this.Action = Action;
            CheckProperty();

            this.Name = "p" + DateTime.Now.GetHashCode();
        }

        public object GetTypedValue()
        {
            if (this.Value == null)
            {
                return null;
            }

            switch (this.DataType)
            {
                case DataTypesEnum.Date:
                    return DateTime.Parse(this.Value.ToString());
                case DataTypesEnum.Time:
                    return TimeSpan.Parse(this.Value.ToString());
                case DataTypesEnum.Number:
                    try
                    {
                        return decimal.Parse(this.Value.ToString());
                    }
                    catch
                    {
                        return decimal.Parse(this.Value.ToString(), System.Globalization.CultureInfo.InvariantCulture);
                    }
                case DataTypesEnum.Bool:
                    return bool.Parse(this.Value.ToString().ToLower());
                default:
                    return this.Value.ToString();
            }
        }

        public string Name
        {
            get;
            set;
        }

        public object Value
        {
            get;
            protected set;
        }

        public ConditionsEnum Condition
        {
            get;
            protected set;
        }

        public DataTypesEnum DataType
        {
            get;
            protected set;
        }

        public OperandsEnum Operand
        {
            get;
            protected set;
        }

        public WhereCollection SubCollection
        {
            get;
            protected set;
        }

        public override string ToString()
        {
            //bool fn = false;
            StringBuilder result = new StringBuilder();
            string ap = this.ActionProperty;
            string condition = string.Empty;

            if (this.DataType == DataTypesEnum.Date && this.Condition == ConditionsEnum.Equals)
            {
                //result.Append("SqlServer.ABS(SqlServer.DATEDIFF('DAY', it.").Append(this.Property).Append(", @").Append(this.Name).Append(")) < 1");

                result.Append("(SqlFunctions.DateDiff(\"Day\", ").Append(this.ActionProperty).Append(", @").Append(this.Name).Append(") < 1 AND ");
                result.Append("SqlFunctions.DateDiff(\"Day\", ").Append(this.ActionProperty).Append(", @").Append(this.Name).Append(") > -1)");

                return result.ToString();
            }

            result.Append(this.ActionProperty);
            if (!ap.Contains("{condition}"))
            {
                result.Append("{condition}");
            }

            switch (this.Condition)
            {
                case ConditionsEnum.Equals:
                    //result.Append(" = ");
                    condition = " == {parameter}";
                    break;
                case ConditionsEnum.EqualsOrLessThan:
                    //result.Append(" <= ");
                    condition = " <= {parameter}";
                    break;
                case ConditionsEnum.EqualsOrMoreThan:
                    //result.Append(" >= ");
                    condition = " >= {parameter}";
                    break;
                case ConditionsEnum.LessThan:
                    //result.Append(" < ");
                    condition = " < {parameter}";
                    break;
                case ConditionsEnum.MoreThan:
                    //result.Append(" > ");
                    condition = " > {parameter}";
                    break;
                case ConditionsEnum.NotEquals:
                    //result.Append(" != ");
                    condition = " != {parameter}";
                    break;
                case ConditionsEnum.Like:
                    //result.Append(" LIKE ");

                    string value = this.Value.ToString();

                    if (value.StartsWith("%") && value.EndsWith("%"))
                    {
                        //result.Append(".Contains(");
                        //fn = true;
                        condition = ".Contains({parameter})";
                    }
                    else if (value.StartsWith("%"))
                    {
                        //result.Append(".EndsWith(");
                        //fn = true;
                        condition = ".EndsWith({parameter})";
                    }
                    else if (value.EndsWith("%"))
                    {
                        //result.Append(".StartsWith(");
                        //fn = true;
                        condition = ".StartsWith({parameter})";
                    }
                    else
                    {
                        //result.Append(" = ");
                        condition = " == {parameter}";
                    }
                    break;
                case ConditionsEnum.IsNull:
                    //result.Append(" IS NULL");
                    //result.Append(" == null");
                    //return result.ToString();
                    condition = " == null";
                    break;
                case ConditionsEnum.IsNotNull:
                    //result.Append(" IS NOT NULL");
                    //result.Append(" != null");
                    //return result.ToString();
                    condition = " != null";
                    break;
            }

            //result.Append("@").Append(this.Name);

            //if (fn)
            //{
            //    result.Append(")");
            //}

            return result.ToString().Replace("{condition}", condition.Replace("{parameter}", "@" + this.Name));
        }

        public ObjectParameter GetEntityParameter()
        {
            object value = this.GetTypedValue();

            if (this.DataType == DataTypesEnum.String)
            {
                value = value.ToString().Trim('%');
            }

            ObjectParameter result = new ObjectParameter(this.Name, value);

            return result;
        }

        public override bool GetNewParameter(string EntityName, string Property, out string NewProperty)
        {
            return this.Model.GetWhereParameter(EntityName, Property, out NewProperty);
        }
    }
}
