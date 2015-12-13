using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Text;
using System.Collections;
using EntityJs.Models;

namespace EntityJs.Controllers
{
    public class SimpleEditController : EntityJs.Client.SimpleEditControllerBase
    {
        public SimpleEditController()
            : base(new EntityJsEntities())
        {
            
        }

        public ActionResult Index(string EntityName, string EntitySetName = null)
        {
            var data = this.GetData(EntityName, EntitySetName);

            ViewBag.Data = this.serializer.Serialize(data);

            return View();
        }

        protected override long GetUserID()
        {
            EntityJsEntities db = new EntityJsEntities();
            int id = db.Users.FirstOrDefault().ID;

            return id;
        }
    }
}
