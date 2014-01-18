using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public interface IParametrable
    {
        bool GetOrderParameter(string EntityName, string Parameter, out string NewParameter);
        bool GetWhereParameter(string EntityName, string Parameter, out string NewParameter);
    }
}
