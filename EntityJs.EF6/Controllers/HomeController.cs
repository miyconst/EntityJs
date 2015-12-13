using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Text;
using System.Collections;
using System.Web.Script.Serialization;
using EntityJs.EF6.Models;

namespace EntityJs.EF6.Controllers
{
    public class HomeController : Controller
    {
        JavaScriptSerializer serializer = new JavaScriptSerializer();
        Models.EntityJsEntities db = new Models.EntityJsEntities();

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Grid()
        {
            var data = new
            {
                UserSettings = db.UserSettings.ToList().Select(val => val.ToJson()).ToList(),
                //Products = db.Products.ToList().Select(val => val.ToJson()).ToList()
                Categories = db.Categories.ToList().Select(val => val.ToJson()).ToList()
            };

            ViewBag.Data = serializer.Serialize(data);

            return View();
        }

        public ActionResult Customers()
        {
            var data = new
            {
                UserSettings = db.UserSettings.ToList().Select(val => val.ToJson()).ToList(),
                Categories = db.Categories.ToList().Select(val => val.ToJson()).ToList()
            };

            ViewBag.Data = serializer.Serialize(data);

            return View();
        }

        public ActionResult Memory()
        {
            return View();
        }

        public ActionResult ClearMemory()
        {
            return View();
        }

        public ActionResult Scale()
        {
            return View();
        }

        public ActionResult Calendar()
        {
            var data = new
            {
                Roles = db.Roles.ToList().Select(val => val.ToJson()).ToList(),
                Users = db.Users.ToList().Select(val => val.ToJson()).ToList(),
                UserSettings = db.UserSettings.ToList().Select(val => val.ToJson()).ToList(),
                IncidentTypes = db.IncidentTypes.ToList().Select(val => val.ToJson()).ToList()
            };

            ViewBag.Data = serializer.Serialize(data);

            return View();
        }

        public ActionResult MultiSelect()
        {
            return View();
        }

        public ActionResult Rating()
        {
            return View();
        }

        public ActionResult Css2Less()
        {
            return View();
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
        }
    }
}
