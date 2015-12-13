using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public interface IEntityCustomSelect
    {
        object ToJson(string EntityMode);
    }
}
