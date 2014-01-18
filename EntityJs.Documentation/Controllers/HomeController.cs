using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace EntityJs.Documentation.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index(string ID)
        {
            string name = "Index";

            if (!string.IsNullOrEmpty(ID))
            {
                name += "." + ID;
            }

            return View(name);
        }
    }
}
