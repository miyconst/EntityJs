using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using EntityJs.Client;
using EntityJs.Client.Objects;
using System.Data.Entity;

namespace EntityJs.Client
{
    public abstract class DataControllerBase : Controller
    {
        protected DbContext db;
        protected EntityModel<DbContext> model;

        public DataControllerBase(DbContext DB)
        {
            this.db = DB;
            model = CreateModel();
        }

        public virtual JsonResult Update(JsChanges Changes)
        {
            JsonResult result = new JsonResult();
            Updater<DbContext> updater = new Updater<DbContext>(model);
            JsSaveResult data = updater.Update(Changes);

            result.Data = new
            {
                code = 200,
                result = data.ToJson()
            };
            result.JsonRequestBehavior = JsonRequestBehavior.AllowGet;

            return result;
        }

        public virtual ActionResult Select(JsSelectOptions Options)//string EntitySetName, string EntityName, Objects.JsIncludeParameter[] Includes = null, Objects.JsWhereParameter[] Wheres = null, Objects.JsOrderParameter[] Orders = null, int Skip = -1, int Take = -1, string WhereMethod = null, string OrderMethod = null)
        {
            string json = this.GetCache(Options);

            if (json.IsNotNullOrEmpty())
            {
                return this.Content(json, "application/json");
            }

            System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
            Selecter<DbContext> selecter = new Selecter<DbContext>(model);
            JsSelectResult data = selecter.Select(Options);//EntitySetName, EntityName, Includes, Wheres, Orders, Skip, Take, WhereMethod, OrderMethod);
            List<string> log = data.Data as List<string>;

            if (log != null)
            {
                log.Add(string.Format("{0:hh:mm.ss:ffff} Select data serialized", DateTime.Now));
            }

            var result = new
            {
                code = 200,
                result = data.ToJson()
            };

            json = serializer.Serialize(result);

            this.SetCache(json, Options);

            return this.Content(json, "application/json");
        }

        public virtual JsonResult SaveUserSettings(string Name, string Value)
        {
            throw new NotImplementedException();
        }

        public virtual ActionResult UploadFile(string ID, int FileID = -1)
        {
            throw new NotImplementedException();
        }

        public virtual ActionResult DownloadFile(string ID, int FileID = -1)
        {
            throw new NotImplementedException();
        }

        public virtual void ImageThumbnail(string ID, int FileID, int Width = 100)
        {
            throw new NotImplementedException();
        }

        public virtual ActionResult Empty(int ID)
        {
            throw new NotImplementedException();
        }

        protected virtual string GetCache(JsSelectOptions Options)
        {
            return null;
        }

        protected virtual void SetCache(string Json, JsSelectOptions Options)
        {
            return;
        }

        protected virtual EntityModel<DbContext> CreateModel()
        {
            return new EntityModel<DbContext>(db);
        }

        protected virtual string GetNextFileName(string FileName, string FolderPath)
        {
            Random rand = new Random();
            int code = Math.Abs(FileName.GetHashCode());
            string ext = System.IO.Path.GetExtension(FileName);
            string name = null;
            System.IO.FileInfo fi;

            for (int i = 0; i < 10; i++)
            {
                name = string.Format("{0}_{1}{2}{3}", DateTime.Now.ToString("yyyyMMddHHmmss"), code, rand.Next(0, 9), ext);
                fi = new System.IO.FileInfo(FolderPath + "/" + name);

                if (!fi.Exists)
                {
                    break;
                }

                System.Threading.Thread.CurrentThread.Join(1000);
            }

            return name;
        }

        protected virtual string GetUploadedFilesDirectoryName()
        {
            return "UploadedFiles";
        }

        protected virtual string GetUploadedFilesPath()
        {
            string result = string.Format("{0}/{1}", HttpRuntime.AppDomainAppPath, this.GetUploadedFilesDirectoryName());
            System.IO.DirectoryInfo di = new System.IO.DirectoryInfo(result);

            if (!di.Exists)
            {
                di.Create();
            }

            return result;
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            model.Dispose();
        }
    }
}
