﻿using System.Web;
using System.Web.Mvc;

namespace EntityJs.EF6
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }
    }
}