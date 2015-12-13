using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using EntityJs.Models;
using EntityJs.Client;
using EntityJs.Client.Objects;

namespace EntityJs.Controllers
{
    public class DataController : EntityJs.Client.DataControllerBase
    {
        JavaScriptSerializer serializer = new JavaScriptSerializer();

        public DataController()
            : base(new EntityJsEntities())
        {
        }

        /*public override JsonResult Select(string EntitySetName, string EntityName, JsIncludeParameter[] Includes = null, JsWhereParameter[] Wheres = null, JsOrderParameter[] Orders = null, int Skip = -1, int Take = -1, string WhereMethod = null, string OrderMethod = null)
        {
            //System.Threading.Thread.CurrentThread.Join(10000);

            return base.Select(EntitySetName, EntityName, Includes, Wheres, Orders, Skip, Take, WhereMethod, OrderMethod);
        }*/

        public override JsonResult SaveUserSettings(string Name, string Value)
        {
            System.Threading.Thread.CurrentThread.Join(3000);

            EntityJsEntities db = this.db as EntityJsEntities;
            UserSetting s = db.UserSettings.FirstOrDefault(val => val.Name == Name);

            if (s == null)
            {
                s = new UserSetting();
                db.UserSettings.AddObject(s);
                s.Name = Name;
                s.UserID = db.Users.FirstOrDefault().ID;
            }

            s.Value = Value;
            db.SaveChanges();
            db.Dispose();

            return Json(s.ToJson());
        }

        public override ActionResult DownloadFile(string ID, int FileID = -1)
        {
            EntityJsEntities db = this.db as EntityJsEntities;
            Models.File file = db.Files.FirstOrDefault(val => val.ID == FileID);

            if (file.Name != ID)
            {
                return new EmptyResult();
            }

            string ext = System.IO.Path.GetExtension(file.Url).Replace(".", string.Empty);
            return new FilePathResult(file.RealPath, "application/" + ext);
        }

        public override ActionResult UploadFile(string ID, int FileID = -1)
        {
            ViewBag.ID = ID;
            ViewBag.FileID = FileID;

            if (Request.Files.Count < 1)
            {
                return View();
            }

            EntityJsEntities db = this.db as EntityJsEntities;
            HttpPostedFileBase item = Request.Files[0];
            Models.File file = null;
            string folder;
            string ext = System.IO.Path.GetExtension(item.FileName).Replace(".", string.Empty);

            if (1024 * 1000 < item.ContentLength)
            {
                ViewBag.Data = serializer.Serialize(new { Code = 202, Message = "Incorrect size", ID = ID });
                return View();
            }

            if (FileID > 0)
            {
                file = db.Files.FirstOrDefault(val => val.ID == FileID);
            }

            if (file == null)
            {
                file = new Models.File();
                db.Files.AddObject(file);
            }
            else
            {
                file.RemoveFile();
            }

            folder = this.GetUploadedFilesPath();
        
            file.Name = item.FileName;
            file.Url = string.Format("{0}/{1}", this.GetUploadedFilesDirectoryName(), this.GetNextFileName(item.FileName, folder));
            file.Date = DateTime.Now;

            item.SaveAs(file.RealPath);

            db.SaveChanges();

            ViewBag.Data = serializer.Serialize(new { Code = 200, Message = string.Empty, File = file.ToJson(), ID = ID });

            return View();
        }

        protected override EntityModel<System.Data.Objects.ObjectContext> CreateModel()
        {
            return new JsModel(this.db);
        }
    }
}
